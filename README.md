# SecureShare
This repo consists of my Cryptography course project which involves safe transfer of files between users using cryptographic encryptions.

## Features
- **User Authentication**: Users can register and log in securely.
- **File Encryption**: All files are encrypted using AES (Advanced Encryption Standard).
- **Secure Key Exchange**: Utilizes RSA (Rivest-Shamir-Adleman) for secure key exchange between users.
- **User Interface**: A simple and intuitive interface for sending and receiving messages.

## Code Flow
1. **User Registration and Login**:
   - Users can create an account, which securely stores their credentials.
   - Upon login, the system verifies the user's identity.

2. **File Sending**:
   - When a user sends a file, the application encrypts the file using the recipient's public key.
   - The encrypted file is then sent over the network.

3. **File Receiving**:
   - The recipient receives the encrypted file and uses their private key to decrypt it.
   - The decrypted file is made available for download in the user interface.

4. **Key Management**:
   - The application manages public and private keys for each user, ensuring that keys are stored securely.

## Installation
To set up the project locally, follow these steps:
1. Clone the repository:
   ```bash
   git clone https://github.com/rohithvarma444/SecureShare.git
   ```
2. Navigate to the project directory:
   ```bash
   cd SecureShare
   ```
3. Install the required dependencies:
   ```bash
   npm i
   ```

## Usage
To run the application, execute:
```bash
node app.py
```
## .env
```bash
JWT_SECRET=<secret_key>
MONGO_URI=<mongoDb-connection-url>

```

