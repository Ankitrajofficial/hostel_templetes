const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    // Personal Details
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    
    // Address
    address: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        trim: true
    },
    state: {
        type: String,
        trim: true
    },
    
    // Academic Details
    course: {
        type: String,
        enum: ['NEET', 'JEE', 'Foundation', 'Other'],
        default: 'NEET'
    },
    coaching: {
        type: String,
        enum: ['Allen', 'Resonance', 'Motion', 'Vibrant', 'Other', ''],
        default: ''
    },
    
    // Room Preference
    roomPreference: {
        type: String,
        enum: ['single', 'single_balcony', 'double', 'double_balcony', ''],
        default: ''
    },
    
    // Pickup Service
    pickupLocation: {
        type: String,
        enum: ['none', 'kota_junction', 'dakniya_talawa', 'bus_stand'],
        default: 'none'
    },
    
    // Additional Notes
    message: {
        type: String,
        trim: true
    },
    
    // Arrival Date (for trial stays)
    arrivalDate: {
        type: String,
        trim: true
    },
    
    // Number of Guests (for trial stays)
    numberOfGuests: {
        type: Number,
        default: 1
    },
    
    // Stay Duration in nights (for trial stays)
    stayDuration: {
        type: Number,
        default: 1
    },
    
    // Trial Stay Flag
    isTrialStay: {
        type: Boolean,
        default: false
    },
    
    // Query Status
    status: {
        type: String,
        enum: ['new', 'contacted', 'booked', 'converted', 'closed'],
        default: 'new'
    },
    
    // Admin Notes
    adminNotes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
querySchema.index({ status: 1 });
querySchema.index({ createdAt: -1 });
querySchema.index({ roomPreference: 1 });
querySchema.index({ isTrialStay: 1 });

module.exports = mongoose.model('Query', querySchema);
