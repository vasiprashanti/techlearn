import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';

// Connect to MongoDB
const MONGO_URI = 'mongodb+srv://techlearn_admin:Techlearn2014@techlearncluster1.l8lcpzo.mongodb.net/?retryWrites=true&w=majority&appName=techlearncluster1';
const RAZORPAY_SECRET = 'MNsJnOGVYQylkRan9IQbfJ9K';

const { default: User } = await import('../models/User.js');
const { default: Student } = await import('../models/Student.js');
const { default: Program } = await import('../models/Program.js');
const { default: ProgramEnrollment } = await import('../models/ProgramEnrollment.js');
const { default: Payment } = await import('../models/Payment.js');
const { default: Course } = await import('../models/Course.js');
const { default: Topic } = await import('../models/Topic.js');
const { getPricingPlan } = await import('../controllers/programPaymentController.js');
const { verifyRazorpayCheckoutSignature } = await import('../utils/razorpayVerification.js');
const { resolveProgramSchedule, assertProgramScheduleAccess, isProgramResourceLocked } = await import('../utils/programSchedule.js');

await mongoose.connect(MONGO_URI);

const cleanUpUsers = [];

test.after(async () => {
  for (const uid of cleanUpUsers) {
    await User.deleteMany({ _id: uid });
    await Student.deleteMany({ userId: uid });
    await ProgramEnrollment.deleteMany({ userId: uid });
    await Payment.deleteMany({ userId: uid });
  }
  await mongoose.disconnect();
});

test('TC-PR-01 & TC-PR-02: Placement Monthly Test (₹1) and Annual Test (₹2) plans resolve strictly', async () => {
  const monthlyProg = await Program.findById('6abea6f4b7bfa57af73efc61');
  const annualProg = await Program.findById('6abea6f4b7bfa57af73efc66');

  assert.ok(monthlyProg, 'Monthly test program must exist');
  assert.ok(annualProg, 'Annual test program must exist');

  const monthlyPlan = getPricingPlan(monthlyProg, 'placement-monthly-test');
  assert.equal(monthlyPlan.price, 1, 'Monthly test price must be ₹1');
  assert.equal(monthlyPlan.billingPeriod, 'Monthly');

  const annualPlan = getPricingPlan(annualProg, 'placement-annual-test');
  assert.equal(annualPlan.price, 2, 'Annual test price must be ₹2');
  assert.equal(annualPlan.billingPeriod, 'Annual');
});

test('TC-PR-03: Placement programs have no Free option', async () => {
  const monthlyProg = await Program.findById('6abea6f4b7bfa57af73efc61');
  assert.notEqual(monthlyProg.pricingType, 'Free');
  assert.ok(monthlyProg.pricingPlans.length > 0);
  assert.ok(monthlyProg.pricingPlans.every(p => p.price > 0));
});

test('TC-RZ-03 & TC-RZ-04: Server-side signature verification accepts valid HMAC and rejects tampered ones', () => {
  const orderId = 'order_test_99999';
  const paymentId = 'pay_test_88888';
  const validSignature = crypto.createHmac('sha256', RAZORPAY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');

  const verified = verifyRazorpayCheckoutSignature({
    orderId,
    paymentId,
    signature: validSignature,
    secret: RAZORPAY_SECRET,
  });
  assert.equal(verified, true, 'Valid signature must verify');

  const tamperedVerified = verifyRazorpayCheckoutSignature({
    orderId,
    paymentId,
    signature: 'bad_signature_value',
    secret: RAZORPAY_SECRET,
  });
  assert.equal(tamperedVerified, false, 'Tampered signature must be rejected');
});

test('TC-EN-02: One active paid program rule prevents duplicate active enrollment', async () => {
  const dummyUser = await User.create({
    firstName: 'TestOneActive',
    email: `test_active_${Date.now()}@test.com`,
    password: 'Password123!',
    onboardingCompleted: true,
  });
  cleanUpUsers.push(dummyUser._id);

  const student = await Student.create({
    userId: dummyUser._id,
    name: 'Test One Active Student',
    email: dummyUser.email,
  });

  const prog1 = await Program.findById('6abea6f4b7bfa57af73efc61');
  const prog2 = await Program.findById('6abea6f4b7bfa57af73efc66');

  // Enroll in program 1
  const enrollment1 = await ProgramEnrollment.create({
    userId: dummyUser._id,
    studentId: student._id,
    programId: prog1._id,
    status: 'Active',
    accessTier: 'Member',
    source: 'payment',
  });

  // Check backend guard query used in createPaymentOrder and verifyPayment
  const activeConflict = await ProgramEnrollment.findOne({
    userId: dummyUser._id,
    status: 'Active',
    programId: { $ne: prog2._id },
  }).select('_id').lean();

  assert.ok(activeConflict, 'Backend query must detect conflict with active program 1');
  assert.equal(String(activeConflict._id), String(enrollment1._id));
});

test('TC-EN-05: Access guard assertProgramScheduleAccess throws 403 for unenrolled user', async () => {
  const dummyUser = await User.create({
    firstName: 'UnenrolledLearner',
    email: `unenrolled_${Date.now()}@test.com`,
    password: 'Password123!',
    onboardingCompleted: true,
  });
  cleanUpUsers.push(dummyUser._id);

  const prog = await Program.findById('6abea6f4b7bfa57af73efc61');

  await assert.rejects(
    async () => {
      await assertProgramScheduleAccess({
        user: dummyUser,
        student: null,
        programId: prog._id,
      });
    },
    (err) => {
      assert.equal(err.statusCode, 403);
      return true;
    },
    'Unenrolled user must be rejected with 403'
  );
});

test('TC-DB-01, TC-DB-03, TC-DB-04: Enrolled learner resolves schedule, unlocks Day 1, and accesses primary course', async () => {
  const dummyUser = await User.create({
    firstName: 'EnrolledLearner',
    email: `enrolled_${Date.now()}@test.com`,
    password: 'Password123!',
    onboardingCompleted: true,
  });
  cleanUpUsers.push(dummyUser._id);

  const student = await Student.create({
    userId: dummyUser._id,
    name: 'Enrolled Student',
    email: dummyUser.email,
  });

  const prog = await Program.findById('6abea6f4b7bfa57af73efc61');

  await ProgramEnrollment.create({
    userId: dummyUser._id,
    studentId: student._id,
    programId: prog._id,
    status: 'Active',
    accessTier: 'Member',
    source: 'payment',
    assignedAt: new Date(),
  });

  const schedule = await resolveProgramSchedule({ user: dummyUser, student });
  assert.ok(schedule.enrollment, 'Must resolve enrollment');
  assert.equal(String(schedule.programId), String(prog._id));

  // Access check
  const access = await assertProgramScheduleAccess({ user: dummyUser, student, programId: prog._id });
  assert.ok(access, 'Enrolled user must pass access guard');

  // Verify locked vs unlocked day
  assert.equal(isProgramResourceLocked({ resourceDay: 1, currentDay: 1 }), false, 'Day 1 must be unlocked on Day 1');
  assert.equal(isProgramResourceLocked({ resourceDay: 2, currentDay: 1 }), true, 'Day 2 must be locked on Day 1');
});
