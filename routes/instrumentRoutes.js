const express = require('express');
const Instrument = require('../models/Instrument');
const multer = require('multer');
const { createBlob } = require('@vercel/blob'); // Import Vercel Blob
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Setup multer for in-memory file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

// Helper function to upload files to Vercel Blob
const uploadFileToVercelBlob = async (file) => {
    const blob = await createBlob(file.buffer, {
        contentType: file.mimetype,
        access: 'public', // Make the file publicly accessible
    });
    return blob.url; // Return the public URL of the uploaded file
};

// Route to add a new instrument
router.post(
    '/',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'audio', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { name, description, historicalBackground, categories } = req.body;

            // Parse categories if sent as JSON string
            const parsedCategories = JSON.parse(categories);

            // Handle file uploads to Vercel Blob
            const image = req.files['image']
                ? await uploadFileToVercelBlob(req.files['image'][0])
                : null;
            const video = req.files['video']
                ? await uploadFileToVercelBlob(req.files['video'][0])
                : null;
            const audio = req.files['audio']
                ? await uploadFileToVercelBlob(req.files['audio'][0])
                : null;

            // Create a new instrument
            const newInstrument = new Instrument({
                name,
                description,
                historicalBackground,
                categories: parsedCategories,
                image,
                video,
                audio,
            });

            await newInstrument.save();
            res.status(201).json(newInstrument);
        } catch (error) {
            res.status(500).json({ message: 'Error creating instrument', error: error.message });
        }
    }
);

// Route to fetch all instruments
router.get('/', authenticateToken, async (req, res) => {
    try {
        const instruments = await Instrument.find().populate('categories');
        res.status(200).json(instruments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching instruments', error: error.message });
    }
});

// Get instrument by ID
router.get('/:id', async (req, res) => {
    try {
      const instrument = await Instrument.findById(req.params.id);
      if (!instrument) {
        return res.status(404).send('Instrument not found');
      }
      res.json(instrument);
    } catch (error) {
      res.status(500).send('Server error');
    }
});

// Route to update an instrument
router.put(
    '/:id',
    upload.fields([
        { name: 'image', maxCount: 1 },
        { name: 'video', maxCount: 1 },
        { name: 'audio', maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const updateData = {
                name: req.body.name,
                description: req.body.description,
                historicalBackground: req.body.historicalBackground,
                categories: req.body.categories ? JSON.parse(req.body.categories) : undefined,
            };

            // Check if files were uploaded and update file URLs accordingly
            if (req.files['image']) {
                updateData.image = await uploadFileToVercelBlob(req.files['image'][0]);
            }
            if (req.files['video']) {
                updateData.video = await uploadFileToVercelBlob(req.files['video'][0]);
            }
            if (req.files['audio']) {
                updateData.audio = await uploadFileToVercelBlob(req.files['audio'][0]);
            }

            const instrument = await Instrument.findByIdAndUpdate(req.params.id, updateData, { new: true });

            if (!instrument) {
                return res.status(404).send('Instrument not found');
            }

            res.json(instrument);
        } catch (error) {
            console.error('Error updating instrument:', error);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;