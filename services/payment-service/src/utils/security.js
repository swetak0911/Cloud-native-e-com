const crypto = require("crypto");
const mongoose = require("mongoose");

const ALLOWED_STATUSES = ["PENDING", "SUCCESS", "FAILED"];
const STATUS_TRANSITIONS = {
  PENDING: ["SUCCESS", "FAILED"],
  SUCCESS: [],
  FAILED: [],
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const isValidStatus = (status) => ALLOWED_STATUSES.includes(status);

const isValidAmount = (amount) =>
  typeof amount === "number" && Number.isFinite(amount) && amount > 0;

const canTransitionStatus = (fromStatus, toStatus) => {
  if (!isValidStatus(fromStatus) || !isValidStatus(toStatus)) return false;
  if (fromStatus === toStatus) return true;
  return STATUS_TRANSITIONS[fromStatus].includes(toStatus);
};

const safeEqual = (a, b) => {
  const aBuf = Buffer.from(a || "", "utf8");
  const bBuf = Buffer.from(b || "", "utf8");
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

const computeWebhookSignature = (rawPayload, secret) => {
  return crypto
    .createHmac("sha256", secret)
    .update(rawPayload, "utf8")
    .digest("hex");
};

const verifyWebhookSignature = (rawPayload, providedSignature, secret) => {
  if (!secret || !providedSignature || !rawPayload) return false;
  const expected = computeWebhookSignature(rawPayload, secret);
  return safeEqual(expected, providedSignature);
};

module.exports = {
  ALLOWED_STATUSES,
  isValidObjectId,
  isValidStatus,
  isValidAmount,
  canTransitionStatus,
  computeWebhookSignature,
  verifyWebhookSignature,
};
