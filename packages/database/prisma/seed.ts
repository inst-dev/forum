import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nullforum.com' },
    update: {},
    create: {
      email: 'admin@nullforum.com',
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      isEmailVerified: true,
      memberStatus: 'Admin',
      points: 9999,
      privacySettings: { create: {} },
      notificationPrefs: { create: {} },
    },
  });

  // Create categories
  const generalCat = await prisma.category.upsert({
    where: { slug: 'general' },
    update: {},
    create: { name: 'General', description: 'General discussion topics', slug: 'general', sortOrder: 1 },
  });

  const techCat = await prisma.category.upsert({
    where: { slug: 'technology' },
    update: {},
    create: { name: 'Technology', description: 'Tech discussions and help', slug: 'technology', sortOrder: 2 },
  });

  const communityCat = await prisma.category.upsert({
    where: { slug: 'community' },
    update: {},
    create: { name: 'Community', description: 'Community announcements and events', slug: 'community', sortOrder: 3 },
  });

  // Create forums
  await prisma.forum.upsert({
    where: { slug: 'announcements' },
    update: {},
    create: { name: 'Announcements', slug: 'announcements', description: 'Official announcements', icon: '📢', categoryId: communityCat.id, sortOrder: 1 },
  });

  await prisma.forum.upsert({
    where: { slug: 'introductions' },
    update: {},
    create: { name: 'Introductions', slug: 'introductions', description: 'Introduce yourself to the community', icon: '👋', categoryId: communityCat.id, sortOrder: 2 },
  });

  await prisma.forum.upsert({
    where: { slug: 'general-discussion' },
    update: {},
    create: { name: 'General Discussion', slug: 'general-discussion', description: 'Chat about anything', icon: '💬', categoryId: generalCat.id, sortOrder: 1 },
  });

  await prisma.forum.upsert({
    where: { slug: 'questions-help' },
    update: {},
    create: { name: 'Questions & Help', slug: 'questions-help', description: 'Ask questions and get help', icon: '❓', categoryId: generalCat.id, sortOrder: 2 },
  });

  await prisma.forum.upsert({
    where: { slug: 'programming' },
    update: {},
    create: { name: 'Programming', slug: 'programming', description: 'Programming discussions', icon: '💻', categoryId: techCat.id, sortOrder: 1 },
  });

  await prisma.forum.upsert({
    where: { slug: 'web-development' },
    update: {},
    create: { name: 'Web Development', slug: 'web-development', description: 'Frontend, backend, and full-stack', icon: '🌐', categoryId: techCat.id, sortOrder: 2 },
  });

  await prisma.forum.upsert({
    where: { slug: 'mobile-development' },
    update: {},
    create: { name: 'Mobile Development', slug: 'mobile-development', description: 'iOS, Android, and cross-platform', icon: '📱', categoryId: techCat.id, sortOrder: 3 },
  });

  // Create badges
  const badges = [
    { name: 'Early Bird', description: 'One of the first members', icon: '🐦', color: '#1a73e8' },
    { name: 'Verified', description: 'Verified user', icon: '✓', color: '#0f9d58' },
    { name: 'Contributor', description: 'Active contributor', icon: '⭐', color: '#f9ab00' },
    { name: 'VIP', description: 'VIP member', icon: '👑', color: '#9c27b0' },
    { name: 'Developer', description: 'Developer badge', icon: '🛠', color: '#00bcd4' },
    { name: 'Sponsor', description: 'Community sponsor', icon: '💎', color: '#e91e63' },
    { name: 'Moderator', description: 'Community moderator', icon: '🛡', color: '#ff5722' },
    { name: 'Helpful', description: 'Consistently helpful', icon: '💡', color: '#4caf50' },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }

  // Create default bad words
  const badWords = ['spam', 'scam'];
  for (const word of badWords) {
    await prisma.badWord.upsert({
      where: { word },
      update: {},
      create: { word, severity: 3, language: 'en' },
    });
  }

  // Create default site settings
  const defaultSettings = [
    { key: 'site_name', value: 'NullForum', type: 'string', group: 'general' },
    { key: 'site_description', value: 'Community Forum Platform', type: 'string', group: 'general' },
    { key: 'registration_enabled', value: 'true', type: 'boolean', group: 'auth' },
    { key: 'require_email_verification', value: 'true', type: 'boolean', group: 'auth' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean', group: 'general' },
    { key: 'captcha_enabled', value: 'false', type: 'boolean', group: 'auth' },
    { key: 'max_upload_size', value: '10', type: 'number', group: 'upload' },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('Seeding complete!');
  console.log('Admin login: admin@nullforum.com / Admin@12345');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
