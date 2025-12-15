require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createViewer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if viewer already exists
        const existingViewer = await User.findOne({ email: 'demo@mkheight.com' });
        if (existingViewer) {
            console.log('❌ Demo viewer user already exists');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📧 Email: demo@mkheight.com');
            console.log('🔑 Password: demo123');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            process.exit(0);
        }

        // Create viewer user
        const viewer = new User({
            name: 'Demo User',
            email: 'demo@mkheight.com',
            password: 'demo123',
            role: 'viewer',
            isActive: true
        });

        await viewer.save();

        console.log('✅ Demo viewer user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: demo@mkheight.com');
        console.log('🔑 Password: demo123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ℹ️  This is a READ-ONLY account for demo purposes.');
        console.log('   Users can view but cannot make any changes.');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating viewer:', error);
        process.exit(1);
    }
};

createViewer();
