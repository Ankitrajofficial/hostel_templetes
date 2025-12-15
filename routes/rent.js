const express = require('express');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { auth, isAdminOrManager } = require('../middleware/auth');

const router = express.Router();

// Get current month in YYYY-MM format
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// @route   GET /api/rent/status
// @desc    Get rent status for all active students for a given month
// @access  Private (Admin, Manager)
router.get('/status', auth, isAdminOrManager, async (req, res) => {
    try {
        const month = req.query.month || getCurrentMonth();
        
        // Get all active students
        const students = await Student.find({ status: 'active' })
            .populate('userId', 'name email phone')
            .sort({ roomNumber: 1 });
        
        // Get payments for this month
        const payments = await Payment.find({ month });
        const paymentMap = {};
        payments.forEach(p => {
            paymentMap[p.studentId.toString()] = p;
        });
        
        // Build rent status for each student
        const rentStatus = students.map(student => {
            const payment = paymentMap[student._id.toString()];
            const dueDay = student.rentDueDay || 1;
            const today = new Date();
            const currentDay = today.getDate();
            const currentMonth = getCurrentMonth();
            
            let status = 'pending';
            if (payment) {
                status = payment.status;
            } else if (month === currentMonth && currentDay > dueDay) {
                status = 'overdue';
            }
            
            return {
                studentId: student._id,
                name: student.userId?.name || 'Unknown',
                phone: student.userId?.phone || '',
                room: student.roomNumber || '-',
                coaching: student.coaching || '-',
                monthlyRent: student.monthlyRent || 0,
                dueDay: dueDay,
                payment: payment ? {
                    amountPaid: payment.amountPaid,
                    paidDate: payment.paidDate,
                    paymentMethod: payment.paymentMethod
                } : null,
                status
            };
        });
        
        // Calculate summary stats
        const totalDue = rentStatus.reduce((sum, s) => sum + s.monthlyRent, 0);
        const totalPaid = rentStatus.reduce((sum, s) => sum + (s.payment?.amountPaid || 0), 0);
        const paidCount = rentStatus.filter(s => s.status === 'paid').length;
        const pendingCount = rentStatus.filter(s => s.status === 'pending').length;
        const overdueCount = rentStatus.filter(s => s.status === 'overdue').length;
        
        res.json({
            month,
            students: rentStatus,
            stats: {
                totalStudents: rentStatus.length,
                totalDue,
                totalPaid,
                totalPending: totalDue - totalPaid,
                paidCount,
                pendingCount,
                overdueCount
            }
        });
    } catch (error) {
        console.error('Get rent status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/rent/payment
// @desc    Record or update a payment
// @access  Private (Admin, Manager)
router.post('/payment', auth, isAdminOrManager, async (req, res) => {
    try {
        const { studentId, month, amountPaid, paymentMethod, transactionId, notes } = req.body;
        
        // Get student to get rent amount
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Find existing payment or create new
        let payment = await Payment.findOne({ studentId, month });
        
        if (payment) {
            // Update existing payment
            payment.amountPaid = amountPaid;
            payment.paymentMethod = paymentMethod || payment.paymentMethod;
            payment.transactionId = transactionId || payment.transactionId;
            payment.notes = notes || payment.notes;
            payment.paidDate = new Date();
            payment.recordedBy = req.user._id;
        } else {
            // Create new payment
            payment = new Payment({
                studentId,
                month,
                amountDue: student.monthlyRent || 0,
                amountPaid,
                paymentMethod,
                transactionId,
                notes,
                paidDate: new Date(),
                recordedBy: req.user._id
            });
        }
        
        await payment.save();
        
        res.json({
            message: 'Payment recorded successfully',
            payment
        });
    } catch (error) {
        console.error('Record payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/rent/history/:studentId
// @desc    Get payment history for a student
// @access  Private (Admin, Manager)
router.get('/history/:studentId', auth, isAdminOrManager, async (req, res) => {
    try {
        const payments = await Payment.find({ studentId: req.params.studentId })
            .sort({ month: -1 })
            .limit(12);
        
        const student = await Student.findById(req.params.studentId)
            .populate('userId', 'name email phone');
        
        res.json({
            student: student ? {
                id: student._id,
                name: student.userId?.name,
                room: student.roomNumber,
                monthlyRent: student.monthlyRent
            } : null,
            payments
        });
    } catch (error) {
        console.error('Get payment history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/rent/stats
// @desc    Get monthly collection statistics
// @access  Private (Admin, Manager)
router.get('/stats', auth, isAdminOrManager, async (req, res) => {
    try {
        const currentMonth = getCurrentMonth();
        
        // Get last 6 months of data
        const months = [];
        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        }
        
        const monthlyStats = await Promise.all(months.map(async (month) => {
            const payments = await Payment.find({ month });
            const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
            const paidCount = payments.filter(p => p.status === 'paid').length;
            
            return {
                month,
                totalPaid,
                paidCount,
                totalPayments: payments.length
            };
        }));
        
        res.json({
            currentMonth,
            monthlyStats
        });
    } catch (error) {
        console.error('Get rent stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
