const express = require('express');
const Instrument = require('../models/Instrument');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Setup multer for file uploads (image, video, audio)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Route to add a new instrument
router.post('/', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, description, historicalBackground, categories } = req.body;

        // Parse categories if sent as JSON string
        const parsedCategories = JSON.parse(categories);

        //handle file paths
        const image = req.files['image'][0].path;
        const video = req.files['video'] ? req.files['video'][0].path : null;
        const audio = req.files['audio'] ? req.files['audio'][0].path : null;

        // Create a new instrument
        const newInstrument = new Instrument({
            name,
            description,
            historicalBackground,
            categories: parsedCategories,
            image,
            video,
            audio
        });

        await newInstrument.save();
        res.status(201).json(newInstrument);
    } catch (error) {
        res.status(500).json({ message: 'Error creating instrument', error: error.message });
    }
});

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

// Update instrument by ID with multer for handling file uploads
router.put('/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]), async (req, res) => {
    try {
        const updateData = {
            name: req.body.name,
            description: req.body.description,
            historicalBackground: req.body.historicalBackground,
            categories: req.body.categories ? JSON.parse(req.body.categories) : undefined,
        };

        // Check if files were uploaded and update file paths accordingly
        if (req.files['image']) {
            updateData.image = req.files['image'][0].path;
        }
        if (req.files['video']) {
            updateData.video = req.files['video'][0].path;
        }
        if (req.files['audio']) {
            updateData.audio = req.files['audio'][0].path;
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
});

module.exports = router;