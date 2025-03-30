const express = require("express");
const Instrument = require("../models/Instrument");
const multer = require("multer");
const { createBlob } = require("@vercel/blob");
const { authenticateToken, authorizeAdmin } = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFileToVercelBlob = async (file) => {
    const blob = await createBlob(`instruments/${file.originalname}`, file.buffer, {
        contentType: file.mimetype,
        access: "public",
        project: process.env.VERCEL_PROJECT_ID, // Include project ID
    });
    return blob.url;
};

// Route to add a new instrument
router.post(
    "/",
    authenticateToken,
    authorizeAdmin,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const { name, description, historicalBackground, categories } = req.body;
            const parsedCategories = categories ? JSON.parse(categories) : [];

            const image = req.files["image"] ? await uploadFileToVercelBlob(req.files["image"][0]) : null;
            const video = req.files["video"] ? await uploadFileToVercelBlob(req.files["video"][0]) : null;
            const audio = req.files["audio"] ? await uploadFileToVercelBlob(req.files["audio"][0]) : null;

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
            console.error("Error creating instrument:", error);
            res.status(500).json({ message: "Error creating instrument", error: error.message });
        }
    }
);

// Fetch all instruments
router.get("/", authenticateToken, async (req, res) => {
    try {
        const instruments = await Instrument.find().populate("categories");
        res.status(200).json(instruments);
    } catch (error) {
        console.error("Error fetching instruments:", error);
        res.status(500).json({ message: "Error fetching instruments", error: error.message });
    }
});

// Get instrument by ID
router.get("/:id", async (req, res) => {
    try {
        const instrument = await Instrument.findById(req.params.id);
        if (!instrument) {
            return res.status(404).json({ message: "Instrument not found" });
        }
        res.json(instrument);
    } catch (error) {
        console.error("Error fetching instrument:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Update an instrument
router.put(
    "/:id",
    authenticateToken,
    authorizeAdmin,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "video", maxCount: 1 },
        { name: "audio", maxCount: 1 },
    ]),
    async (req, res) => {
        try {
            const updateData = {
                name: req.body.name,
                description: req.body.description,
                historicalBackground: req.body.historicalBackground,
                categories: req.body.categories ? JSON.parse(req.body.categories) : [],
            };

            if (req.files["image"]) updateData.image = await uploadFileToVercelBlob(req.files["image"][0]);
            if (req.files["video"]) updateData.video = await uploadFileToVercelBlob(req.files["video"][0]);
            if (req.files["audio"]) updateData.audio = await uploadFileToVercelBlob(req.files["audio"][0]);

            const instrument = await Instrument.findByIdAndUpdate(req.params.id, updateData, { new: true });

            if (!instrument) {
                return res.status(404).json({ message: "Instrument not found" });
            }

            res.json(instrument);
        } catch (error) {
            console.error("Error updating instrument:", error);
            res.status(500).json({ message: "Server error" });
        }
    }
);

module.exports = router;