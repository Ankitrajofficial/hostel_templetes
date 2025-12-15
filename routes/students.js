const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Student = require('../models/Student');
const { auth, isAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Configure multer for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'students');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `student_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files allowed (jpeg, jpg, png, webp)'));
    }
});

// @route   GET /api/students
// @desc    Get all students with their details
// @access  Private (Admin, Manager)
router.get('/', auth, isAdminOrManager, async (req, res) => {
    try {
        const { status, coaching, roomNumber, search } = req.query;
        
        // Build student filter
        const studentFilter = {};
        if (status) studentFilter.status = status;
        if (coaching) studentFilter.coaching = new RegExp(coaching, 'i');
        if (roomNumber) studentFilter.roomNumber = roomNumber;
        
        let students = await Student.find(studentFilter)
            .populate('userId', 'name email phone isActive')
            .sort({ createdAt: -1 });
        
        // Apply search filter on populated fields
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            students = students.filter(s => 
                searchRegex.test(s.userId?.name) || 
                searchRegex.test(s.userId?.email) ||
                searchRegex.test(s.roomNumber) ||
                searchRegex.test(s.fatherName)
            );
        }
        
        res.json(students);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/students/:id
// @desc    Get single student details
// @access  Private (Admin, Manager)
router.get('/:id', auth, isAdminOrManager, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('userId', 'name email phone isActive createdAt');
        
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        res.json(student);
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/students
// @desc    Create new student with all details
// @access  Private (Admin, Manager)
router.post('/', auth, isAdminOrManager, upload.single('photo'), async (req, res) => {
    try {
        const {
            // User details
            name, email, phone, password,
            // Personal details
            fatherName, motherName, dateOfBirth, gender, bloodGroup, aadharNumber,
            // Contact details
            address, city, state, pincode,
            emergencyContactName, emergencyContactPhone, emergencyContactRelation,
            // Hostel details
            roomNumber, roomType, joiningDate, checkoutDate,
            monthlyRent, rentDueDay,
            // Academic details
            coaching, course, batch, targetExam,
            // Notes
            notes
        } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'A user with this email already exists' });
        }
        
        // Create user account
        const user = new User({
            name,
            email: email.toLowerCase(),
            phone,
            password: password || `student_${Date.now()}`, // Generate password if not provided
            role: 'student'
        });
        await user.save();
        
        // Create student profile
        const student = new Student({
            userId: user._id,
            fatherName,
            motherName,
            dateOfBirth: dateOfBirth || null,
            gender,
            bloodGroup,
            aadharNumber,
            address,
            city,
            state,
            pincode,
            emergencyContact: {
                name: emergencyContactName,
                phone: emergencyContactPhone,
                relation: emergencyContactRelation
            },
            roomNumber,
            roomType,
            joiningDate: joiningDate || new Date(),
            checkoutDate: checkoutDate || null,
            monthlyRent: monthlyRent || 0,
            rentDueDay: rentDueDay || 1,
            coaching,
            course,
            batch,
            targetExam,
            photoUrl: req.file ? `/uploads/students/${req.file.filename}` : null,
            notes
        });
        await student.save();
        
        res.status(201).json({
            message: 'Student registered successfully',
            student: await Student.findById(student._id).populate('userId', 'name email phone')
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @route   PUT /api/students/:id
// @desc    Update student details
// @access  Private (Admin, Manager)
router.put('/:id', auth, isAdminOrManager, upload.single('photo'), async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        const {
            // User details
            name, phone,
            // Personal details
            fatherName, motherName, dateOfBirth, gender, bloodGroup, aadharNumber,
            // Contact details
            address, city, state, pincode,
            emergencyContactName, emergencyContactPhone, emergencyContactRelation,
            // Hostel details
            roomNumber, roomType, joiningDate, checkoutDate,
            monthlyRent, rentDueDay,
            // Academic details
            coaching, course, batch, targetExam,
            // Status & Notes
            status, notes
        } = req.body;
        
        // Update user info
        if (name || phone) {
            await User.findByIdAndUpdate(student.userId, { 
                ...(name && { name }), 
                ...(phone && { phone }) 
            });
        }
        
        // Update student profile
        const updateData = {
            fatherName, motherName, dateOfBirth, gender, bloodGroup, aadharNumber,
            address, city, state, pincode,
            emergencyContact: {
                name: emergencyContactName,
                phone: emergencyContactPhone,
                relation: emergencyContactRelation
            },
            roomNumber, roomType, joiningDate, checkoutDate,
            monthlyRent, rentDueDay,
            coaching, course, batch, targetExam,
            status, notes
        };
        
        // Update photo if uploaded
        if (req.file) {
            // Delete old photo if exists
            if (student.photoUrl) {
                const oldPath = path.join(__dirname, '..', student.photoUrl);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            updateData.photoUrl = `/uploads/students/${req.file.filename}`;
        }
        
        // Remove undefined values
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) delete updateData[key];
        });
        
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('userId', 'name email phone');
        
        res.json({
            message: 'Student updated successfully',
            student: updatedStudent
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/students/:id
// @desc    Delete student (soft delete - set status to checkout)
// @access  Private (Admin only)
router.delete('/:id', auth, isAdminOrManager, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Soft delete - mark as checkout
        student.status = 'checkout';
        student.checkoutDate = new Date();
        await student.save();
        
        // Deactivate user account
        await User.findByIdAndUpdate(student.userId, { isActive: false });
        
        res.json({ message: 'Student checked out successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/students/stats/summary
// @desc    Get student statistics
// @access  Private (Admin, Manager)
router.get('/stats/summary', auth, isAdminOrManager, async (req, res) => {
    try {
        const total = await Student.countDocuments();
        const active = await Student.countDocuments({ status: 'active' });
        const checkout = await Student.countDocuments({ status: 'checkout' });
        
        // Count by coaching
        const byCoaching = await Student.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$coaching', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        // Count by room type
        const byRoomType = await Student.aggregate([
            { $match: { status: 'active' } },
            { $group: { _id: '$roomType', count: { $sum: 1 } } }
        ]);
        
        res.json({
            total,
            active,
            checkout,
            byCoaching,
            byRoomType
        });
    } catch (error) {
        console.error('Get student stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
