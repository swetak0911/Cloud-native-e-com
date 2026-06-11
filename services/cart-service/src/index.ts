import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { webcrypto } from 'node:crypto';
import jwt from 'jsonwebtoken';

if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Cart Schema
const cartItemSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  productName: String,
  price: Number,
  quantity: { type: Number, default: 1 }
});

const CartItem = mongoose.model('CartItem', cartItemSchema);

// MongoDB Connect
mongoose.connect('mongodb://mongo:27017/cartdb')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "No token provided" });

    try {
        // NOTE: Agar auth-service mein token sign karte waqt 'id' use kiya hai, toh yahan 'decoded.id' use karein
        const decoded = jwt.verify(token, 'dev-secret-change-me') as any; 
        req.userId = decoded.userId || decoded.id || decoded.sub; 
        next();
    } catch (e) {
        res.status(401).json({ error: "Invalid token" });
    }
};

// Routes

// Add to cart (POST)
app.post('/cart', authenticate, async (req: Request, res: Response) => {
  const { productId, productName, price, quantity } = req.body;
  const userId = req.userId;

  if (!productId) return res.status(400).json({ error: "productId is required" });

  try {
    let cartItem = await CartItem.findOne({ productId, userId });

    if (cartItem) {
      cartItem.quantity = (cartItem.quantity || 0) + Number(quantity || 1);
      // Update name/price in case they changed in product-service
      cartItem.productName = productName;
      cartItem.price = price;
      await cartItem.save();
      res.status(200).json({ message: "Cart updated", cartItem });
    } else {
      const newItem = new CartItem({
        productId,
        productName,
        price,
        quantity: quantity || 1,
        userId
      });
      await newItem.save();
      res.status(201).json({ message: "Item added to cart", newItem });
    }
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// Get cart
app.get('/cart', authenticate, async (req: Request, res: Response) => {
  try {
    const items = await CartItem.find({ userId: req.userId });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

// Delete item
app.delete('/cart/:id', authenticate, async (req: Request, res: Response) => {
  try {
    await CartItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

app.listen(4002, () => console.log('cart-service running on port 4002'));
