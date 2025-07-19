import multer from 'multer';
import path from 'path';
import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import User from '../models/User.js';
import File from '../models/File.js';
import {authMiddleWare} from '../middlewares/auth.js'

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension)
    }
});

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 50 * 1024 * 1024 
    }
});

router.post('/upload',authMiddleWare, upload.single('doc'), async (req, res) => {
    const { recvId } = req.body;

    const senderId = req.user.id
    
    try {
        // Validate input
        if (!req.file || !recvId) {
            return res.status(400).json({
                success: false,
                message: "File and receiver Id are required"
            });
        }

        // Find receiver
        const receiver = await User.findById(recvId);
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { publicKey } = receiver;

        const aesKey = crypto.randomBytes(32);
        const aesIv = crypto.randomBytes(16);


        console.log("File upload keys: ",aesKey);
        console.log("aesIv upload: ",aesIv);

        const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, aesIv);
        const inputFile = fs.createReadStream(req.file.path);
        const newFile = `enc-${req.file.filename}`;
        const encryptedFilePath = path.join('uploads/', newFile);
        const outputFile = fs.createWriteStream(encryptedFilePath);

        console.log(1);

        const encryptedStream = inputFile.pipe(cipher).pipe(outputFile);

        await new Promise((resolve, reject) => {
            outputFile.on('finish', resolve);
            outputFile.on('error', reject);
        });

        console.log(2)
        console.log(publicKey);
        const combinedKey = Buffer.concat([aesKey, aesIv]);
        const encryptedAesKey = crypto.publicEncrypt(publicKey, combinedKey);

        const fileRecord = new File({
            fileName: newFile,  
            senderId,
            receiverId: recvId,
            filePath: encryptedFilePath,
            encryptedKey: encryptedAesKey.toString('base64'),
        });

        console.log(3);
        console.log(fileRecord);
        await fileRecord.save();

        console.log(req.file.path);
        fs.unlinkSync(req.file.path);


        return res.status(200).json({
            success: true,
            message: "File uploaded successfully",
            fileId: fileRecord._id
        });

    } catch (error) {
        console.error('File Upload Error:', error);

        return res.status(500).json({
            success: false,
            message: "Error in file upload",
            errorDetails: error.message
        });
    }
});

//file download route
router.get('/download/:fileId', authMiddleWare, async (req, res) => {
    try {
        const fileRecord = await File.findById(req.params.fileId);
        if (!fileRecord) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const currentUserId = req.user.id;
        if (currentUserId.toString() !== fileRecord.receiverId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized download"
            });
        }

        const user = await User.findById(currentUserId);
        if (!user || !user.privateKey) {
            return res.status(401).json({
                success: false,
                message: "No decryption key available"
            });
        }

        // Decrypt AES key
        const encryptedKey = Buffer.from(fileRecord.encryptedKey, 'base64');
        let decryptedCombinedKey;
        try {
            decryptedCombinedKey = crypto.privateDecrypt(
                {
                    key: user.privateKey,
                    passphrase: '', 
                },
                encryptedKey
            );
        } catch (err) {
            console.error('Key Decryption Error:', err);
            return res.status(500).json({
                success: false,
                message: "Failed to decrypt AES key",
                errorDetails: err.message
            });
        }

        const aesKey = decryptedCombinedKey.subarray(0, 32); 
        const aesIv = decryptedCombinedKey.subarray(32); 

        console.log("decrypted aeskey:",aesKey);
        console.log("decrypted iv:",aesIv);

        const inputFilePath = fileRecord.filePath;
        const outputFilePath = path.join('downloads/', `decrypted-${fileRecord.fileName}`);
        try {
            const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, aesIv);
            const inputFile = fs.createReadStream(inputFilePath);
            const outputFile = fs.createWriteStream(outputFilePath);

            await new Promise((resolve, reject) => {
                inputFile.pipe(decipher).pipe(outputFile);
                outputFile.on('finish', resolve);
                outputFile.on('error', reject);
            });
        } catch (err) {
            console.error('File Decryption Error:', err);
            return res.status(500).json({
                success: false,
                message: "Error decrypting file",
                errorDetails: err.message
            });
        }

        res.download(outputFilePath, fileRecord.fileName, (err) => {
            if (err) {
                console.error('Download Error:', err);
            }
            fs.unlinkSync(outputFilePath);
        });
    } catch (error) {
        console.error('File Download Error:', error);
        return res.status(500).json({
            success: false,
            message: "Error downloading file",
            errorDetails: error.message
        });
    }
});

export { router }; 