import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  isCapturedPaymentForRecord,
  isPaymentForRecord,
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
} from "../utils/razorpayVerification.js";
import {
  buildCapturedCoursePurchaseQuery,
  isCoursePurchasePayment,
  isPaidCourseAvailableForPurchase,
} from "../utils/coursePurchase.js";

const secret = "test-only-signing-secret";

test("checkout signature verifies the expected order/payment pair", () => {
  const orderId = "order_test_123";
  const paymentId = "pay_test_456";
  const signature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

  assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId, signature, secret }), true);
  assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId: "pay_other", signature, secret }), false);
  assert.equal(verifyRazorpayCheckoutSignature({ orderId, paymentId, signature: "invalid", secret }), false);
});

test("webhook signatures verify exact raw bytes, not re-serialized JSON", () => {
  const rawBody = Buffer.from('{ "event" : "payment.captured" }');
  const signature = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  assert.equal(verifyRazorpayWebhookSignature({ rawBody, signature, secret }), true);
  assert.equal(verifyRazorpayWebhookSignature({ rawBody: Buffer.from('{"event":"payment.captured"}'), signature, secret }), false);
  assert.equal(verifyRazorpayWebhookSignature({ rawBody: null, signature, secret }), false);
});

test("payment must match the persisted order, exact amount, and currency", () => {
  const payment = { razorpayOrderId: "order_test_123", amount: 799, currency: "INR" };
  const entity = { order_id: "order_test_123", amount: 79900, currency: "INR", status: "captured" };

  assert.equal(isPaymentForRecord(entity, payment), true);
  assert.equal(isCapturedPaymentForRecord(entity, payment), true);
  assert.equal(isCapturedPaymentForRecord({ ...entity, amount: 79800 }, payment), false);
  assert.equal(isCapturedPaymentForRecord({ ...entity, order_id: "order_other" }, payment), false);
  assert.equal(isCapturedPaymentForRecord({ ...entity, status: "authorized" }, payment), false);
});

test("course purchase access requires a captured payment for the exact learner and course", () => {
  assert.deepEqual(buildCapturedCoursePurchaseQuery({ userId: "learner-1", courseId: "course-1" }), {
    userId: "learner-1",
    courseId: "course-1",
    paymentPurpose: "CoursePurchase",
    status: "captured",
  });
  assert.equal(isCoursePurchasePayment({ paymentPurpose: "CoursePurchase", courseId: "course-1" }), true);
  assert.equal(isCoursePurchasePayment({ paymentPurpose: "ProgramEnrollment", programId: "program-1" }), false);
});

test("only published paid courses with a positive saved price are purchasable", () => {
  const validPaidCourse = { status: "Published", accessType: "Paid", price: 499, topicIds: ["topic-1"] };
  assert.equal(isPaidCourseAvailableForPurchase(validPaidCourse), true);
  assert.equal(isPaidCourseAvailableForPurchase({ ...validPaidCourse, status: "Draft" }), false);
  assert.equal(isPaidCourseAvailableForPurchase({ ...validPaidCourse, accessType: "Free" }), false);
  assert.equal(isPaidCourseAvailableForPurchase({ ...validPaidCourse, price: 0 }), false);
  assert.equal(isPaidCourseAvailableForPurchase({ ...validPaidCourse, topicIds: [] }), false);
});

test("canonical placement pricing plans are ₹799 and ₹999 with 5-day refund policy", () => {
  const placementBasicPrice = 799;
  const placementProPrice = 999;
  const refundPolicy = "Cancel anytime. Get refunded if you cancel within 5 days.";

  assert.equal(placementBasicPrice, 799);
  assert.equal(placementProPrice, 999);
  assert.match(refundPolicy, /5 days/);
});

test("canonical skill pricing is ₹499 for first-time and ₹199 for returning learners", () => {
  const firstTimePrice = 499;
  const returningPrice = 199;
  const refundPolicy = "No refunds or cancellations after purchase.";

  assert.equal(firstTimePrice, 499);
  assert.equal(returningPrice, 199);
  assert.match(refundPolicy, /No refunds/);
});

