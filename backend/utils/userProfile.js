import User from "../models/User.js";
import Student from "../models/Student.js";
import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";

const getId = (value) => value?._id || value?.id || value || null;

const getIdString = (value) => {
  const id = getId(value);
  return id ? String(id) : null;
};

const normalizeList = (value) => [
  ...new Set(
    (Array.isArray(value) ? value : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  ),
];

const getName = (user, student) => {
  const userName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return userName || String(student?.name || "").trim();
};

const getCollegeName = (user, student) => {
  if (student?.collegeId && typeof student.collegeId === "object") return student.collegeId.name || "";
  return student?.collegeName || user?.collegeName || "";
};

const preferStudent = (studentValue, userValue, fallback = "") => {
  if (studentValue !== undefined && studentValue !== null && String(studentValue).trim() !== "") return studentValue;
  if (userValue !== undefined && userValue !== null && String(userValue).trim() !== "") return userValue;
  return fallback;
};

const preferStudentList = (studentValue, userValue) => {
  if (Array.isArray(studentValue) && studentValue.length) return studentValue;
  return Array.isArray(userValue) ? userValue : [];
};

const getBatch = ({ user, student, enrollment }) => {
  const enrollmentHasBatch = enrollment && Object.prototype.hasOwnProperty.call(enrollment, "batchId");
  if (enrollmentHasBatch) return enrollment.batchId || null;
  return student?.batchId || user?.batchId || null;
};

const getProgram = ({ user, student, enrollment }) => {
  if (enrollment?.programId && typeof enrollment.programId === "object") return enrollment.programId;
  return null;
};

/**
 * Build the canonical profile contract used by auth, dashboard, student
 * profile, and admin report responses. Enrollment fields are kept separate
 * from learner-entered goals so an imported student's batch/program cannot be
 * mistaken for editable onboarding data.
 */
export const buildUnifiedProfile = ({ user = {}, student = null, enrollment = null } = {}) => {
  const batch = getBatch({ user, student, enrollment });
  const program = getProgram({ user, student, enrollment });
  const profileComplete = Boolean(user?.onboardingCompleted || student?.onboardingCompleted);
  const targetRole = preferStudent(student?.targetRole, user?.targetRole)
    || preferStudent(student?.otherTargetRole, user?.otherTargetRole);
  const targetCompanies = preferStudentList(student?.targetCompanies, user?.targetCompanies);
  const skills = preferStudentList(student?.skills, user?.skills);
  const degree = preferStudent(student?.degree, user?.degree);
  const branch = preferStudent(student?.branch, user?.branch);
  const graduationYear = student?.graduationYear || user?.graduationYear || null;
  const learningGoal = preferStudent(student?.learningGoal, user?.learningGoal);
  const otherTargetRole = preferStudent(student?.otherTargetRole, user?.otherTargetRole);
  const opportunityType = preferStudent(student?.placementCategory, user?.placementCategory);
  const placementTimeline = preferStudent(student?.placementTimeline, user?.placementTimeline);
  const scheduleType = enrollment
    ? (Object.prototype.hasOwnProperty.call(enrollment, "batchId") && enrollment.batchId ? "batch" : "individual")
    : null;
  const startDate = !enrollment
    ? null
    : scheduleType === "batch"
      ? batch?.startDate || null
      : enrollment.individualStartDate || enrollment.assignedAt || null;

  return {
    account: {
      id: getIdString(user) || getIdString(student),
      name: getName(user, student),
      firstName: user?.firstName || String(student?.name || "").trim().split(/\s+/)[0] || "",
      lastName: user?.lastName || String(student?.name || "").trim().split(/\s+/).slice(1).join(" "),
      email: user?.email || student?.email || "",
      role: user?.role || "user",
    },
    education: {
      college: getCollegeName(user, student),
      degree,
      branch,
      graduationYear,
    },
    enrollment: {
      batch: batch
        ? { id: getIdString(batch), name: batch.name || "" }
        : null,
      program: program
        ? {
            id: getIdString(program),
            name: program.name || "",
            programType: program.programType || null,
          }
        : null,
      scheduleType,
      startDate,
      status: enrollment?.status || null,
      accessTier: enrollment?.accessTier || null,
    },
    goals: {
      learningGoal,
      targetRole,
      otherTargetRole,
      opportunityType,
      companies: normalizeList(targetCompanies),
      placementTimeline,
    },
    skills: {
      selectedSkills: normalizeList(skills),
    },
    onboarding: {
      completed: profileComplete,
      completedAt: user?.onboardingCompletedAt || student?.onboardingCompletedAt || null,
    },
    // Keep the flat fields for existing clients while the nested contract is
    // adopted by newer screens.
    id: getIdString(user) || getIdString(student),
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    name: getName(user, student),
    email: user?.email || student?.email || "",
    role: user?.role || "user",
    collegeName: getCollegeName(user, student),
    degree,
    branch,
    graduationYear,
    batchId: getIdString(batch),
    programId: getIdString(program),
    programSelection: user?.programSelection || student?.programSelection || "",
    learningGoal,
    targetRole,
    otherTargetRole,
    placementCategory: opportunityType,
    targetCompanies: normalizeList(targetCompanies),
    placementTimeline,
    skills: normalizeList(skills),
    onboardingCompleted: profileComplete,
    onboardingCompletedAt: user?.onboardingCompletedAt || student?.onboardingCompletedAt || null,
    scheduleType,
    startDate,
  };
};

export const findStudentForUser = async ({ userId, email } = {}) => {
  const identifiers = [
    userId ? { userId } : null,
    email ? { email: String(email).trim().toLowerCase() } : null,
  ].filter(Boolean);
  if (!identifiers.length) return null;

  return Student.findOne({ $or: identifiers })
    .populate("collegeId", "name")
    .populate("batchId", "name startDate expiryDate status")
    .populate("programId", "name programType duration durationDays status visibility pricingType programFee")
    .lean();
};

export const findActiveProgramEnrollment = async ({ userId, studentId, programId = null } = {}) => {
  const identifiers = [
    userId ? { userId } : null,
    studentId ? { studentId } : null,
  ].filter(Boolean);
  if (!identifiers.length) return null;

  const query = {
    $or: identifiers,
    status: { $in: ["Active", "Completed"] },
  };
  if (programId) query.programId = programId;

  const enrollments = await ProgramEnrollment.find(query)
    .sort({ assignedAt: -1, createdAt: -1 })
    .populate("programId", "name programType duration durationDays status visibility pricingType programFee")
    .populate("batchId", "name startDate expiryDate status")
    .lean();
  const statusRank = { Active: 0, Completed: 1 };
  return enrollments.sort((left, right) =>
    (statusRank[left.status] ?? 2) - (statusRank[right.status] ?? 2)
    || new Date(right.assignedAt || right.createdAt || 0) - new Date(left.assignedAt || left.createdAt || 0)
  )[0] || null;
};

export const getUnifiedProfileForUser = async (userOrId) => {
  const user = userOrId?._id || userOrId?.id
    ? (userOrId.firstName !== undefined
      ? userOrId
      : await User.findById(getId(userOrId)).select("-password").lean())
    : null;
  if (!user) return null;

  const student = await findStudentForUser({ userId: user._id, email: user.email });
  const enrollment = await findActiveProgramEnrollment({
    userId: user._id,
    studentId: student?._id,
  });

  return {
    user,
    student,
    enrollment,
    profile: buildUnifiedProfile({ user, student, enrollment }),
  };
};

export const findCollegeForName = async (CollegeModel, name) => {
  const normalized = String(name || "").trim();
  if (!normalized) return null;
  return CollegeModel.findOne({ name: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } });
};

export const ensureStudentForUser = async ({ user, student = null, collegeModel }) => {
  if (!user?._id || !user.email) return student;
  if (student) return student;

  const college = await findCollegeForName(collegeModel, user.collegeName);

  return Student.create({
    collegeId: college?._id || null,
    userId: user._id,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email.split("@")[0],
    email: String(user.email).trim().toLowerCase(),
    degree: user.degree || "",
    branch: user.branch || "",
    graduationYear: user.graduationYear || null,
    programId: null,
    programSelection: user.programSelection || "",
    learningGoal: user.learningGoal || "",
    skills: normalizeList(user.skills),
    targetRole: user.targetRole || "",
    otherTargetRole: user.otherTargetRole || "",
    placementCategory: user.placementCategory || "",
    targetCompanies: normalizeList(user.targetCompanies),
    placementTimeline: user.placementTimeline || "",
    learningPath: user.learningPath || "",
    onboardingCompleted: Boolean(user.onboardingCompleted),
    onboardingCompletedAt: user.onboardingCompletedAt || null,
    status: "Active",
  });
};
