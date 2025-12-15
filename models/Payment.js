const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    
    // Month this payment is for (format: "YYYY-MM")
    month: {
        type: String,
        required: true
    },
    
    // Amount expected and paid
    amountDue: {
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    
    // Status
    status: {
        type: String,
        enum: ['pending', 'paid', 'partial', 'overdue'],
        default: 'pending'
    },
    
    // Payment details
    paidDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'upi', 'bank_transfer', 'cheque', ''],
        default: ''
    },
    transactionId: {
        type: String,
        trim: true
    },
    
    // Notes
    notes: {
        type: String
    },
    
    // Who recorded this payment
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Compound index for unique student-month combination
paymentSchema.index({ studentId: 1, month: 1 }, { unique: true });
paymentSchema.index({ month: 1, status: 1 });

// Auto-update status based on amounts
paymentSchema.pre('save', function() {
    if (this.amountPaid >= this.amountDue) {
        this.status = 'paid';
    } else if (this.amountPaid > 0) {
        this.status = 'partial';
    }
});

module.exports = mongoose.model('Payment', paymentSchema);
