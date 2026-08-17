require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateRole() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await User.findOneAndUpdate(
      { username: 'divyanshu' },
      { role: 'superadmin' },
      { new: true }
    );
    console.log('Updated user:', result.username, 'to role:', result.role);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

updateRole();
