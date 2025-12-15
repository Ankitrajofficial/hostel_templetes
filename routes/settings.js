const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Settings = require('../models/Settings');
const { auth, requireRole, blockViewerWrites } = require('../middleware/auth');

// Multer configuration for room images
const roomImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/rooms/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const roomImageUpload = multer({
    storage: roomImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files allowed'));
    }
});
// GET /api/settings - Public endpoint to get settings
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/settings - Admin only, update settings
router.put('/', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        // Update trialStay settings
        if (req.body.trialStay !== undefined) {
            if (req.body.trialStay.enabled !== undefined) {
                settings.trialStay.enabled = req.body.trialStay.enabled;
            }
            if (req.body.trialStay.price !== undefined) {
                settings.trialStay.price = req.body.trialStay.price;
            }
            if (req.body.trialStay.title !== undefined) {
                settings.trialStay.title = req.body.trialStay.title;
            }
            if (req.body.trialStay.description !== undefined) {
                settings.trialStay.description = req.body.trialStay.description;
            }
        }
        
        // Update room settings
        if (req.body.rooms !== undefined) {
            const roomTypes = ['single', 'single_balcony', 'double', 'double_balcony'];
            roomTypes.forEach(type => {
                if (req.body.rooms[type]) {
                    if (req.body.rooms[type].name !== undefined) {
                        settings.rooms[type].name = req.body.rooms[type].name;
                    }
                    if (req.body.rooms[type].price !== undefined) {
                        settings.rooms[type].price = req.body.rooms[type].price;
                    }
                    if (req.body.rooms[type].description !== undefined) {
                        settings.rooms[type].description = req.body.rooms[type].description;
                    }
                    if (req.body.rooms[type].images !== undefined) {
                        settings.rooms[type].images = req.body.rooms[type].images;
                    }
                    if (req.body.rooms[type].available !== undefined) {
                        settings.rooms[type].available = req.body.rooms[type].available;
                    }
                    if (req.body.rooms[type].enabled !== undefined) {
                        settings.rooms[type].enabled = req.body.rooms[type].enabled;
                    }
                }
            });
        }
        
        // Update weekly menu settings
        if (req.body.weeklyMenu !== undefined) {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            days.forEach(day => {
                if (req.body.weeklyMenu[day]) {
                    if (req.body.weeklyMenu[day].breakfast !== undefined) {
                        settings.weeklyMenu[day].breakfast = req.body.weeklyMenu[day].breakfast;
                    }
                    if (req.body.weeklyMenu[day].lunch !== undefined) {
                        settings.weeklyMenu[day].lunch = req.body.weeklyMenu[day].lunch;
                    }
                    if (req.body.weeklyMenu[day].dinner !== undefined) {
                        settings.weeklyMenu[day].dinner = req.body.weeklyMenu[day].dinner;
                    }
                    if (req.body.weeklyMenu[day].special !== undefined) {
                        settings.weeklyMenu[day].special = req.body.weeklyMenu[day].special;
                    }
                }
            });
        }
        
        await settings.save();
        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/settings/room-image/:roomType - Upload room image
router.post('/room-image/:roomType', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, roomImageUpload.single('image'), async (req, res) => {
    try {
        const { roomType } = req.params;
        const validTypes = ['single', 'single_balcony', 'double', 'double_balcony'];
        
        if (!validTypes.includes(roomType)) {
            return res.status(400).json({ message: 'Invalid room type' });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        
        const imagePath = 'assets/rooms/' + req.file.filename;
        
        // Update settings
        const settings = await Settings.getSettings();
        if (!settings.rooms[roomType].images) {
            settings.rooms[roomType].images = [];
        }
        
        // Limit to 4 images per room
        if (settings.rooms[roomType].images.length >= 4) {
             return res.status(400).json({ message: 'Maximum 4 images allowed per room. Remove one first.' });
        }

        settings.rooms[roomType].images.push(imagePath);
        await settings.save();
        
        res.json({ 
            message: 'Image uploaded successfully',
            imagePath: imagePath,
            images: settings.rooms[roomType].images
        });
    } catch (error) {
        console.error('Error uploading room image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/settings/room-image/:roomType - Remove room image
router.delete('/room-image/:roomType', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, async (req, res) => {
    try {
        const { roomType } = req.params;
        const { imagePath } = req.body;
        
        console.log(`Received delete request for room ${roomType}, image: ${imagePath}`);
        
        const settings = await Settings.getSettings();
        if (settings.rooms[roomType]?.images) {
            const initialCount = settings.rooms[roomType].images.length;
            settings.rooms[roomType].images = settings.rooms[roomType].images.filter(img => img !== imagePath);
            console.log(`Filtered images. Before: ${initialCount}, After: ${settings.rooms[roomType].images.length}`);
            
            await settings.save();
        }
        
        res.json({ message: 'Image removed', images: settings.rooms[roomType].images });
    } catch (error) {
        console.error('Error removing room image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// =========================================
// Website Image Management Routes
// =========================================

// Carousel image storage
const carouselStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/carousel/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'carousel-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const carouselUpload = multer({
    storage: carouselStorage,
    limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files allowed'));
    }
});

// About image storage
const aboutStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/about/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'about-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const aboutUpload = multer({
    storage: aboutStorage,
    limits: { fileSize: 500 * 1024 }, // 500KB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files allowed'));
    }
});

// POST /api/settings/carousel - Upload carousel image
router.post('/carousel', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, carouselUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        
        const imagePath = 'assets/carousel/' + req.file.filename;
        const settings = await Settings.getSettings();
        
        // Limit to 5 carousel images
        if (settings.carouselImages.length >= 5) {
            return res.status(400).json({ message: 'Maximum 5 carousel images allowed. Remove one first.' });
        }
        
        settings.carouselImages.push(imagePath);
        await settings.save();
        
        res.json({ 
            message: 'Carousel image uploaded',
            imagePath: imagePath,
            images: settings.carouselImages
        });
    } catch (error) {
        console.error('Error uploading carousel image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/settings/carousel - Remove carousel image
router.delete('/carousel', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, async (req, res) => {
    try {
        const { imagePath } = req.body;
        const settings = await Settings.getSettings();
        
        settings.carouselImages = settings.carouselImages.filter(img => img !== imagePath);
        await settings.save();
        
        res.json({ message: 'Carousel image removed', images: settings.carouselImages });
    } catch (error) {
        console.error('Error removing carousel image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/settings/about-image - Upload about page image
router.post('/about-image', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, aboutUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        
        const imagePath = 'assets/about/' + req.file.filename;
        const settings = await Settings.getSettings();
        
        settings.aboutImage = imagePath;
        await settings.save();
        
        res.json({ 
            message: 'About image uploaded',
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Error uploading about image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Amenities image storage
const amenitiesStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/amenities/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'amenities-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const amenitiesUpload = multer({
    storage: amenitiesStorage,
    limits: { fileSize: 500 * 1024 }, // 500KB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files allowed'));
    }
});

// Campus image storage
const campusStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/campus/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'campus-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const campusUpload = multer({
    storage: campusStorage,
    limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files allowed'));
    }
});

// POST /api/settings/amenities - Upload amenities image
router.post('/amenities', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, amenitiesUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        
        const imagePath = 'assets/amenities/' + req.file.filename;
        const settings = await Settings.getSettings();
        
        // Limit to 6 amenities images
        if (settings.amenitiesImages.length >= 6) {
            return res.status(400).json({ message: 'Maximum 6 amenities images allowed. Remove one first.' });
        }
        
        settings.amenitiesImages.push(imagePath);
        await settings.save();
        
        res.json({ 
            message: 'Amenities image uploaded',
            imagePath: imagePath,
            images: settings.amenitiesImages
        });
    } catch (error) {
        console.error('Error uploading amenities image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/settings/amenities - Remove amenities image
router.delete('/amenities', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, async (req, res) => {
    try {
        const { imagePath } = req.body;
        const settings = await Settings.getSettings();
        
        settings.amenitiesImages = settings.amenitiesImages.filter(img => img !== imagePath);
        await settings.save();
        
        res.json({ message: 'Amenities image removed', images: settings.amenitiesImages });
    } catch (error) {
        console.error('Error removing amenities image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/settings/campus - Upload campus image
router.post('/campus', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, campusUpload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        
        const imagePath = 'assets/campus/' + req.file.filename;
        const settings = await Settings.getSettings();
        
        // Limit to 4 campus images
        if (settings.campusImages.length >= 4) {
            return res.status(400).json({ message: 'Maximum 4 campus images allowed. Remove one first.' });
        }
        
        settings.campusImages.push(imagePath);
        await settings.save();
        
        res.json({ 
            message: 'Campus image uploaded',
            imagePath: imagePath,
            images: settings.campusImages
        });
    } catch (error) {
        console.error('Error uploading campus image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/settings/campus - Remove campus image
router.delete('/campus', auth, requireRole('admin', 'manager', 'viewer'), blockViewerWrites, async (req, res) => {
    try {
        const { imagePath } = req.body;
        const settings = await Settings.getSettings();
        
        settings.campusImages = settings.campusImages.filter(img => img !== imagePath);
        await settings.save();
        
        res.json({ message: 'Campus image removed', images: settings.campusImages });
    } catch (error) {
        console.error('Error removing campus image:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
