import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";


const app = express();
app.use(cors());
const PORT = 8080;

// Health check
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Route to auth-service
// Route to auth-service
app.use("/auth", createProxyMiddleware({
  target: "http://localhost:4000/auth",
  changeOrigin: true,
}));


// Route to product-service
app.use("/products", createProxyMiddleware({
  target: "http://localhost:4001",
  changeOrigin: true,
}));

// Route to cart-service
app.use("/cart", createProxyMiddleware({
  target: "http://localhost:4002",
  changeOrigin: true,
}));

// Route to order-service
app.use("/orders", createProxyMiddleware({
  target: "http://localhost:4003",
  changeOrigin: true,
}));

app.listen(PORT, () => {
  console.log(`🚪 API Gateway running on port ${PORT}`);
});
