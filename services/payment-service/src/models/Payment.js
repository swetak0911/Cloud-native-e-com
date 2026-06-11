const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
      index: true,
    },
    provider: {
      type: String,
      default: "mock",
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    lastWebhookAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ orderId: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model("Payment", paymentSchema);
