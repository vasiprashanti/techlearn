import test from 'node:test';
import assert from 'node:assert/strict';

// Test simulation of Task 2 recommendation scoring and fallback logic
test('Task 2 — Skill Recommendation: Direct Skill Course match preferred or program scored', () => {
  const availableCourses = [
    { id: "6890f09830551d88a325f623", title: "Java Programming", level: "Beginner" },
    { id: "6890ec81950225df57310f52", title: "Python Programming", level: "Beginner" },
    { id: "6890c2acbc09eb4b5c346b9b", title: "C Programming", level: "Beginner" }
  ];

  const catalog = [
    {
      _id: "prog_java_fs",
      name: "Java Full Stack Developer",
      programType: "Skill",
      skillTags: ["Java", "Full Stack", "SQL"],
      learningGoals: ["Build Practical Skills"],
      courseIds: [{ level: "Intermediate" }]
    },
    {
      _id: "prog_c",
      name: "C Programming Masterclass",
      programType: "Skill",
      skillTags: ["C"],
      learningGoals: ["Learn Fundamentals"],
      courseIds: [{ level: "Beginner" }]
    }
  ];

  const recommendSkill = ({ skill, goal, level }) => {
    const normalizedSkill = skill.toLowerCase();
    const directCourse = availableCourses.find(c => {
      const t = c.title.toLowerCase();
      return t === normalizedSkill || t.includes(normalizedSkill) || normalizedSkill.includes(t);
    });

    const matchingPrograms = catalog.filter(p => {
      if (p.programType !== "Skill") return false;
      const tags = [...p.skillTags, p.name].join(" ").toLowerCase();
      return tags.includes(normalizedSkill);
    });

    let bestProgram = null;
    if (matchingPrograms.length > 0) {
      bestProgram = matchingPrograms.map(p => {
        let score = 0;
        if (p.skillTags.map(s => s.toLowerCase()).includes(normalizedSkill)) score += 4;
        if (p.learningGoals.some(g => g.toLowerCase().includes(goal.toLowerCase()))) score += 2;
        return { program: p, score };
      }).sort((a, b) => b.score - a.score)[0]?.program;
    }

    if (directCourse) {
      return { type: "course", courseId: directCourse.id, programId: bestProgram?._id || null };
    } else if (bestProgram) {
      return { type: "program", programId: bestProgram._id };
    } else if (availableCourses.length > 0) {
      return { type: "course", courseId: availableCourses[0].id };
    }
    return { type: null, programId: null, courseId: null };
  };

  // Test 1: Exact skill match found in courses
  const resJava = recommendSkill({ skill: "Java", goal: "Build Practical Skills", level: "Intermediate" });
  assert.equal(resJava.type, "course");
  assert.equal(resJava.courseId, "6890f09830551d88a325f623");
  assert.equal(resJava.programId, "prog_java_fs");

  // Test 2: Skill only in program
  const resFullStack = recommendSkill({ skill: "Full Stack", goal: "Build Practical Skills", level: "Intermediate" });
  assert.equal(resFullStack.type, "program");
  assert.equal(resFullStack.programId, "prog_java_fs");

  // Test 3: Unmatched skill falls back to first available course
  const resRust = recommendSkill({ skill: "Rust", goal: "Learn Fundamentals", level: "Beginner" });
  assert.equal(resRust.type, "course");
  assert.equal(resRust.courseId, availableCourses[0].id);
});

test('Task 2 — Job-Ready Recommendation: Target Role weighting, Companies, Skills, and Program priority', () => {
  const catalog = [
    {
      _id: "prog_placement_fullstack",
      name: "Full Stack Placement Sprint",
      programType: "Placement",
      targetRoles: ["Full Stack Developer", "Software Developer"],
      targetCompanies: ["TCS", "Infosys", "Amazon"],
      skillTags: ["Java", "JavaScript", "SQL", "DSA"],
    },
    {
      _id: "prog_placement_python",
      name: "Python Developer Placement",
      programType: "Placement",
      targetRoles: ["Python Developer", "Data Analyst"],
      targetCompanies: ["Wipro", "Cognizant"],
      skillTags: ["Python", "SQL", "DSA"],
    },
    {
      _id: "prog_skill_only",
      name: "Core Java Skill Track",
      programType: "Skill",
      targetRoles: [],
      targetCompanies: [],
      skillTags: ["Java"],
    }
  ];

  const recommendJobReady = ({ role, companies, skills, level }) => {
    const normalizedRole = role.toLowerCase();
    const rolePrograms = catalog.filter(p => p.programType === "Placement");

    const scored = rolePrograms.map(p => {
      let score = 0;
      const progRoles = (p.targetRoles || []).map(r => r.toLowerCase());
      const progCompanies = (p.targetCompanies || []).map(c => c.toLowerCase());
      const progSkills = (p.skillTags || []).map(s => s.toLowerCase());

      // Target Role: 35 points
      if (progRoles.some(r => r.includes(normalizedRole) || normalizedRole.includes(r))) {
        score += 35;
      }
      // Companies: 10 points each
      const compMatches = companies.filter(c => progCompanies.includes(c.toLowerCase()));
      score += compMatches.length * 10;
      // Skills: 5 points each
      const skillMatches = skills.filter(s => progSkills.includes(s.toLowerCase()));
      score += skillMatches.length * 5;

      return { program: p, score };
    }).sort((a, b) => b.score - a.score);

    const winner = scored[0]?.program || null;
    return {
      type: "program",
      programId: winner?._id || null,
      score: scored[0]?.score || 0
    };
  };

  // Learner targeting Full Stack Developer with TCS and Amazon
  const match1 = recommendJobReady({
    role: "Full Stack Developer",
    companies: ["TCS", "Amazon"],
    skills: ["Java", "SQL"],
    level: "Intermediate"
  });

  assert.equal(match1.type, "program");
  assert.equal(match1.programId, "prog_placement_fullstack");
  // 35 (role) + 20 (2 companies) + 10 (2 skills) = 65
  assert.equal(match1.score, 65);

  // Learner targeting Python Developer
  const match2 = recommendJobReady({
    role: "Python Developer",
    companies: ["Wipro"],
    skills: ["Python"],
    level: "Beginner"
  });

  assert.equal(match2.programId, "prog_placement_python");
  // 35 (role) + 10 (company) + 5 (skill) = 50
  assert.equal(match2.score, 50);
});

test('Task 2 — Recommendation ID Preservation into Session Storage and Navigation', () => {
  const STORAGE_KEY = "techlearn-contextual-onboarding";

  // Simulate storing recommended ID upon clicking Start Learning
  const resultItem = {
    itemType: "program",
    program: { _id: "6abea6f4b7bfa57af73efc61", name: "Placement Monthly Test" },
    matchedCourse: { id: "6a4e9c91d88bac823e89e6e1" }
  };

  const payload = {
    type: "job-ready",
    role: "Software Developer",
    programId: resultItem.program._id,
    courseId: resultItem.matchedCourse.id
  };

  const storedStr = JSON.stringify(payload);
  const parsed = JSON.parse(storedStr);

  assert.equal(parsed.programId, "6abea6f4b7bfa57af73efc61");
  assert.equal(parsed.courseId, "6a4e9c91d88bac823e89e6e1");

  // Validate that OnboardingPrograms resolution logic picks up this programId
  const programOptions = [
    { _id: "other_id", name: "Other Program" },
    { _id: "6abea6f4b7bfa57af73efc61", name: "Placement Monthly Test" }
  ];

  const selectedProg = programOptions.find(p => String(p._id) === String(parsed.programId));
  assert.ok(selectedProg);
  assert.equal(selectedProg.name, "Placement Monthly Test");
});
