const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            // Auth actions
            'login', 'logout', 'google_login', 'register', 'session_expired',
            // Booking actions
            'booking_create', 'booking_update', 'booking_cancel', 'booking_payment',
            // Admin actions
            'user_create', 'user_update', 'user_delete', 'settings_update',
            // Navigation
            'page_view'
        ]
    },
    category: {
        type: String,
        required: true,
        enum: ['auth', 'booking', 'admin', 'navigation'],
        index: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ip: {
        type: String
    },
    userAgent: {
        type: String
    },
    sessionId: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
activitySchema.index({ userId: 1, timestamp: -1 });
activitySchema.index({ category: 1, timestamp: -1 });

// Static method to log activity
activitySchema.statics.log = async function(data) {
    try {
        const activity = new this(data);
        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// Static method to get user's recent activity
activitySchema.statics.getUserActivity = async function(userId, limit = 50) {
    return this.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

// Static method to get dashboard stats
activitySchema.statics.getDashboardStats = async function() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Today's logins
    const todayLogins = await this.countDocuments({
        action: { $in: ['login', 'google_login'] },
        timestamp: { $gte: today }
    });
    
    // This week's active users (unique)
    const weeklyActiveUsers = await this.distinct('userId', {
        timestamp: { $gte: thisWeek }
    });
    
    // Total activities today
    const todayActivities = await this.countDocuments({
        timestamp: { $gte: today }
    });
    
    // Recent activity by category
    const categoryBreakdown = await this.aggregate([
        { $match: { timestamp: { $gte: thisWeek } } },
        { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    // Daily login trend (last 7 days)
    const loginTrend = await this.aggregate([
        {
            $match: {
                action: { $in: ['login', 'google_login'] },
                timestamp: { $gte: thisWeek }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    return {
        todayLogins,
        weeklyActiveUsers: weeklyActiveUsers.length,
        todayActivities,
        categoryBreakdown,
        loginTrend
    };
};

module.exports = mongoose.model('Activity', activitySchema);
