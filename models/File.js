import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    fileName: { 
        type: String, 
        required: true 
    },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    receiverId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    filePath: { 
        type: String, 
        required: true 
    },
    encryptedKey: { 
        type: String, 
        required: true 
    } 
}, { timestamps: true });

const File = mongoose.model('File', fileSchema);

export default File;
