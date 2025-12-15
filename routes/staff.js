const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Staff = require('../models/Staff');
const { auth, requireRole } = require('../middleware/auth');

// Ensure staff images directory exists
const staffDir = path.join(__dirname, '../assets/staff');
if (!fs.existsSync(staffDir)) {
    fs.mkdirSync(staffDir, { recursive: true });
}

// Multer configuration for staff images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, staffDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'staff-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const extname = allowed.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowed.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, webp) are allowed'));
    }
});

// GET all staff (public)
router.get('/', async (req, res) => {
    try {
        const staff = await Staff.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
        res.json(staff);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET all staff including inactive (admin only)
router.get('/all', auth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const staff = await Staff.find().sort({ order: 1, createdAt: 1 });
        res.json(staff);
    } catch (error) {
        console.error('Error fetching all staff:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST create new staff member
router.post('/', auth, requireRole('admin', 'manager'), upload.single('image'), async (req, res) => {
    try {
        const { name, role, description, icon, order, isActive } = req.body;
        
        const staffData = {
            name,
            role,
            description: description || '',
            icon: icon || 'fa-user-tie',
            order: order ? parseInt(order) : 0,
            isActive: isActive !== 'false'
        };

        if (req.file) {
            staffData.image = 'assets/staff/' + req.file.filename;
        }

        const staff = new Staff(staffData);
        await staff.save();

        res.status(201).json({ message: 'Staff member added', staff });
    } catch (error) {
        console.error('Error creating staff:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT update staff member
router.put('/:id', auth, requireRole('admin', 'manager'), upload.single('image'), async (req, res) => {
    try {
        const { name, role, description, icon, order, isActive } = req.body;
        
        const updateData = {
            name,
            role,
            description: description || '',
            icon: icon || 'fa-user-tie',
            order: order ? parseInt(order) : 0,
            isActive: isActive !== 'false'
        };

        if (req.file) {
            // Delete old image if exists
            const oldStaff = await Staff.findById(req.params.id);
            if (oldStaff && oldStaff.image) {
                const oldPath = path.join(__dirname, '..', oldStaff.image);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            updateData.image = 'assets/staff/' + req.file.filename;
        }

        const staff = await Staff.findByIdAndUpdate(req.params.id, updateData, { new: true });
        
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        res.json({ message: 'Staff updated', staff });
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE staff member
router.delete('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        // Delete image file if exists
        if (staff.image) {
            const imagePath = path.join(__dirname, '..', staff.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Staff.findByIdAndDelete(req.params.id);
        res.json({ message: 'Staff deleted' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
