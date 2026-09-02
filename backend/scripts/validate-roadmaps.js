import assert from "node:assert/strict";
import Roadmap from "../models/Roadmap.js";
import {
  formatRoadmapDuration,
  isRoadmapBranchEligible,
  isRoadmapTargetRoleMatch,
} from "../utils/roadmapEligibility.js";

const validateRoadmaps = () => {
  const roadmap = new Roadmap({
    title: "Long Career Roadmap",
    targetRole: "Backend Developer",
    duration: 500,
    durationUnit: "months",
    markdownBody: "# Roadmap",
  });
  assert.equal(roadmap.validateSync(), undefined, "custom durations should not have an artificial upper bound");
  assert.equal(formatRoadmapDuration({ duration: 6, durationUnit: "weeks" }), "6 weeks");
  assert.equal(formatRoadmapDuration({ duration: 1, durationUnit: "months" }), "1 month");
  assert.equal(isRoadmapTargetRoleMatch("Frontend Developer", "frontend developer"), true);
  assert.equal(isRoadmapTargetRoleMatch("Frontend Developer", "Backend Developer"), false);

  const branchRestricted = { branches: ["CSE", "IT"] };
  assert.equal(isRoadmapBranchEligible({ roadmap: branchRestricted, user: { branch: "B.Tech CSE" } }), true);
  assert.equal(isRoadmapBranchEligible({ roadmap: branchRestricted, user: { branch: "Mechanical Engineering" } }), false);
  assert.equal(isRoadmapBranchEligible({ roadmap: { branches: [] }, user: {} }), true);
  assert.equal(isRoadmapBranchEligible({ roadmap: { branches: ["Other"] }, user: { branch: "Architecture" } }), true);

  const invalid = new Roadmap({ title: "Missing metadata", markdownBody: "# Roadmap" }).validateSync();
  assert.ok(invalid?.errors?.targetRole, "targetRole should be mandatory");
  assert.ok(invalid?.errors?.duration, "duration should be mandatory");
  assert.ok(invalid?.errors?.durationUnit, "durationUnit should be mandatory");
  console.log("Roadmap schema, duration, role matching, and branch eligibility checks passed.");
};

validateRoadmaps();
