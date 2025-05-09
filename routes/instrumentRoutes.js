const express = require("express");
const Instrument = require("../models/Instrument");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const {
  authenticateToken,
  authorizeAdmin,
} = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to upload file to Cloudinary
const uploadFileToCloudinary = async (file, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "auto", // Auto determines the file type (image, video, audio)
          folder: folder, // Dynamic folder based on file type
        },
        (error, result) => {
          if (error) {
            console.error("Error uploading file to Cloudinary:", error);
            reject(error);
          } else {
            resolve(result.secure_url); // Return the secure URL of the uploaded file
          }
        }
      )
      .end(file.buffer);
  });
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

      // Upload files to Cloudinary (conditionally)
      const image = req.files["image"]
        ? await uploadFileToCloudinary(
            req.files["image"][0],
            "instruments/images"
          )
        : null;
      const video = req.files["video"]
        ? await uploadFileToCloudinary(
            req.files["video"][0],
            "instruments/videos"
          )
        : null;
      const audio = req.files["audio"]
        ? await uploadFileToCloudinary(
            req.files["audio"][0],
            "instruments/audios"
          )
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
      console.error("Error creating instrument:", error);
      res
        .status(500)
        .json({ message: "Error creating instrument", error: error.message });
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
    res
      .status(500)
      .json({ message: "Error fetching instruments", error: error.message });
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

      // Only upload files that are provided
      if (req.files["image"])
        updateData.image = await uploadFileToCloudinary(
          req.files["image"][0],
          "instruments/images"
        );
      if (req.files["video"])
        updateData.video = await uploadFileToCloudinary(
          req.files["video"][0],
          "instruments/videos"
        );
      if (req.files["audio"])
        updateData.audio = await uploadFileToCloudinary(
          req.files["audio"][0],
          "instruments/audios"
        );

      // Update the instrument
      const instrument = await Instrument.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      if (!instrument) {
        return res.status(404).json({ message: "Instrument not found" });
      }

      res.json(instrument);
    } catch (error) {
      console.error("Error updating instrument:", error);
      res
        .status(500)
        .json({ message: "Error updating instrument", error: error.message });
    }
  }
);

// Delete an instrument
router.delete("/:id", authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const instrument = await Instrument.findByIdAndDelete(req.params.id);

    if (!instrument) {
      return res.status(404).json({ message: "Instrument not found" });
    }

    res.status(200).json({ message: "Instrument deleted successfully" });
  } catch (error) {
    console.error("Error deleting instrument:", error);
    res
      .status(500)
      .json({ message: "Error deleting instrument", error: error.message });
  }
});

module.exports = router;
