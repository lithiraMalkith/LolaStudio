const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
}

const app = initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore(app)

async function seed() {
  console.log('Seeding Firestore dummy data...')

  const categories = [
    {
      name: 'Spiritual & Zen',
      slug: 'spiritual-zen',
      description: 'Meditation, incense, crystals and mindful living goods.',
      subCategories: [
        { id: 'sc-1', name: 'Crystals', slug: 'crystals', description: 'Healing crystals and stones.' },
        { id: 'sc-2', name: 'Incense', slug: 'incense', description: 'Aromatic incense and holders.' },
      ],
      order: 1,
    },
    {
      name: 'Home Decor',
      slug: 'home-decor',
      description: 'Handcrafted decor, wall art, and soft furnishing pieces.',
      subCategories: [
        { id: 'sc-3', name: 'Wall Art', slug: 'wall-art', description: 'Local wall hangings and prints.' },
        { id: 'sc-4', name: 'Pillows', slug: 'pillows', description: 'Decorative cushions and covers.' },
      ],
      order: 2,
    },
  ]

  const products = [
    {
      name: 'Selenite Crystal Wand',
      description: 'A cleansing selenite wand for energy clearing and meditation.',
      price: 3500,
      dimensions: '15cm',
      material: 'Selenite',
      color: 'White',
      weight: '120g',
      stockQty: 12,
      images: [],
      category: 'Spiritual & Zen',
      subCategory: 'Crystals',
      availabilityStatus: 'in_stock',
      sku: 'LS-SEL-0001',
      visibility: 'published',
      slug: 'selenite-crystal-wand',
      createdBy: 'seed-script',
    },
    {
      name: 'Lotus Incense Holder',
      description: 'Hand-carved lotus incense holder for serene spaces.',
      price: 1800,
      dimensions: '20cm',
      material: 'Wood',
      color: 'Natural',
      weight: '200g',
      stockQty: 8,
      images: [],
      category: 'Spiritual & Zen',
      subCategory: 'Incense',
      availabilityStatus: 'in_stock',
      sku: 'LS-LOT-0002',
      visibility: 'published',
      slug: 'lotus-incense-holder',
      createdBy: 'seed-script',
    },
    {
      name: 'Mandala Wall Hanging',
      description: 'Colorful mandala wall hanging for modern interiors.',
      price: 5200,
      dimensions: '60x60cm',
      material: 'Cotton',
      color: 'Multi',
      weight: '450g',
      stockQty: 5,
      images: [],
      category: 'Home Decor',
      subCategory: 'Wall Art',
      availabilityStatus: 'low_stock',
      sku: 'LS-MAN-0003',
      visibility: 'published',
      slug: 'mandala-wall-hanging',
      createdBy: 'seed-script',
    },
    {
      name: 'Boho Throw Pillow',
      description: 'Handprinted boho pillow cover with soft filling.',
      price: 2600,
      dimensions: '45x45cm',
      material: 'Linen',
      color: 'Beige',
      weight: '350g',
      stockQty: 14,
      images: [],
      category: 'Home Decor',
      subCategory: 'Pillows',
      availabilityStatus: 'in_stock',
      sku: 'LS-BOH-0004',
      visibility: 'published',
      slug: 'boho-throw-pillow',
      createdBy: 'seed-script',
    },
  ]

  const customers = [
    {
      name: 'Nisha Perera',
      email: 'nisha@example.com',
      phone: '+94771234567',
      orderCount: 2,
      totalSpent: 8400,
      isRepeat: true,
      address: {
        addressLine1: 'No. 12, Temple Road',
        city: 'Negombo',
        district: 'Gampaha',
        postalCode: '11500',
      },
    },
  ]

  const orders = [
    {
      orderRef: 'LS-2026-0001',
      items: [
        {
          productId: 'prod-001',
          productName: 'Selenite Crystal Wand',
          sku: 'LS-SEL-0001',
          price: 3500,
          quantity: 1,
          image: '',
        },
        {
          productId: 'prod-004',
          productName: 'Boho Throw Pillow',
          sku: 'LS-BOH-0004',
          price: 2600,
          quantity: 2,
          image: '',
        },
      ],
      subtotal: 8700,
      deliveryFee: 350,
      total: 9050,
      status: 'delivered',
      customer: {
        name: 'Nisha Perera',
        email: 'nisha@example.com',
        phone: '+94771234567',
      },
      deliveryAddress: {
        addressLine1: 'No. 12, Temple Road',
        city: 'Negombo',
        district: 'Gampaha',
        postalCode: '11500',
      },
      notes: 'Please leave at door.',
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), updatedBy: 'system' },
        { status: 'processing', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), updatedBy: 'admin' },
        { status: 'dispatched', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), updatedBy: 'admin' },
        { status: 'delivered', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), updatedBy: 'system' },
      ],
    },
    {
      orderRef: 'LS-2026-0002',
      items: [
        {
          productId: 'prod-002',
          productName: 'Lotus Incense Holder',
          sku: 'LS-LOT-0002',
          price: 1800,
          quantity: 1,
          image: '',
        },
      ],
      subtotal: 1800,
      deliveryFee: 350,
      total: 2150,
      status: 'processing',
      customer: {
        name: 'Janith Kapoor',
        email: 'janith@example.com',
        phone: '+94712345678',
      },
      deliveryAddress: {
        addressLine1: 'No. 45, Galle Road',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00600',
      },
      notes: '',
      statusHistory: [
        { status: 'pending', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), updatedBy: 'system' },
        { status: 'processing', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), updatedBy: 'admin' },
      ],
    },
    {
      orderRef: 'LS-2026-0003',
      items: [
        {
          productId: 'prod-003',
          productName: 'Mandala Wall Hanging',
          sku: 'LS-MAN-0003',
          price: 5200,
          quantity: 1,
          image: '',
        },
      ],
      subtotal: 5200,
      deliveryFee: 450,
      total: 5650,
      status: 'pending',
      customer: {
        name: 'Priya Silva',
        email: 'priya@example.com',
        phone: '+94769876543',
      },
      deliveryAddress: {
        addressLine1: 'No. 78, Main Street',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
      },
      notes: 'Fragile - handle with care',
      statusHistory: [
        { status: 'pending', timestamp: new Date(), updatedBy: 'system' },
      ],
    },
  ]

  const settings = {
    siteName: 'Lola Studio',
    siteDescription: 'Handmade home décor & spiritual goods from Negombo, Sri Lanka',
    ownerEmail: 'hello@lolastudio.com',
    ownerPhone: '+94111234567',
    currency: 'LKR',
    codEnabled: true,
    deliveryZones: [
      { id: 'zone-1', name: 'Colombo', fee: 350, isActive: true },
      { id: 'zone-2', name: 'Gampaha', fee: 450, isActive: true },
    ],
    socialLinks: { tiktok: '', instagram: '', facebook: '' },
    metaPixelId: '',
    tiktokPixelId: '',
  }

  const now = new Date()

  await db.collection('categories').doc('spiritual-zen').set({
    id: 'spiritual-zen',
    ...categories[0],
    createdAt: now,
    updatedAt: now,
  })

  await db.collection('categories').doc('home-decor').set({
    id: 'home-decor',
    ...categories[1],
    createdAt: now,
    updatedAt: now,
  })

  for (const product of products) {
    await db.collection('products').add({
      ...product,
      createdAt: now,
      updatedAt: now,
    })
  }

  for (const customer of customers) {
    await db.collection('customers').add({
      ...customer,
      createdAt: now,
      updatedAt: now,
      firstOrderAt: now,
      lastOrderAt: now,
    })
  }

  for (const order of orders) {
    await db.collection('orders').add({
      ...order,
      createdAt: order.statusHistory[0].timestamp,
      updatedAt: new Date(),
    })
  }

  await db.collection('settings').doc('site').set({
    ...settings,
    createdAt: now,
    updatedAt: now,
  })

  console.log('Firestore seed complete.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
