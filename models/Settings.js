const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Site-wide settings key
    settingsKey: {
        type: String,
        default: 'main',
        unique: true
    },
    
    // Trial Stay Feature
    trialStay: {
        enabled: {
            type: Boolean,
            default: false
        },
        price: {
            type: Number,
            default: 500
        },
        title: {
            type: String,
            default: 'Try Before You Stay'
        },
        description: {
            type: String,
            default: 'Book a stay for just ₹500/night! Explore Kota, we will help you with admission. If you don\'t like our hostel, we will help you find another. Free pickup from station!'
        }
    },
    
    // Room Settings - Full Configuration
    rooms: {
        single: {
            name: { type: String, default: 'Single Room' },
            price: { type: Number, default: 13000 },
            description: { type: String, default: 'Your private sanctuary for focused NEET preparation. This comfortable single room comes with all essentials for a productive study environment.' },
            images: { type: [String], default: ['assets/room-1.png'] },
            available: { type: Boolean, default: true },
            enabled: { type: Boolean, default: true }
        },
        single_balcony: {
            name: { type: String, default: 'Single Room + Balcony' },
            price: { type: Number, default: 14000 },
            description: { type: String, default: 'Enjoy fresh air breaks between study sessions with your own private balcony. This premium single room includes all standard amenities plus a personal outdoor space.' },
            images: { type: [String], default: ['assets/room-1.png'] },
            available: { type: Boolean, default: true },
            enabled: { type: Boolean, default: true }
        },
        double: {
            name: { type: String, default: 'Double Room' },
            price: { type: Number, default: 10000 },
            description: { type: String, default: 'Share your journey with a like-minded future doctor. This spacious double room offers two comfortable beds, individual study desks, and all essential amenities.' },
            images: { type: [String], default: ['assets/room-1.png'] },
            available: { type: Boolean, default: true },
            enabled: { type: Boolean, default: true }
        },
        double_balcony: {
            name: { type: String, default: 'Double Room + Balcony' },
            price: { type: Number, default: 11000 },
            description: { type: String, default: 'Premium shared accommodation with a private balcony. Perfect for aspiring medical partners who want the best of both worlds.' },
            images: { type: [String], default: ['assets/room-1.png'] },
            available: { type: Boolean, default: true },
            enabled: { type: Boolean, default: true }
        }
    },
    
    // Website Images
    carouselImages: {
        type: [String],
        default: []
    },
    aboutImage: {
        type: String,
        default: ''
    },
    amenitiesImages: {
        type: [String],
        default: []
    },
    campusImages: {
        type: [String],
        default: []
    },
    
    // Weekly Menu Configuration
    weeklyMenu: {
        monday: {
            breakfast: { type: String, default: 'Poha, Chai' },
            lunch: { type: String, default: 'Paneer Masala, Roti, Rice, Dal' },
            dinner: { type: String, default: 'Mix Veg, Roti, Rice' },
            special: { type: Boolean, default: false }
        },
        tuesday: {
            breakfast: { type: String, default: 'Aloo Paratha, Curd' },
            lunch: { type: String, default: 'Chole Bhature' },
            dinner: { type: String, default: 'Dal Fry, Roti, Rice' },
            special: { type: Boolean, default: false }
        },
        wednesday: {
            breakfast: { type: String, default: 'Idli Sambar' },
            lunch: { type: String, default: 'Mix Veg, Rajma, Rice' },
            dinner: { type: String, default: 'Aloo Gobi, Dal, Roti' },
            special: { type: Boolean, default: false }
        },
        thursday: {
            breakfast: { type: String, default: 'Upma, Chai' },
            lunch: { type: String, default: 'Aloo Jeera, Dal Tadka, Rice' },
            dinner: { type: String, default: 'Paneer Butter, Roti, Rice' },
            special: { type: Boolean, default: false }
        },
        friday: {
            breakfast: { type: String, default: 'Puri Bhaji' },
            lunch: { type: String, default: 'Special Thali' },
            dinner: { type: String, default: 'Kadhi Pakora, Rice, Roti' },
            special: { type: Boolean, default: true }
        },
        saturday: {
            breakfast: { type: String, default: 'Dosa, Chutney' },
            lunch: { type: String, default: 'South Indian Thali' },
            dinner: { type: String, default: 'Dal Makhani, Jeera Rice' },
            special: { type: Boolean, default: false }
        },
        sunday: {
            breakfast: { type: String, default: 'Chole Bhature' },
            lunch: { type: String, default: 'Feast Day Special' },
            dinner: { type: String, default: 'Shahi Paneer, Biryani' },
            special: { type: Boolean, default: true }
        }
    },
    
    // Future settings can be added here
    // offerBanner: { enabled, text, image }
    // etc.
    
}, { timestamps: true });

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne({ settingsKey: 'main' });
    if (!settings) {
        settings = await this.create({ settingsKey: 'main' });
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
