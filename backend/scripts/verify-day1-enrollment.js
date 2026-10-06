// Run against a disposable local MongoDB replica set only.
// TECHLEARN_QA_MONGO_URI=mongodb://127.0.0.1:.../techlearn_oct5_qa
// node scripts/verify-day1-enrollment.js [--serve]
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';

const uri = process.env.TECHLEARN_QA_MONGO_URI;
assert(uri && /^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\/techlearn_oct5_qa(?:\?|$)/.test(uri),
  'Verification requires a disposable localhost database named techlearn_oct5_qa.');
process.env.MONGO_URI = uri;
process.env.JWT_SECRET = 'isolated-local-enrollment-qa-secret';
process.env.RAZORPAY_KEY_ID = '';
process.env.RAZORPAY_KEY_SECRET = 'isolated-local-invalid-payment-test';

const { default: User } = await import('../models/User.js');
const { default: Student } = await import('../models/Student.js');
const { default: Program } = await import('../models/Program.js');
const { default: Enrollment } = await import('../models/ProgramEnrollment.js');
const { default: Course } = await import('../models/Course.js');
const { default: Topic } = await import('../models/Topic.js');
const { default: Notes } = await import('../models/Notes.js');
const { default: Track } = await import('../models/TrackTemplate.js');
const { default: Question } = await import('../models/Question.js');
const { default: Roadmap } = await import('../models/Roadmap.js');
const { default: Batch } = await import('../models/Batch.js');
const { upsertProgramEnrollment, syncPrimaryProgramPointers, assignProgramToBatch } = await import('../utils/programEnrollment.js');
const { buildDefaultProgramPhases } = await import('../utils/programPhases.js');
const { getProgramAccessExpiryDate } = await import('../utils/programPricing.js');

await mongoose.connect(uri);
await Promise.all([User.init(), Student.init(), Program.init(), Enrollment.init()]);
const app = express();
app.use(cors());
app.use(express.json());
for (const [prefix, module] of [
  ['/api/auth', 'authRoutes'], ['/api/admin/programs', 'adminProgramRoutes'],
  ['/api/admin', 'adminPortalRoutes'], ['/api/programs', 'programRoutes'],
  ['/api/dashboard', 'dashboardRoutes'], ['/api/courses', 'courseRoutes'],
  ['/api/daily-task', 'dailyTaskRoutes'], ['/api/daily-challenge', 'dailyChallengeRoutes'],
  ['/api/roadmaps', 'roadmapRoutes'], ['/api/payments', 'paymentRoutes'],
  ['/api/users', 'userRoutes'], ['/api/placement-learning', 'placementLearningRoutes'],
  ['/api/user-progress', 'userProgressRoutes'], ['/api/xp', 'xpRoutes'],
  ['/api/leaderboard', 'leaderboardRoutes'],
]) app.use(prefix, (await import(`../routes/${module}.js`)).default);
app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ message: error.message }));

const password = 'LocalQa123!';
const admin = await User.create({ firstName: 'QA Admin', email: 'admin@oct5.example.test', password, role: 'admin', onboardingCompleted: true });
const makeLearner = async (label) => {
  const user = await User.create({ firstName: label, email: `${label.toLowerCase()}@oct5.example.test`, password,
    onboardingCompleted: true, learningGoal: 'Learn a Skill', skills: ['C'], learningPath: 'Member' });
  const student = await Student.create({ name: label, email: user.email, userId: user._id,
    learningGoal: 'Learn a Skill', skills: ['C'], onboardingCompleted: true, learningPath: 'Member' });
  return { user, student };
};
const learner = await makeLearner('DateLearner');
const monthly = await makeLearner('MonthlyLearner');
const annual = await makeLearner('AnnualLearner');
const concurrent = await makeLearner('ConcurrentLearner');
const free = await makeLearner('FreeLearner');
const fixtures = { password, adminEmail: admin.email, learnerEmail: learner.user.email, learnerId: String(learner.student._id) };
app.get('/qa/fixtures', (req, res) => res.json(fixtures));
const server = await new Promise((resolve) => { const instance = app.listen(5099, '127.0.0.1', () => resolve(instance)); });
const base = 'http://127.0.0.1:5099';
const call = async (path, token, body, method = body === undefined ? 'GET' : 'POST') => {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const content = await response.text();
  return { status: response.status, body: response.headers.get('content-type')?.includes('application/json')
    ? JSON.parse(content) : { message: content, path } };
};
const ok = async (...args) => { const result = await call(...args); assert(result.status < 300, JSON.stringify(result)); return result.body; };
const login = async (user) => (await ok('/api/auth/login', null, { email: user.email, password })).token;
const adminToken = await login(admin);
const learnerToken = await login(learner.user);
const makeResources = async (label) => {
  const course = await Course.create({ title: `${label} course`, status: 'Published', deliveryType: 'Structured', accessType: 'Free' });
  const topics = [];
  for (let index = 0; index < 3; index++) {
    const topic = await Topic.create({ title: `${label} day ${index + 1}`, courseId: course._id, slug: `${label}-day-${index + 1}`, index: index + 1 });
    const note = await Notes.create({ topicId: topic._id, parsedContent: `${label} notes for day ${index + 1}` });
    topic.notesId = note._id;
    await topic.save();
    topics.push(topic._id);
  }
  course.topicIds = topics;
  course.numTopics = topics.length;
  await course.save();
  const questionId = new mongoose.Types.ObjectId();
  await Question.collection.insertOne({ _id: questionId, title: `${label} question`, categoryType: 'MCQ', difficulty: 'Easy', status: 'Published',
    content: { options: [{ label: 'A', text: 'Correct' }, { label: 'B', text: 'Other' }, { label: 'C', text: 'Other' }, { label: 'D', text: 'Other' }], correctOption: 'A' } });
  const tracks = [];
  for (const trackType of ['Daily Task', 'Daily Challenge']) tracks.push(await Track.create({ name: `${label} ${trackType}`, category: 'C', trackType, totalDays: 30,
    dayAssignments: Array.from({ length: 30 }, (_, index) => ({ dayNumber: index + 1, questionId,
      tasks: [{ taskType: 'MCQ', questionId, status: 'Published' }] })) }));
  const roadmap = await Roadmap.create({ title: `${label} roadmap`, targetRole: 'Developer', duration: 30, durationUnit: 'days', markdownBody: `# ${label} roadmap` });
  return { course, tracks, roadmap };
};
const resourcesA = await makeResources('QA-A');
const resourcesB = await makeResources('QA-B');
const create = async (name, resources, extra = {}) => {
  const response = await ok('/api/admin/programs', adminToken, { name, description: `${name} description`, programType: 'Skill', duration: '30 Days', durationDays: 30,
    phases: buildDefaultProgramPhases('Skill', 30), status: 'Published', visibility: 'Public', pricingType: 'Free', availability: 'Structured',
    skillTags: ['C'], courseIds: [String(resources.course._id)], ...extra });
  const program = response.program || response.data;
  assert(program?._id, JSON.stringify(response));
  await Program.updateOne({ _id: program._id }, { $set: { roadmapIds: [resources.roadmap._id], trackTemplateIds: resources.tracks.map((track) => track._id) } });
  return Program.findById(program._id);
};
try {
  const programA = await create('QA C Program A', resourcesA);
  const programB = await create('QA C Program B', resourcesB, { visibility: 'Private' });
  const paid = await create('QA Paid C Program', resourcesA, { pricingType: 'Paid', billingOptions: ['Monthly', 'Annual'],
    monthlyStructuredFee: 1379, annualStructuredFee: 12345, monthlyAccessDurationDays: 30, annualAccessDurationDays: 365 });
  const unrelated = await create('QA Python Program', await makeResources('QA-Python'), { skillTags: ['Python'] });
  Object.assign(fixtures, { programA: String(programA._id), programB: String(programB._id), paidProgram: String(paid._id), courseB: String(resourcesB.course._id) });

  let rows = await ok('/api/admin/students/global', adminToken);
  const emptyRow = rows.data.items?.find((row) => row.id === String(learner.student._id));
  assert(emptyRow, JSON.stringify(rows));
  assert(!emptyRow.currentProgram && !emptyRow.activeProgramId);
  assert.equal((await Student.findById(learner.student._id)).collegeId, null);
  assert.equal((await Enrollment.countDocuments({ userId: learner.user._id })), 0);
  console.log('PASS: no default Program/college; All Time list includes unassigned learners');

  const recommendations = await ok('/api/programs/recommendations', learnerToken);
  assert(recommendations.programs.some((program) => String(program._id) === String(programA._id)));
  assert(!recommendations.programs.some((program) => [String(programB._id), String(unrelated._id)].includes(String(program._id))));
  await Student.updateOne({ _id: learner.student._id }, { $set: { skills: ['Rust'] } });
  assert.equal((await ok('/api/programs/recommendations', learnerToken)).programs.length, 0);
  await Student.updateOne({ _id: learner.student._id }, { $set: { skills: ['C'] } });
  assert.equal((await call(`/api/programs/${programA._id}/free-enroll`, null, {})).status, 401);
  assert.equal((await call(`/api/programs/${paid._id}/free-enroll`, learnerToken, {})).status, 404);
  assert.equal((await Enrollment.countDocuments({ userId: learner.user._id })), 0);
  console.log('PASS: configured skill recommendations, no-match state, and auth/paid enrollment guards');

  const today = new Date().toISOString().slice(0, 10);
  await ok(`/api/admin/students/${learner.student._id}`, adminToken, { programId: String(programA._id), individualStartDate: today, enrollmentStatus: 'Active' }, 'PUT');
  assert.equal(String((await ok('/api/dashboard', learnerToken)).program.id), String(programA._id));
  await ok(`/api/admin/students/${learner.student._id}/programs/${programA._id}/start-date`, adminToken, { individualStartDate: '2026-10-24' }, 'PATCH');
  let enrollment = await Enrollment.findOne({ userId: learner.user._id, programId: programA._id }).lean();
  assert.equal(enrollment.individualStartDate.toISOString().slice(0, 10), '2026-10-24');
  rows = await ok('/api/admin/students/global', adminToken);
  assert.equal(rows.data.items.find((row) => row.id === String(learner.student._id)).individualStartDate.slice(0, 10), '2026-10-24');
  await ok(`/api/admin/students/${learner.student._id}`, adminToken, { programId: String(programB._id), individualStartDate: today }, 'PUT');
  assert.equal(await Enrollment.countDocuments({ userId: learner.user._id, status: 'Active' }), 1);
  assert.equal((await Enrollment.findOne({ userId: learner.user._id, programId: programA._id })).status, 'Paused');
  assert.equal(await Enrollment.countDocuments({ userId: learner.user._id }), 2);
  let dashboard = await ok('/api/dashboard', learnerToken);
  assert.equal(String(dashboard.program.id), String(programB._id));
  assert.equal(String(dashboard.program.courses[0]._id), String(resourcesB.course._id));
  assert.equal(String(dashboard.program.roadmaps[0]._id), String(resourcesB.roadmap._id));
  assert(dashboard.program.trackTemplates.every((track) => resourcesB.tracks.some((own) => String(own._id) === String(track._id))));
  assert.equal((await call(`/api/programs/${programA._id}`, learnerToken)).status, 403);
  assert.equal((await ok(`/api/programs/${programB._id}`, learnerToken)).program.name, programB.name);
  const tasks = await ok('/api/daily-task/today', learnerToken);
  assert(tasks.data.tasks.length > 0, JSON.stringify(tasks));
  const course = await ok(`/api/courses/${resourcesB.course._id}`, learnerToken);
  assert.equal(String(course.programId), String(programB._id));
  assert.equal(course.topics[0].notes, 'QA-B notes for day 1');
  assert(course.topics[2].isLocked && !course.topics[2].notes);
  const challenge = await ok('/api/daily-challenge/active', learnerToken);
  assert.equal(challenge.data.questionTitle, 'QA-B question');
  assert.equal(String(challenge.data.programId), String(programB._id));
  const roadmap = await ok('/api/roadmaps/for-you', learnerToken);
  assert.equal(String(roadmap.data._id || roadmap.data.id), String(resourcesB.roadmap._id));
  assert.equal((await call(`/api/programs/${programA._id}/experience`, learnerToken)).status, 403);
  const reLoginToken = await login(learner.user);
  assert.equal(String((await ok('/api/dashboard', reLoginToken)).program.id), String(programB._id));
  const listedPrograms = await ok('/api/admin/programs', adminToken);
  assert.equal(listedPrograms.programs.find((program) => String(program._id) === String(programA._id)).studentCount, 1);
  assert.equal((await ok(`/api/admin/programs/${programB._id}`, adminToken)).program.studentIds.length, 1);
  console.log('PASS: date save/refresh, A→B switch, history, counts, resources, and new login');

  for (const [fixture, period, days] of [[monthly, 'Monthly', 30], [annual, 'Annual', 365]]) {
    const plan = paid.pricingPlans.find((candidate) => candidate.billingPeriod === period).toObject();
    await upsertProgramEnrollment({ ...fixture, program: paid, pricingPlan: plan, individualStartDate: '2026-10-05', batchId: null, source: 'admin' });
    await syncPrimaryProgramPointers(fixture);
    const saved = await Enrollment.findOne({ userId: fixture.user._id, programId: paid._id }).lean();
    assert.equal(saved.accessDurationDays, days);
    assert.equal(saved.expiryDate.toISOString(), getProgramAccessExpiryDate('2026-10-05', days).toISOString());
    assert.equal(saved.accessExpiresAt.toISOString(), saved.expiryDate.toISOString());
  }
  await ok(`/api/admin/programs/${paid._id}`, adminToken, { monthlyAccessDurationDays: 10, annualAccessDurationDays: 20 }, 'PATCH');
  await ok(`/api/admin/students/${monthly.student._id}/programs/${paid._id}/start-date`, adminToken, { individualStartDate: '2026-10-24' }, 'PATCH');
  const savedMonthly = await Enrollment.findOne({ userId: monthly.user._id }).lean();
  assert.equal(savedMonthly.accessDurationDays, 30);
  assert.equal(savedMonthly.expiryDate.toISOString(), '2026-11-23T00:00:00.000Z');
  assert.equal((await Enrollment.findOne({ userId: annual.user._id })).accessDurationDays, 365);
  await ok(`/api/admin/students/${learner.student._id}`, adminToken, { enrollmentStatus: 'Completed' }, 'PUT');
  assert.equal((await Enrollment.findOne({ userId: learner.user._id, programId: programB._id })).status, 'Completed');
  assert.equal((await ok(`/api/programs/${programB._id}`, learnerToken)).program.name, programB.name);
  assert((await ok(`/api/courses/${resourcesB.course._id}`, learnerToken)).topics.every((topic) => !topic.isLocked && topic.notes));
  await ok(`/api/admin/students/${learner.student._id}`, adminToken, { enrollmentStatus: 'Active' }, 'PUT');
  console.log('PASS: Monthly/Annual snapshots, start-date expiry recalculation, and lifecycle status persistence');

  const freeToken = await login(free.user);
  await ok(`/api/programs/${programA._id}/free-enroll`, freeToken, {});
  await ok(`/api/programs/${programA._id}/free-enroll`, freeToken, {});
  assert.equal(await Enrollment.countDocuments({ userId: free.user._id, programId: programA._id }), 1);
  assert.equal(String((await ok('/api/dashboard', freeToken)).program.id), String(programA._id));
  const cohortLearner = await makeLearner('BatchLearner');
  const batch = await Batch.create({ name: 'QA C Cohort', startDate: today,
    expiryDate: new Date(Date.now() + 29 * 86400000), releaseTime: '00:00', status: 'Active', programId: programA._id });
  await Student.updateOne({ _id: cohortLearner.student._id }, { $set: { batchId: batch._id } });
  await assignProgramToBatch({ batchId: batch._id, program: programA });
  const batchToken = await login(cohortLearner.user);
  const batchDashboard = await ok('/api/dashboard', batchToken);
  assert.equal(String(batchDashboard.program.id), String(programA._id));
  assert.equal(String(batchDashboard.program.courses[0]._id), String(resourcesA.course._id));
  assert.equal(String((await Enrollment.findOne({ userId: cohortLearner.user._id })).batchId), String(batch._id));
  assert((await ok('/api/daily-task/today', batchToken)).data.tasks.length > 0);
  console.log('PASS: batch assignment uses the same enrollment, Program, course, and daily tasks');
  const concurrentToken = await login(concurrent.user);
  const results = await Promise.all([programA, unrelated].map((program) => call(`/api/programs/${program._id}/free-enroll`, concurrentToken, {})));
  assert.deepEqual(results.map((result) => result.status).sort(), [201, 409], JSON.stringify(results));
  assert.equal(await Enrollment.countDocuments({ userId: concurrent.user._id, status: 'Active' }), 1);
  assert.equal(await Enrollment.countDocuments({ userId: concurrent.user._id }), 1);
  console.log('PASS: real free-enrollment API, idempotency, and concurrent one-active-Program enforcement');
  const named = await create('QA Named Plans', resourcesA, { pricingType: 'Paid', pricingPlans: [
    { key: 'annual-pass', title: 'Annual Pass', price: 2500, accessDuration: 1, accessDurationUnit: 'Years', availability: 'Structured' },
    { key: 'monthly-pass', title: 'Monthly Pass', price: 250, accessDuration: 1, accessDurationUnit: 'Months', availability: 'Structured' },
  ] });
  const namedLearner = await makeLearner('NamedPlansLearner');
  await upsertProgramEnrollment({ ...namedLearner, program: named, pricingPlan: named.pricingPlans[0].toObject(), individualStartDate: '2026-10-10', batchId: null, source: 'admin' });
  let namedEnrollment = await Enrollment.findOne({ userId: namedLearner.user._id }).lean();
  assert.equal(namedEnrollment.programExpiresAt.toISOString().slice(0, 10), '2026-11-09');
  assert.equal(namedEnrollment.accessExpiresAt.toISOString().slice(0, 10), '2027-10-10');
  await ok(`/api/admin/students/${namedLearner.student._id}/programs/${named._id}/start-date`, adminToken, { individualStartDate: '2026-10-24' }, 'PATCH');
  namedEnrollment = await Enrollment.findOne({ userId: namedLearner.user._id }).lean();
  assert.equal(namedEnrollment.programExpiresAt.toISOString().slice(0, 10), '2026-11-23');
  assert.equal(namedEnrollment.accessExpiresAt.toISOString().slice(0, 10), '2027-10-24');
  await ok(`/api/admin/programs/${named._id}`, adminToken, { pricingType: 'Paid', availability: 'Structured', pricingPlans: [
    { key: 'annual-pass', title: 'Changed Annual', price: 3000, accessDuration: 2, accessDurationUnit: 'Years' },
  ] }, 'PATCH');
  assert.equal((await Enrollment.findOne({ userId: namedLearner.user._id }).lean()).pricingPlanSnapshot.title, 'Annual Pass');
  await Enrollment.updateOne({ userId: namedLearner.user._id }, { $set: { status: 'Completed' } });
  const namedToken = await login(namedLearner.user);
  assert.equal((await call(`/api/programs/${named._id}`, namedToken)).status, 200);
  await ok(`/api/programs/${programA._id}/free-enroll`, namedToken, {});
  assert.equal(await Enrollment.countDocuments({ userId: namedLearner.user._id }), 2);
  await Enrollment.updateOne({ userId: namedLearner.user._id, programId: named._id }, { $set: { accessExpiresAt: new Date('2020-01-01') } });
  assert.equal((await call(`/api/programs/${named._id}`, namedToken)).status, 403);
  const unassigned = await makeLearner('UnassignedCategoryLearner');
  assert(!(await ok('/api/admin/students/global?tab=skill&month=all', adminToken)).data.items.some(row => row.id === String(unassigned.student._id)));
  assert((await ok('/api/admin/students/global?tab=leads&month=all', adminToken)).data.items.some(row => row.id === String(unassigned.student._id)));
  assert(!(await ok('/api/admin/students/global?tab=waitlist&month=all', adminToken)).data.items.some(row => row.id === String(unassigned.student._id)));
  await mongoose.model('ProgramWaitlist').create({ userId: unassigned.user._id, programId: programA._id });
  assert((await ok('/api/admin/students/global?tab=waitlist&month=all', adminToken)).data.items.some(row => row.id === String(unassigned.student._id)));
  assert((await ok('/api/admin/students/global?tab=completed&month=all', adminToken)).data.items.some(row => row.id === String(namedLearner.student._id)));
  const colleges = mongoose.model('College');
  const collegeA = await colleges.create({ name: 'QA College A' });
  const collegeB = await colleges.create({ name: 'QA College B' });
  const createdBatch = await ok('/api/admin/batches', adminToken, { name: 'QA Multi College', collegeIds: [String(collegeA._id), String(collegeB._id), String(collegeA._id)], startDate: today, programId: String(programA._id), programType: 'Skill', releaseTime: '00:00', status: 'Draft' });
  const batchId = createdBatch.data?._id || createdBatch.data?.id;
  assert(batchId, JSON.stringify(createdBatch));
  assert.equal((await Batch.findById(batchId)).collegeIds.length, 2);
  assert.equal((await call(`/api/admin/students/${unassigned.student._id}`, adminToken, { batchId }, 'PUT')).status, 400);
  await ok(`/api/admin/batches/${batchId}`, adminToken, { allColleges: true }, 'PUT');
  assert.equal((await Batch.findById(batchId)).allColleges, true);
  assert.equal((await Batch.findById(batchId)).collegeIds.length, 0);
  await ok(`/api/admin/students/${unassigned.student._id}`, adminToken, { batchId }, 'PUT');
  assert.equal(String((await Enrollment.findOne({ userId: unassigned.user._id })).batchId), String(batchId));
  console.log('PASS: named plan CRUD, separate expiry dates, preserved purchased terms, Completed→new enrollment, expired history guard, and multi/all-college batch CRUD');
  console.log('DAY 1 ISOLATED DATABASE/API QA PASSED', JSON.stringify(fixtures));
  if (process.argv.includes('--serve')) {
    console.log('Local QA API remains available at http://127.0.0.1:5099 for browser verification.');
    await new Promise(() => {});
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
}
