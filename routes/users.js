const express = require('express');
const User = require('../models/User');
const { auth, isAdmin, isAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (admin/manager only)
// @access  Private (Admin, Manager)
router.get('/', auth, isAdminOrManager, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users
// @desc    Create new user (admin can create any role, manager can create students only)
// @access  Private (Admin, Manager)
router.post('/', auth, isAdminOrManager, async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;
        
        // Managers can only create students
        const targetRole = role || 'student';
        if (req.user.role === 'manager' && targetRole !== 'student') {
            return res.status(403).json({ message: 'Managers can only create student accounts' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create new user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password,
            phone,
            role: targetRole
        });

        await user.save();

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put('/:id', auth, isAdmin, async (req, res) => {
    try {
        const { name, email, role, isActive } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent deactivating yourself
        if (req.user._id.toString() === req.params.id && isActive === false) {
            return res.status(400).json({ message: 'Cannot deactivate your own account' });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;

        await user.save();

        res.json({
            message: 'User updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private (Admin)
router.delete('/:id', auth, isAdmin, async (req, res) => {
    try {
        // Prevent deleting yourself
        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/users/:id/reset-password
// @desc    Reset user password (admin only)
// @access  Private (Admin)
router.post('/:id/reset-password', auth, isAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
