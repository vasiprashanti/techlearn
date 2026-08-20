import fs from "fs";

/**
 * Parse Hiring Job Markdown file.
 *
 * Expected format:
 *
 * ---
 * companyType: MNC
 * jobType: Full-time
 * workMode: Hybrid
 * location: Hyderabad
 * experience: Fresher
 * salary: ₹4–6 LPA
 * education: B.Tech
 * graduationYear: 2026
 * eligibility: Minimum 60%
 * applicationUrl: https://example.com/apply
 * applicationDeadline: 2026-08-30
 * ---
 *
 * # Software Engineer
 *
 * ## Description
 * Job description here...
 *
 * ## Skills
 * - Java
 * - SQL
 *
 * ## Eligible Branches
 * - CSE
 * - AI/ML
 *
 * ## Responsibilities
 * - Develop applications
 * - Write code
 *
 * ## Requirements
 * - Programming knowledge
 *
 * ## Benefits
 * - Career growth
 */

const parseFrontmatter = (content) => {
  const frontmatterMatch = content.match(
    /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/
  );

  if (!frontmatterMatch) {
    return {
      metadata: {},
      content,
    };
  }

  const metadataText = frontmatterMatch[1];
  const metadata = {};

  for (const line of metadataText.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line
      .slice(0, separatorIndex)
      .trim();

    const value = line
      .slice(separatorIndex + 1)
      .trim();

    if (key) {
      metadata[key] = value;
    }
  }

  return {
    metadata,
    content: content.slice(frontmatterMatch[0].length),
  };
};


const extractSection = (content, heading) => {
  const escapedHeading = heading.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(
    `##\\s+${escapedHeading}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`,
    "i"
  );

  const match = content.match(regex);

  return match ? match[1].trim() : "";
};


const extractList = (content, heading) => {
  const section = extractSection(content, heading);

  if (!section) {
    return [];
  }

  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-\s*/, "").trim())
    .filter(Boolean);
};


const parseJobMarkdown = (filePath) => {
  const content = fs.readFileSync(
    filePath,
    "utf-8"
  );

  if (!content.trim()) {
    throw new Error("Markdown file is empty");
  }

  const {
    metadata,
    content: markdownContent,
  } = parseFrontmatter(content);

  const titleMatch = markdownContent.match(
    /^#\s+(.+)$/m
  );

  const title = titleMatch
    ? titleMatch[1].trim()
    : "";

  if (!title) {
    throw new Error(
      "Job title is required in Markdown file"
    );
  }

  const description =
    extractSection(
      markdownContent,
      "Description"
    );

  if (!description) {
    throw new Error(
      "Job description is required in Markdown file"
    );
  }

  const skills = extractList(
    markdownContent,
    "Skills"
  );

  const eligibleBranches = extractList(
    markdownContent,
    "Eligible Branches"
  );

  const responsibilities = extractList(
    markdownContent,
    "Responsibilities"
  );

  const requirements = extractList(
    markdownContent,
    "Requirements"
  );

  const benefits = extractList(
    markdownContent,
    "Benefits"
  );

  return {
    title,
    description,

    companyType:
      metadata.companyType || "",

    jobType:
      metadata.jobType || "",

    workMode:
      metadata.workMode || "",

    location:
      metadata.location || "",

    experience:
      metadata.experience || "",

    salary:
      metadata.salary || "",

    education:
      metadata.education || "",

    graduationYear:
      metadata.graduationYear || "",

    eligibility:
      metadata.eligibility || "",

    applicationUrl:
      metadata.applicationUrl || "",

    applicationDeadline:
      metadata.applicationDeadline || null,

    skills,
    eligibleBranches,
    responsibilities,
    requirements,
    benefits,

    rawContent: markdownContent,
    filePath,
  };
};


/**
 * Parse a single Job Markdown file.
 */
export const parseJobMarkdownFile = (
  filePath
) => {
  try {
    const jobData = parseJobMarkdown(filePath);

    return {
      success: true,
      type: "job",
      filePath,
      data: jobData,
    };
  } catch (error) {
    console.error(
      `Error parsing job Markdown ${filePath}:`,
      error
    );

    return {
      success: false,
      error: error.message,
      filePath,
    };
  }
};

export default {
  parseJobMarkdown,
  parseJobMarkdownFile,
};