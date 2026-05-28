const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Body Parser Middleware
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: '*', // Allows access from any port (e.g. frontend Next.js on 3000)
  credentials: true
}));

// Morgan HTTP request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Import Modular Routers
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const addressRoutes = require('./routes/addressRoutes');
const pincodeRoutes = require('./routes/pincodeRoutes');
const cartRoutes = require('./routes/cartRoutes');

// Mount Routes (Double-mounted to support direct frontend calls and API standards)
app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/products', productRoutes);
app.use('/api/products', productRoutes);

app.use('/orders', orderRoutes);
app.use('/api/orders', orderRoutes);

app.use('/wishlist', wishlistRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.use('/addresses', addressRoutes);
app.use('/api/addresses', addressRoutes);

app.use('/pincodes', pincodeRoutes);
app.use('/api/pincodes', pincodeRoutes);

app.use('/cart', cartRoutes);
app.use('/api/cart', cartRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Puma Clone API is healthy' });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ status: 'ERROR', message: 'Resource API endpoint not found' });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'ERROR',
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n=============================================`);
  console.log(`PUMA CLONE BACKEND RUNNING ON PORT: ${PORT}`);
  console.log(`ENVIRONMENT: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=============================================\n`);
});
