const express = require("express");
const router = express.Router();

const {
  createPayment,
  getPaymentById,
  updatePaymentStatus,
  paymentWebhook,
} = require("../controllers/paymentController");

router.post("/create", createPayment);
router.get("/:id", getPaymentById);
router.patch("/:id/status", updatePaymentStatus);
router.post("/webhook", paymentWebhook);

module.exports = router;
