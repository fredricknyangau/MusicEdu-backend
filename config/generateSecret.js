const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');

function generateJWTSecret() {
    // Check if the .env file exists, if not create it
    if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, ''); // Create an empty .env file
    }

    const envContent = fs.readFileSync(envPath, 'utf8');

    // Check if JWT_SECRET exists in the .env file
    if (!envContent.includes('JWT_SECRET')) {
        const secret = crypto.randomBytes(64).toString('hex'); // Generate a 64-byte hex string
        fs.appendFileSync(envPath, `JWT_SECRET=${secret}\n`); // Append the JWT_SECRET to the .env file
        console.log('JWT_SECRET generated and added to .env');
    } else {
        console.log('JWT_SECRET already exists in .env');
    }
}

module.exports = generateJWTSecret;
