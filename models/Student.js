const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    // Link to User model
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    
    // Personal Details
    fatherName: {
        type: String,
        trim: true
    },
    motherName: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
    },
    aadharNumber: {
        type: String,
        trim: true
    },
    
    // Contact Details
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
    pincode: {
        type: String,
        trim: true
    },
    emergencyContact: {
        name: String,
        phone: String,
        relation: String
    },
    
    // Hostel Details
    roomNumber: {
        type: String,
        trim: true
    },
    roomType: {
        type: String,
        enum: ['single', 'single_balcony', 'double', 'double_balcony', ''],
        default: ''
    },
    joiningDate: {
        type: Date
    },
    checkoutDate: {
        type: Date
    },
    
    // Rent Details
    monthlyRent: {
        type: Number,
        default: 0
    },
    rentDueDay: {
        type: Number,
        default: 1,
        min: 1,
        max: 28
    },
    
    // Academic Details
    coaching: {
        type: String,
        trim: true
    },
    course: {
        type: String,
        trim: true
    },
    batch: {
        type: String,
        trim: true
    },
    targetExam: {
        type: String,
        trim: true
    },
    
    // Photo
    photoUrl: {
        type: String
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'checkout', 'pending'],
        default: 'active'
    },
    
    // Notes
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Index for better query performance
studentSchema.index({ roomNumber: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ coaching: 1 });

module.exports = mongoose.model('Student', studentSchema);
