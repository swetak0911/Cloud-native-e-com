import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = express();
app.use(cors());

// Saare routes gateway se pass honge
app.use('/auth', createProxyMiddleware({ target: 'http://auth-service:4000', changeOrigin: true }));
app.use('/products', createProxyMiddleware({ target: 'http://product-service:4001', changeOrigin: true }));
app.use('/cart', createProxyMiddleware({ target: 'http://cart-service:4002', changeOrigin: true }));
app.use('/orders', createProxyMiddleware({ target: 'http://order-service:4003', changeOrigin: true }));

app.listen(8080, () => console.log('🚪 API Gateway running on port 8080'));
