import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
} as const

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

  const startedAt = new Date()
  const createdAt = startedAt
  const updatedAt = startedAt

  await db.collection('categories').doc('spiritual-zen').set({
    id: 'spiritual-zen',
    ...categories[0],
    createdAt,
    updatedAt,
  })

  await db.collection('categories').doc('home-decor').set({
    id: 'home-decor',
    ...categories[1],
    createdAt,
    updatedAt,
  })

  for (const product of products) {
    await db.collection('products').add({
      ...product,
      createdAt,
      updatedAt,
    })
  }

  for (const customer of customers) {
    await db.collection('customers').add({
      ...customer,
      createdAt,
      lastOrderAt: createdAt,
      updatedAt: createdAt,
    })
  }

  await db.collection('settings').doc('site').set({
    ...settings,
    createdAt,
    updatedAt,
  })

  console.log('Firestore seed complete.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
