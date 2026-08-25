// One-off demo data seed: admin account, sample users, providers, and services
// spread across the already-seeded categories, so the whole site has real data
// to browse while testing. Run with: node prisma/seed-demo.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hash(pw) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log('Seeding demo data...');

  // --- Admin account ---
  const adminPassword = await hash('Admin@12345');
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      firstName: 'Zia',
      lastName: 'Admin',
    },
  });
  console.log('Admin account ready: admin / Admin@12345');

  // --- Sample customers ---
  const customerPassword = await hash('Customer@123');
  const customers = [
    { email: 'nadia.perera@example.com', firstName: 'Nadia', lastName: 'Perera' },
    { email: 'kasun.silva@example.com', firstName: 'Kasun', lastName: 'Silva' },
  ];
  for (const c of customers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        password: customerPassword,
        role: 'USER',
        firstName: c.firstName,
        lastName: c.lastName,
        location: 'Colombo, Western',
        isEmailVerified: true,
        isActive: true,
      },
    });
  }
  console.log(`Created ${customers.length} sample customers (password: Customer@123)`);

  // --- Sample providers ---
  const providerPassword = await hash('Provider@123');
  const providersData = [
    {
      email: 'ruwan.cleaning@example.com',
      firstName: 'Ruwan',
      lastName: 'Fernando',
      bio: 'Professional residential and commercial cleaning with 8+ years of experience across Colombo.',
      skills: ['Deep Cleaning', 'Office Cleaning', 'Carpet Care'],
      services: [
        { categorySlug: 'cleaning-services', title: 'Deep House Cleaning', description: 'Full top-to-bottom deep clean for homes, including kitchen degreasing and bathroom sanitation.', price: 4500, tags: ['cleaning', 'home', 'deep-clean'] },
        { categorySlug: 'cleaning-services', title: 'Office Cleaning Package', description: 'Weekly or monthly office cleaning contracts for small to mid-size offices.', price: 8000, tags: ['cleaning', 'office'] },
      ],
    },
    {
      email: 'chamara.plumbing@example.com',
      firstName: 'Chamara',
      lastName: 'Jayasuriya',
      bio: 'Licensed plumber specializing in leak repairs, pipe installation, and bathroom fittings.',
      skills: ['Pipe Fitting', 'Leak Repair', 'Water Heater Installation'],
      services: [
        { categorySlug: 'plumbing', title: 'Leaky Faucet & Pipe Repair', description: 'Fast diagnosis and repair of leaking faucets, pipes, and fittings.', price: 2500, tags: ['plumbing', 'repair'] },
      ],
    },
    {
      email: 'dilani.design@example.com',
      firstName: 'Dilani',
      lastName: 'Wickramasinghe',
      bio: 'Freelance graphic designer crafting logos, brand identities, and marketing collateral.',
      skills: ['Logo Design', 'Brand Identity', 'Adobe Illustrator'],
      services: [
        { categorySlug: 'graphic-design', title: 'Modern Logo & Brand Kit', description: 'Complete logo design with brand color palette, typography guide, and social media kit.', price: 15000, tags: ['design', 'branding', 'logo'] },
        { categorySlug: 'web-design', title: 'Landing Page UI Design', description: 'Conversion-focused landing page design in Figma, ready for development handoff.', price: 22000, tags: ['design', 'web', 'ui'] },
      ],
    },
    {
      email: 'sanjeewa.dev@example.com',
      firstName: 'Sanjeewa',
      lastName: 'Rathnayake',
      bio: 'Full-stack web developer building React and Node.js applications for local businesses.',
      skills: ['React', 'Node.js', 'PostgreSQL'],
      services: [
        { categorySlug: 'software-development', title: 'React Web Application Development', description: 'Custom web app development from design to deployment, with ongoing support.', price: 85000, tags: ['development', 'react', 'web-app'] },
      ],
    },
    {
      email: 'ishara.beauty@example.com',
      firstName: 'Ishara',
      lastName: 'Gunawardena',
      bio: 'Certified makeup artist and hair stylist for weddings, photoshoots, and events.',
      skills: ['Bridal Makeup', 'Hair Styling', 'Event Makeup'],
      services: [
        { categorySlug: 'beauty-makeup', title: 'Bridal Makeup & Hair Package', description: 'Full bridal makeup and hairstyling package including trial session.', price: 18000, tags: ['beauty', 'bridal', 'makeup'] },
      ],
    },
    {
      email: 'nimal.tutor@example.com',
      firstName: 'Nimal',
      lastName: 'Bandara',
      bio: 'Experienced business consultant helping small businesses with strategy and growth planning.',
      skills: ['Strategy', 'Financial Planning', 'Market Research'],
      services: [
        { categorySlug: 'business-consulting', title: 'Small Business Strategy Session', description: 'One-on-one consulting session to review your business plan and identify growth opportunities.', price: 6000, tags: ['consulting', 'business', 'strategy'] },
      ],
    },
  ];

  const categorySlugs = [...new Set(providersData.flatMap(p => p.services.map(s => s.categorySlug)))];
  const categories = await prisma.category.findMany({ where: { slug: { in: categorySlugs } } });
  const categoryBySlug = new Map(categories.map(c => [c.slug, c]));

  let createdServices = 0;
  for (const p of providersData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { role: 'PROVIDER' },
      create: {
        email: p.email,
        password: providerPassword,
        role: 'PROVIDER',
        firstName: p.firstName,
        lastName: p.lastName,
        location: 'Colombo, Western',
        isEmailVerified: true,
        isActive: true,
      },
    });

    const provider = await prisma.serviceProvider.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        bio: p.bio,
        skills: p.skills,
        qualifications: ['Verified Professional'],
        IDCardUrl: 'https://placehold.co/600x400?text=ID+Card',
        isVerified: true,
        averageRating: 4.5 + Math.random() * 0.5,
        totalReviews: Math.floor(Math.random() * 40) + 5,
      },
    });

    for (const s of p.services) {
      const category = categoryBySlug.get(s.categorySlug);
      if (!category) {
        console.warn(`  Skipping "${s.title}" — category not found: ${s.categorySlug}`);
        continue;
      }
      const existing = await prisma.service.findFirst({ where: { providerId: provider.id, title: s.title } });
      if (existing) continue;

      await prisma.service.create({
        data: {
          providerId: provider.id,
          categoryId: category.id,
          title: s.title,
          description: s.description,
          price: s.price,
          currency: 'LKR',
          tags: s.tags,
          images: [`https://picsum.photos/seed/${encodeURIComponent(s.title)}/800/600`],
          isActive: true,
          workingTime: ['Mon-Fri 9AM-6PM'],
          city: 'Colombo',
          state: 'Western',
          country: 'Sri Lanka',
          latitude: 6.9271 + (Math.random() - 0.5) * 0.1,
          longitude: 79.8612 + (Math.random() - 0.5) * 0.1,
        },
      });
      createdServices++;
    }
    console.log(`Provider ready: ${p.firstName} ${p.lastName} (${p.email})`);
  }

  console.log(`Created/verified ${providersData.length} providers and ${createdServices} services (password: Provider@123)`);
  console.log('Demo data seed complete.');
}

main()
  .catch((e) => {
    console.error('Demo seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
