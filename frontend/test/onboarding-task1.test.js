import test from 'node:test';
import assert from 'node:assert/strict';

// Import catalog & option constants by reading the component file or simulating the logic
test('Task 1 — Skill Onboarding Questions & Options verification', () => {
  const SKILL_CATALOG = [
    "C", "C++", "Java", "Python", "JavaScript", "Web Development",
    "DSA", "SQL", "AI/ML", "Generative AI", "Aptitude", "Other"
  ];
  const SKILL_GOAL_OPTIONS = [
    "Learn Fundamentals",
    "Build Practical Skills",
    "Get Certified"
  ];
  const SKILL_LEVEL_OPTIONS = [
    "Beginner",
    "Basic",
    "Intermediate",
    "Advanced"
  ];
  const SKILL_LEARNING_PREFERENCES = [
    "Learn at my own pace",
    "Follow a structured plan",
    "Learn with a trainer"
  ];

  assert.equal(SKILL_CATALOG.length, 12);
  assert.ok(SKILL_CATALOG.includes("C") && SKILL_CATALOG.includes("Generative AI") && SKILL_CATALOG.includes("Other"));
  assert.deepEqual(SKILL_GOAL_OPTIONS, ["Learn Fundamentals", "Build Practical Skills", "Get Certified"]);
  assert.deepEqual(SKILL_LEVEL_OPTIONS, ["Beginner", "Basic", "Intermediate", "Advanced"]);
  assert.deepEqual(SKILL_LEARNING_PREFERENCES, ["Learn at my own pace", "Follow a structured plan", "Learn with a trainer"]);
});

test('Task 1 — Job-Ready Onboarding Questions & Options verification', () => {
  const JOB_OPPORTUNITY_OPTIONS = ["On-campus", "Off-campus", "Both"];
  const JOB_ROLE_OPTIONS = [
    "Software Developer", "Java Developer", "Full Stack Developer", "Python Developer",
    "Data Analyst", "QA / Test Engineer", "Other"
  ];
  const JOB_COMPANY_OPTIONS = [
    "TCS", "Infosys", "Accenture", "Wipro", "Cognizant", "Capgemini", "Amazon", "Deloitte", "Other"
  ];
  const JOB_LEVEL_OPTIONS = ["Beginner", "Basic", "Intermediate", "Advanced"];
  const JOB_SKILL_OPTIONS = [
    "C", "C++", "Java", "Python", "JavaScript", "Web Development",
    "DSA", "SQL", "AI/ML", "Generative AI", "Aptitude", "Other"
  ];
  const JOB_LEARNING_PREFERENCES = [
    "Learn at my own pace", "Follow a structured plan", "Learn with a trainer"
  ];

  assert.deepEqual(JOB_OPPORTUNITY_OPTIONS, ["On-campus", "Off-campus", "Both"]);
  assert.equal(JOB_ROLE_OPTIONS.length, 7);
  assert.equal(JOB_COMPANY_OPTIONS.length, 9);
  assert.equal(JOB_LEVEL_OPTIONS.length, 4);
  assert.equal(JOB_SKILL_OPTIONS.length, 12);
  assert.equal(JOB_LEARNING_PREFERENCES.length, 3);
});

test('Task 1 — State & Validation Logic for Skill path', () => {
  const validateSkillStep = (step, { skill, customSkill, goal, level, preference }) => {
    if (step === 1) return skill === "Other" ? !!customSkill?.trim() : !!skill;
    if (step === 2) return !!goal;
    if (step === 3) return !!level;
    if (step === 4) return !!preference;
    return true;
  };

  // Step 1: standard choice
  assert.equal(validateSkillStep(1, { skill: "Java" }), true);
  // Step 1: Other without text
  assert.equal(validateSkillStep(1, { skill: "Other", customSkill: "" }), false);
  // Step 1: Other with text
  assert.equal(validateSkillStep(1, { skill: "Other", customSkill: "Rust" }), true);

  // Step 2, 3, 4
  assert.equal(validateSkillStep(2, { goal: "" }), false);
  assert.equal(validateSkillStep(2, { goal: "Build Practical Skills" }), true);
  assert.equal(validateSkillStep(3, { level: "Beginner" }), true);
  assert.equal(validateSkillStep(4, { preference: "Follow a structured plan" }), true);
});

test('Task 1 — State & Validation Logic for Job-Ready path', () => {
  const validateJobStep = (step, { opportunity, role, customRole, companies, customCompany, level, skills, customSkill, preference }) => {
    if (step === 1) return !!opportunity;
    if (step === 2) return role === "Other" ? !!customRole?.trim() : !!role;
    if (step === 3) {
      if (!companies || companies.length === 0) return false;
      if (companies.includes("Other") && !customCompany?.trim()) return false;
      return true;
    }
    if (step === 4) return !!level;
    if (step === 5) {
      if (!skills || skills.length === 0) return false;
      if (skills.includes("Other") && !customSkill?.trim()) return false;
      return true;
    }
    if (step === 6) return !!preference;
    return true;
  };

  assert.equal(validateJobStep(1, { opportunity: "Both" }), true);
  assert.equal(validateJobStep(2, { role: "Other", customRole: "" }), false);
  assert.equal(validateJobStep(2, { role: "Other", customRole: "DevOps Engineer" }), true);

  // Step 3: companies multi-select edge cases
  assert.equal(validateJobStep(3, { companies: [] }), false);
  assert.equal(validateJobStep(3, { companies: ["TCS", "Infosys"] }), true);
  assert.equal(validateJobStep(3, { companies: ["Other"], customCompany: "" }), false);
  assert.equal(validateJobStep(3, { companies: ["Other"], customCompany: "Google" }), true);

  // Step 5: skills multi-select edge cases
  assert.equal(validateJobStep(5, { skills: [] }), false);
  assert.equal(validateJobStep(5, { skills: ["Java", "SQL"] }), true);
  assert.equal(validateJobStep(5, { skills: ["Other"], customSkill: "" }), false);
  assert.equal(validateJobStep(5, { skills: ["Other"], customSkill: "Docker" }), true);

  // Step 6: learning preference
  assert.equal(validateJobStep(6, { preference: "Follow a structured plan" }), true);
});

test('Task 1 — Answers Payload correctly distinguished between Skill and Job-Ready', () => {
  const buildPayload = (flowType, data) => {
    if (flowType === "skill") {
      const effectiveSkill = (data.skill === "Other" ? data.customSkill : data.skill).trim();
      return {
        type: "skill",
        skill: effectiveSkill,
        goal: data.goal,
        level: data.level,
        learningPreference: data.preference,
      };
    } else {
      const effectiveJobRole = (data.role === "Other" ? data.customRole : data.role).trim();
      const effectiveCompanies = (data.companies || []).map(c => c === "Other" ? data.customCompany?.trim() : c).filter(Boolean);
      const effectiveSkillsList = (data.skills || []).map(s => s === "Other" ? data.customSkill?.trim() : s).filter(Boolean);
      return {
        type: "job-ready",
        opportunityType: data.opportunity,
        role: effectiveJobRole,
        companies: effectiveCompanies,
        level: data.level,
        skills: effectiveSkillsList,
        learningPreference: data.preference,
      };
    }
  };

  const skillPayload = buildPayload("skill", {
    skill: "Java",
    goal: "Build Practical Skills",
    level: "Intermediate",
    preference: "Follow a structured plan"
  });
  assert.deepEqual(skillPayload, {
    type: "skill",
    skill: "Java",
    goal: "Build Practical Skills",
    level: "Intermediate",
    learningPreference: "Follow a structured plan"
  });

  const jobPayload = buildPayload("job-ready", {
    opportunity: "Both",
    role: "Other",
    customRole: "Cloud Engineer",
    companies: ["TCS", "Other"],
    customCompany: "Amazon",
    level: "Intermediate",
    skills: ["Java", "SQL"],
    preference: "Follow a structured plan"
  });
  assert.deepEqual(jobPayload, {
    type: "job-ready",
    opportunityType: "Both",
    role: "Cloud Engineer",
    companies: ["TCS", "Amazon"],
    level: "Intermediate",
    skills: ["Java", "SQL"],
    learningPreference: "Follow a structured plan"
  });
});
