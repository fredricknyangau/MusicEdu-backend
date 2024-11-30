const express = require('express');
const Category = require('../models/Category');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Route to add a new category
router.post('/categories', authenticateToken, authorizeAdmin,async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if category already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const newCategory = new Category({ name, description });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        console.error("Error creating category:", error); // Log error to console
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
});

// Route to fetch all categories
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
});

module.exports = router;
