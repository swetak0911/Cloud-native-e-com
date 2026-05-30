import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Cart Schema
const cartItemSchema = new mongoose.Schema({
  userId: String,
  productId: String,
  productName: String,
  price: Number,
  quantity: Number
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

// MongoDB Connect
mongoose.connect('mongodb://localhost:27017/cartdb')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes

// Add to cart
app.post('/cart', async (req, res) => {
  const { userId, productId, productName, price, quantity } = req.body;
  const item = new CartItem({ userId, productId, productName, price, quantity });
  await item.save();
  res.status(201).json(item);
});

// Get cart by userId
app.get('/cart/:userId', async (req, res) => {
  const items = await CartItem.find({ userId: req.params.userId });
  res.json(items);
});

// Delete item from cart
app.delete('/cart/:id', async (req, res) => {
  await CartItem.findByIdAndDelete(req.params.id);
  res.json({ message: 'Item removed from cart' });
});

// Health check
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.listen(4002, () => console.log('cart-service running on port 4002'));
