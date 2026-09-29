import crypto from "crypto";

const SIGNATURE_PATTERN = /^[a-f\d]{64}$/i;

export const signaturesMatch = (expected, received) => {
  if (typeof expected !== "string" || typeof received !== "string") return false;
  if (!SIGNATURE_PATTERN.test(expected) || !SIGNATURE_PATTERN.test(received)) return false;

  const expectedBytes = Buffer.from(expected, "hex");
  const receivedBytes = Buffer.from(received, "hex");
  return expectedBytes.length === receivedBytes.length
    && crypto.timingSafeEqual(expectedBytes, receivedBytes);
};

export const verifyRazorpayCheckoutSignature = ({ orderId, paymentId, signature, secret }) => {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return signaturesMatch(expected, signature);
};

export const verifyRazorpayWebhookSignature = ({ rawBody, signature, secret }) => {
  if (!Buffer.isBuffer(rawBody) || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return signaturesMatch(expected, signature);
};

export const isPaymentForRecord = (entity, payment) => {
  const expectedAmount = Math.round(Number(payment?.amount) * 100);
  return Boolean(
    entity
      && payment
      && entity.order_id === payment.razorpayOrderId
      && Number.isFinite(expectedAmount)
      && expectedAmount > 0
      && Number(entity.amount) === expectedAmount
      && String(entity.currency || "").toUpperCase() === String(payment.currency || "INR").toUpperCase()
  );
};

export const isCapturedPaymentForRecord = (entity, payment) =>
  isPaymentForRecord(entity, payment) && entity.status === "captured";
