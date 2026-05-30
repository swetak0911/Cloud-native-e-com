import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: String,
  items: [
    {
      productId: String,
      productName: String,
      price: Number,
      quantity: Number
    }
  ],
  totalAmount: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// MongoDB Connect
mongoose.connect('mongodb://localhost:27017/orderdb')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes

// Place order
app.post('/orders', async (req, res) => {
  const { userId, items, totalAmount } = req.body;
  const order = new Order({ userId, items, totalAmount });
  await order.save();
  res.status(201).json(order);
});

// Get orders by userId
app.get('/orders/:userId', async (req, res) => {
  const orders = await Order.find({ userId: req.params.userId });
  res.json(orders);
});

// Health check
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.listen(4003, () => console.log('order-service running on port 4003'));
