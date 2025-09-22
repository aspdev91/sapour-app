require('dotenv').config({ path: './backend/.env' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAdmin() {
  const adminEmail = 'mtdev91@gmail.com';

  try {
    console.log(`Setting up admin user: ${adminEmail}`);

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin);

      // Update to allowlisted if not already
      if (!existingAdmin.allowlisted) {
        const updatedAdmin = await prisma.admin.update({
          where: { email: adminEmail },
          data: { allowlisted: true },
        });
        console.log('✅ Admin updated to allowlisted:', updatedAdmin);
      } else {
        console.log('✅ Admin is already allowlisted');
      }
    } else {
      // Create new admin
      const newAdmin = await prisma.admin.create({
        data: {
          email: adminEmail,
          allowlisted: true,
        },
      });
      console.log('✅ New admin created and allowlisted:', newAdmin);
    }
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
