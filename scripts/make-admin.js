// Script to make user an admin
const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  name: String
});

const User = mongoose.model('User', userSchema);

async function makeAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const result = await User.findOneAndUpdate(
      { email: 'ankitrajgupta02@gmail.com' },
      { role: 'admin' },
      { new: true }
    );
    
    if (result) {
      console.log('✅ User updated successfully!');
      console.log('Name:', result.name);
      console.log('Email:', result.email);
      console.log('Role:', result.role);
    } else {
      console.log('❌ User not found. Creating admin user...');
      const newUser = await User.create({
        email: 'ankitrajgupta02@gmail.com',
        name: 'Ankit Gupta',
        role: 'admin'
      });
      console.log('✅ Admin user created!');
      console.log('Name:', newUser.name);
      console.log('Email:', newUser.email);
      console.log('Role:', newUser.role);
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

makeAdmin();
