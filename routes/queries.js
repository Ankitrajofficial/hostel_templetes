const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const { auth } = require('../middleware/auth');

// @route   POST /api/queries
// @desc    Submit a new booking query (public)
// @access  Public
router.post('/', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            address,
            city,
            state,
            course,
            coaching,
            roomPreference,
            pickupLocation,
            message
        } = req.body;

        // Validate required fields
        if (!name || !email || !phone) {
            return res.status(400).json({ 
                message: 'Name, email, and phone are required' 
            });
        }

        const newQuery = new Query({
            name,
            email,
            phone,
            address,
            city,
            state,
            course,
            coaching,
            roomPreference,
            pickupLocation,
            message,
            arrivalDate: req.body.arrivalDate || null,
            numberOfGuests: parseInt(req.body.numberOfGuests) || 1,
            stayDuration: parseInt(req.body.stayDuration) || 1,
            isTrialStay: req.body.isTrialStay || false,
            status: 'new'
        });

        await newQuery.save();

        res.status(201).json({ 
            message: 'Your booking query has been submitted successfully! We will contact you soon.',
            query: newQuery 
        });
    } catch (error) {
        console.error('Error creating query:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// @route   GET /api/queries
// @desc    Get all queries (admin only)
// @access  Private (Admin/Manager)
router.get('/', auth, async (req, res) => {
    try {
        const { status, limit = 50, page = 1, trial } = req.query;
        
        const filter = {};
        if (status) filter.status = status;
        if (trial === 'true') filter.isTrialStay = true;
        if (trial === 'false') filter.isTrialStay = { $ne: true };

        const queries = await Query.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Query.countDocuments(filter);

        // Get stats
        const stats = await Query.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statsObj = {
            new: 0,
            contacted: 0,
            converted: 0,
            closed: 0,
            total: total
        };

        stats.forEach(s => {
            statsObj[s._id] = s.count;
        });

        res.json({
            queries,
            stats: statsObj,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                count: queries.length
            }
        });
    } catch (error) {
        console.error('Error fetching queries:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/queries/:id
// @desc    Get single query by ID
// @access  Private (Admin/Manager)
router.get('/:id', auth, async (req, res) => {
    try {
        const query = await Query.findById(req.params.id);
        
        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        res.json(query);
    } catch (error) {
        console.error('Error fetching query:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/queries/:id
// @desc    Update query status (admin only)
// @access  Private (Admin/Manager)
router.patch('/:id', auth, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;
        
        const updateData = {};
        if (status) updateData.status = status;
        if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

        const query = await Query.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        res.json({ message: 'Query updated successfully', query });
    } catch (error) {
        console.error('Error updating query:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/queries/:id
// @desc    Delete a query (admin only)
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        // Only admin can delete
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete queries' });
        }

        const query = await Query.findByIdAndDelete(req.params.id);

        if (!query) {
            return res.status(404).json({ message: 'Query not found' });
        }

        res.json({ message: 'Query deleted successfully' });
    } catch (error) {
        console.error('Error deleting query:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
