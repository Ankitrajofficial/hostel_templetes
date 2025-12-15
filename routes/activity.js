const express = require('express');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { auth, isAdmin, isAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/activity
// @desc    Get all activity logs with filters
// @access  Private (Admin only)
router.get('/', auth, isAdmin, async (req, res) => {
    try {
        const { 
            userId, 
            category, 
            action,
            startDate, 
            endDate, 
            page = 1, 
            limit = 50 
        } = req.query;
        
        // Build filter
        const filter = {};
        
        if (userId) filter.userId = userId;
        if (category) filter.category = category;
        if (action) filter.action = action;
        
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }
        
        // Get total count
        const total = await Activity.countDocuments(filter);
        
        // Get activities with pagination
        const activities = await Activity.find(filter)
            .populate('userId', 'name email role')
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();
        
        res.json({
            activities,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get activity error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/activity/stats
// @desc    Get dashboard stats
// @access  Private (Admin only)
router.get('/stats', auth, isAdmin, async (req, res) => {
    try {
        const stats = await Activity.getDashboardStats();
        
        // Get currently active users (logged in within last 30 mins)
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        const activeNow = await Activity.distinct('userId', {
            action: { $in: ['login', 'google_login', 'page_view'] },
            timestamp: { $gte: thirtyMinsAgo }
        });
        
        // Get active users with details
        const activeUsers = await User.find({ _id: { $in: activeNow } })
            .select('name email role')
            .lean();
        
        res.json({
            ...stats,
            activeNow: activeUsers.length,
            activeUsers
        });
    } catch (error) {
        console.error('Get activity stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/activity/user/:id
// @desc    Get specific user's activity
// @access  Private (Admin only)
router.get('/user/:id', auth, isAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        
        const user = await User.findById(req.params.id).select('name email role');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const total = await Activity.countDocuments({ userId: req.params.id });
        
        const activities = await Activity.find({ userId: req.params.id })
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();
        
        // Get user stats
        const loginCount = await Activity.countDocuments({
            userId: req.params.id,
            action: { $in: ['login', 'google_login'] }
        });
        
        const lastLogin = await Activity.findOne({
            userId: req.params.id,
            action: { $in: ['login', 'google_login'] }
        }).sort({ timestamp: -1 });
        
        res.json({
            user,
            stats: {
                totalActivities: total,
                loginCount,
                lastLogin: lastLogin?.timestamp
            },
            activities,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get user activity error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
