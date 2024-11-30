const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

// Path to your .env file
const envPath = path.resolve(__dirname, '../.env');

// Function to generate and add RESET_TOKEN_SECRET to the .env file
function generateResetTokenSecret() {
    // Check if the .env file exists, if not create it
    if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, ''); // Create an empty .env file if not exists
    }

    const envContent = fs.readFileSync(envPath, 'utf8');

    // Check if RESET_TOKEN_SECRET exists in the .env file
    if (!envContent.includes('RESET_TOKEN_SECRET')) {
        const secret = crypto.randomBytes(32).toString('hex'); // Generate a 32-byte hex string
        fs.appendFileSync(envPath, `RESET_TOKEN_SECRET=${secret}\n`); // Append the RESET_TOKEN_SECRET to .env
        console.log('RESET_TOKEN_SECRET generated and added to .env');
    } else {
        console.log('RESET_TOKEN_SECRET already exists in .env');
    }
}

module.exports = generateResetTokenSecret;
