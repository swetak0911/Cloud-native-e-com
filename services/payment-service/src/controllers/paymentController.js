const Payment = require("../models/Payment");
const {
  isValidObjectId,
  isValidStatus,
  isValidAmount,
  canTransitionStatus,
  verifyWebhookSignature,
} = require("../utils/security");

const getIdempotencyKey = (req) =>
  req.headers["idempotency-key"] || req.body.idempotencyKey;

exports.createPayment = async (req, res) => {
  try {
    const { orderId, userId, amount, currency, provider, metadata } = req.body;
    const idempotencyKey = getIdempotencyKey(req);

    if (!orderId || !userId || amount === undefined || amount === null) {
      return res.status(400).json({
        message: "orderId, userId, and amount are required",
      });
    }

    if (!idempotencyKey) {
      return res.status(400).json({
        message: "idempotency-key header (or idempotencyKey in body) is required",
      });
    }

    if (!isValidObjectId(orderId) || !isValidObjectId(userId)) {
      return res.status(400).json({
        message: "Invalid orderId or userId",
      });
    }

    if (!isValidAmount(amount)) {
      return res.status(400).json({
        message: "amount must be a positive number",
      });
    }

    const existing = await Payment.findOne({ orderId, idempotencyKey });
    if (existing) {
      return res.status(200).json({
        message: "Payment already created for this idempotency key",
        payment: existing,
      });
    }

    const payment = await Payment.create({
      orderId,
      userId,
      amount,
      currency: currency || "INR",
      status: "PENDING",
      provider: provider || "mock",
      idempotencyKey,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    });

    return res.status(201).json({
      message: "Payment created",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create payment",
      error: error.message,
    });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json(payment);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return res.status(400).json({
          message: "Invalid status. Allowed: PENDING, SUCCESS, FAILED",
        });
      }

      if (!canTransitionStatus(payment.status, status)) {
        return res.status(409).json({
          message: `Invalid status transition from ${payment.status} to ${status}`,
        });
      }

      payment.status = status;
    }

    if (transactionId) payment.transactionId = transactionId;

    await payment.save();

    return res.status(200).json({
      message: "Payment updated",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update payment",
      error: error.message,
    });
  }
};

exports.paymentWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    const signature = req.headers["x-webhook-signature"];
    const rawPayload = JSON.stringify(req.body);

    if (!verifyWebhookSignature(rawPayload, signature, webhookSecret)) {
      return res.status(401).json({ message: "Invalid webhook signature" });
    }

    const { paymentId, status, transactionId } = req.body;

    if (!paymentId || !isValidObjectId(paymentId)) {
      return res.status(400).json({ message: "Invalid paymentId" });
    }

    if (status !== undefined && !isValidStatus(status)) {
      return res.status(400).json({
        message: "Invalid status. Allowed: PENDING, SUCCESS, FAILED",
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (status !== undefined) {
      if (!canTransitionStatus(payment.status, status)) {
        return res.status(409).json({
          message: `Invalid status transition from ${payment.status} to ${status}`,
        });
      }
      payment.status = status;
    }

    payment.transactionId = transactionId || payment.transactionId;
    payment.lastWebhookAt = new Date();

    await payment.save();

    return res.status(200).json({
      message: "Webhook processed",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Webhook failed",
      error: error.message,
    });
  }
};
