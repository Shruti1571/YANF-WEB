const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  try {
    const rawUsers = process.env.ADMIN_USERS;
    let adminAccounts = [];

    if (rawUsers) {
      adminAccounts = rawUsers.split(',').map(entry => {
        const [username, password, email] = entry.split(':');
        return { username, password, email };
      });
    } else {
      adminAccounts = [{
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'yanf2026',
        email: process.env.ADMIN_EMAIL || 'aditya@yanfglobal.com'
      }];
    }

    for (const acc of adminAccounts) {
      if (!acc.username || !acc.password || !acc.email) continue;

      const cleanUsername = acc.username.toLowerCase().trim();
      const cleanEmail = acc.email.toLowerCase().trim();

      // Check for existing user by username OR email
      let userByUsername = await User.findOne({ username: cleanUsername });
      let userByEmail = await User.findOne({ email: cleanEmail });

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(acc.password, salt);

      if (!userByUsername && !userByEmail) {
        // Create new admin user
        await User.create({
          username: cleanUsername,
          passwordHash: passwordHash,
          email: cleanEmail,
          role: 'admin'
        });
        console.log(`🔑 Seeded NEW Admin: "${cleanUsername}" (${cleanEmail})`);
      } else if (userByUsername) {
        // Update password or email if modified in env
        const isSamePassword = await bcrypt.compare(acc.password, userByUsername.passwordHash);
        let updated = false;

        if (!isSamePassword) {
          userByUsername.passwordHash = passwordHash;
          updated = true;
        }

        if (userByUsername.email !== cleanEmail && !userByEmail) {
          userByUsername.email = cleanEmail;
          updated = true;
        }

        if (updated) {
          await userByUsername.save();
          console.log(`🔄 UPDATED Admin Credentials for: "${cleanUsername}"`);
        }
      } else if (userByEmail && userByEmail.username !== cleanUsername) {
        console.warn(`⚠️ Cannot seed admin "${cleanUsername}": Email "${cleanEmail}" is already registered to user "${userByEmail.username}".`);
      }
    }
  } catch (error) {
    console.error('⚠️ Admin seeding error:', error.message);
  }
}

module.exports = seedAdmin;
