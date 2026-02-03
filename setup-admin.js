require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function setupAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected');

    // Check if admin already exists by username or email
    let user = await User.findOne({
      $or: [
        { username: 'admin' },
        { email: 'admin@portfolio.com' }
      ]
    });

    if (user) {
      console.log('User already exists. Updating to admin and resetting password...');
      user.username = 'admin';
      user.email = 'admin@portfolio.com';
      user.password = 'Admin123!';
      user.role = 'admin';
      await user.save();
    } else {
      // Create admin user
      user = new User({
        username: 'admin',
        email: 'admin@portfolio.com',
        password: 'Admin123!',
        role: 'admin'
      });
      await user.save();
      console.log('Admin user created successfully!');
    }

    console.log('==============================');
    console.log('Username: admin');
    console.log('Email: admin@portfolio.com');
    console.log('Password: Admin123!');
    console.log('==============================');
    console.log('IMPORTANT: Change the password immediately after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();