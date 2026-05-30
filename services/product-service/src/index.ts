import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// MongoDB connect
mongoose.connect('mongodb://localhost:27017/productdb')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB Error:', err));

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  stock: Number,
});

const Product = mongoose.model('Product', productSchema);

// Routes
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/products', async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.status(201).json(product);
});

app.listen(4001, () => {
  console.log('product-service running on port 4001');
});
