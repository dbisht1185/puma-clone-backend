const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Product = require('../models/Product');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    // 1. Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');

    // 2. Load frontend products dynamically
    const cardsFilePath = path.join(
      __dirname,
      '../../puma-clone-frontend/src/constant/Products/Cards.js'
    );

    if (!fs.existsSync(cardsFilePath)) {
      throw new Error(`Frontend products file not found at: ${cardsFilePath}`);
    }

    console.log('Reading products from frontend Cards.js...');
    let cardsContent = fs.readFileSync(cardsFilePath, 'utf8');

    // Convert ES Modules export to CommonJS export
    cardsContent = cardsContent.replace('export const CardDatas =', 'module.exports =');

    // Write a temporary file to require it safely
    const tempFilePath = path.join(__dirname, 'tempCards.js');
    fs.writeFileSync(tempFilePath, cardsContent, 'utf8');

    // Require the products list
    const cardDatas = require('./tempCards');

    // Clean up temporary file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    console.log(`Successfully parsed ${cardDatas.length} products from frontend assets.`);

    // 3. Clear database collections
    console.log('Clearing existing database collections...');
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('Database cleared.');

    // 4. Seed Admin and Customer test accounts
    console.log('Creating default users...');
    
    // Default Admin User
    const adminUser = await User.create({
      name: 'Puma Administrator',
      email: 'admin@puma.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log(`Created Admin User: ${adminUser.email} / admin123`);

    // Default Customer User
    const normalUser = await User.create({
      name: 'Regular Customer',
      email: 'user@puma.com',
      password: 'user123',
      role: 'user'
    });
    console.log(`Created Normal User: ${normalUser.email} / user123`);

    // 5. Seed Catalog Products
    console.log('Formatting and seeding products to database...');
    const formattedProducts = cardDatas.map((item, idx) => {
      // Ensure values map cleanly
      const basePrice = Number(item.basePrice) || 5000;
      const discountValue = Number(item.discountValue) || 0;
      const discountType = item.discountType || null;

      // Ensure slug and productId are unique
      const productId = item.productId || `product-${idx}`;
      const slug = item.slug || productId;

      // Assign categories based on name or gender heuristics if missing
      let category = 'footwear';
      const nameLower = item.name.toLowerCase();
      if (nameLower.includes('t-shirt') || nameLower.includes('jacket') || nameLower.includes('pant') || nameLower.includes('tee')) {
        category = 'apparel';
      } else if (nameLower.includes('bag') || nameLower.includes('cap') || nameLower.includes('socks')) {
        category = 'accessories';
      }

      // Ensure stock is seeded realistically (if 0 in Cards.js, seed a small number like 5 so it is shoppable, or keep 0 if intended)
      const stock = item.stock !== undefined ? Number(item.stock) : 10;

      // Assign some special flags for dynamic homepage API testing
      const isTrending = idx === 0 || idx === 2;
      const isCollaboration = idx === 1 || idx === 3;
      const collaborationName = isCollaboration ? "Hot Wheels" : undefined;

      return {
        productId,
        slug,
        name: item.name,
        price: item.price || `₹${basePrice.toLocaleString('en-IN')}`,
        offerPrice: item.offerPrice || null,
        description: item.description || 'Premium Puma athletic gear.',
        img: item.img,
        images: item.images || [item.img],
        sizes: item.sizes || [],
        colors: item.colors || [],
        color: item.color || undefined,
        styleNumber: item.styleNumber || undefined,
        basePrice,
        discountType,
        discountValue,
        stock,
        gender: item.gender || 'unisex-adults',
        category,
        isTrending,
        isCollaboration,
        collaborationName
      };
    });

    await Product.insertMany(formattedProducts);
    console.log(`Successfully seeded ${formattedProducts.length} products to database.`);

    console.log('\n=========================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed with error:', error);
    process.exit(1);
  }
};

seedDatabase();
