const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
});

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[${req.requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`
    );
  });
  next();
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok", service: "payment-service" });
});

app.use("/payments", paymentRoutes);

module.exports = app;
