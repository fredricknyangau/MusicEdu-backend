const { createBlob } = require('@vercel/blob');

const uploadFileToVercelBlob = async (file) => {
    const blob = await createBlob(file.buffer, {
        contentType: file.mimetype,
        access: 'public', // Make the file publicly accessible
    });

    return blob.url; // Return the public URL of the uploaded file
};

module.exports = uploadFileToVercelBlob;