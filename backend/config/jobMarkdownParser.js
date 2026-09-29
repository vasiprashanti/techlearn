import fs from "fs";

/**
 * Parses markdown/text formatted according to:
 * 1. The Standard Job Posting Template:
 *    # Job Posting
 *    ## Basic Information
 *    Job Title: ...
 *    Role Category: ...
 *    Company Name: ...
 *    Location: ...
 *    Work Mode: ...
 *    Employment Type: ...
 *    Experience Level: ...
 *    Number of Openings: ...
 *
 *    ## Job Description
 *    Brief Overview: ...
 *
 *    ## Responsibilities
 *    - ...
 *
 *    ## Required Skills
 *    - ...
 *
 *    ## Preferred Skills
 *    - ...
 *
 *    ## Eligibility
 *    Education: ...
 *    Graduation Year: ...
 *    Other Requirements: ...
 *
 *    ## Compensation
 *    Salary / Stipend: ...
 *    Compensation Details: ...
 *
 *    ## Application Details
 *    Application Deadline: ...
 *    Application Link: ...
 *    Contact Email: ...
 *
 *    ## Additional Information
 *    Benefits: ...
 *    Additional Notes: ...
 *
 * 2. Frontmatter-based format:
 *    ---
 *    key: value
 *    ---
 *    # Title
 *    ## Description
 *    ...
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
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

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
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `##\\s+${escapedHeading}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n##\\s+|$)`,
    "i"
  );
  const match = content.match(regex);
  return match ? match[1].trim() : "";
};

const extractList = (content, heading) => {
  const section = extractSection(content, heading);
  if (!section) return [];

  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("*"))
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
};

const extractKeyValue = (sectionContent, keyPattern) => {
  if (!sectionContent) return "";
  const lines = sectionContent.split(/\r?\n/);
  for (const line of lines) {
    const sep = line.indexOf(":");
    if (sep !== -1) {
      const k = line.slice(0, sep).trim().toLowerCase();
      const v = line.slice(sep + 1).trim();
      if (k === keyPattern.toLowerCase() || k.startsWith(keyPattern.toLowerCase())) {
        return v;
      }
    }
  }
  return "";
};

/**
 * Universal parser for Job Markdown or plain text
 */
export const parseJobMarkdownContent = (rawText) => {
  if (!rawText || !rawText.trim()) {
    throw new Error("Job content is empty");
  }

  const content = rawText.trim();
  const { metadata, content: markdownContent } = parseFrontmatter(content);

  // Extract Sections
  const basicInfoSection = extractSection(markdownContent, "Basic Information");
  const descriptionSection = extractSection(markdownContent, "Job Description") || extractSection(markdownContent, "Description");
  const eligibilitySection = extractSection(markdownContent, "Eligibility");
  const compensationSection = extractSection(markdownContent, "Compensation");
  const applicationSection = extractSection(markdownContent, "Application Details") || extractSection(markdownContent, "Application");
  const additionalSection = extractSection(markdownContent, "Additional Information");

  // Title extraction: Check Basic Information, then # Title
  let title = extractKeyValue(basicInfoSection, "Job Title") || metadata.title || "";
  if (!title) {
    const titleMatch = markdownContent.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1].trim().toLowerCase() !== "job posting") {
      title = titleMatch[1].trim();
    }
  }

  // Company Name
  const companyName = extractKeyValue(basicInfoSection, "Company Name") || metadata.companyName || metadata.company || "";

  // Role Category
  const roleCategory = extractKeyValue(basicInfoSection, "Role Category") || metadata.roleCategory || metadata.role || "";

  // Work Mode & Location
  let workMode = extractKeyValue(basicInfoSection, "Work Mode") || metadata.workMode || "";
  // Normalize work mode: e.g. "Hybrid", "Remote", "On-site"
  if (workMode.toLowerCase().includes("remote")) workMode = "Remote";
  else if (workMode.toLowerCase().includes("hybrid")) workMode = "Hybrid";
  else if (workMode.toLowerCase().includes("site") || workMode.toLowerCase().includes("office")) workMode = "On-site";

  const location = extractKeyValue(basicInfoSection, "Location") || metadata.location || "";

  // Employment Type / Job Type
  let jobType = extractKeyValue(basicInfoSection, "Employment Type") || extractKeyValue(basicInfoSection, "Job Type") || metadata.jobType || "";
  if (jobType.toLowerCase().includes("full")) jobType = "Full Time";
  else if (jobType.toLowerCase().includes("part")) jobType = "Part Time";
  else if (jobType.toLowerCase().includes("intern")) jobType = "Internship";
  else if (jobType.toLowerCase().includes("contract")) jobType = "Contract";

  // Experience
  const experience = extractKeyValue(basicInfoSection, "Experience Level") || extractKeyValue(basicInfoSection, "Experience") || metadata.experience || "";

  // Description
  let description = "";
  if (descriptionSection) {
    const overview = extractKeyValue(descriptionSection, "Brief Overview");
    description = overview || descriptionSection;
  }
  if (!description && metadata.description) {
    description = metadata.description;
  }

  // Lists: Responsibilities, Skills, Requirements, Benefits
  const responsibilities = extractList(markdownContent, "Responsibilities");
  let skills = extractList(markdownContent, "Required Skills");
  if (skills.length === 0) {
    skills = extractList(markdownContent, "Skills");
  }
  const preferredSkills = extractList(markdownContent, "Preferred Skills");
  // Combine skills if needed or keep preferred skills intact
  const requirements = extractList(markdownContent, "Requirements");
  if (requirements.length === 0 && preferredSkills.length > 0) {
    requirements.push(...preferredSkills);
  }

  const eligibleBranches = extractList(markdownContent, "Eligible Branches");

  let benefits = extractList(markdownContent, "Benefits");
  if (benefits.length === 0 && additionalSection) {
    const ben = extractKeyValue(additionalSection, "Benefits");
    if (ben) benefits = [ben];
  }

  // Eligibility
  const education = extractKeyValue(eligibilitySection, "Education") || metadata.education || "";
  const graduationYear = extractKeyValue(eligibilitySection, "Graduation Year") || metadata.graduationYear || "";
  const eligibility = extractKeyValue(eligibilitySection, "Other Requirements") || metadata.eligibility || "";

  // Compensation
  const salary = extractKeyValue(compensationSection, "Salary / Stipend") || extractKeyValue(compensationSection, "Salary") || metadata.salary || "";

  // Application
  let applicationUrl = extractKeyValue(applicationSection, "Application Link") || extractKeyValue(applicationSection, "Application URL") || metadata.applicationUrl || "";
  let applicationDeadline = extractKeyValue(applicationSection, "Application Deadline") || metadata.applicationDeadline || null;
  if (applicationDeadline) {
    const parsedDate = new Date(applicationDeadline);
    if (!isNaN(parsedDate.getTime())) {
      applicationDeadline = parsedDate.toISOString().split("T")[0];
    }
  }

  const companyType = metadata.companyType || "";

  return {
    title: title.trim(),
    companyName: companyName.trim(),
    roleCategory: roleCategory.trim(),
    description: description.trim(),
    companyType: companyType.trim(),
    jobType: jobType.trim(),
    workMode: workMode.trim(),
    location: location.trim(),
    experience: experience.trim(),
    salary: salary.trim(),
    education: education.trim(),
    graduationYear: String(graduationYear).trim(),
    eligibility: eligibility.trim(),
    applicationUrl: applicationUrl.trim(),
    applicationDeadline,
    skills,
    preferredSkills,
    eligibleBranches,
    responsibilities,
    requirements,
    benefits,
    rawContent: content,
  };
};

export const parseJobMarkdownFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const jobData = parseJobMarkdownContent(content);
    return {
      success: true,
      type: "job",
      filePath,
      data: {
        ...jobData,
        filePath,
      },
    };
  } catch (error) {
    console.error(`Error parsing job Markdown file ${filePath}:`, error);
    return {
      success: false,
      error: error.message,
      filePath,
    };
  }
};

export const parseJobMarkdown = (filePath) => {
  const res = parseJobMarkdownFile(filePath);
  if (!res.success) {
    throw new Error(res.error);
  }
  return res.data;
};

export default {
  parseJobMarkdown,
  parseJobMarkdownFile,
  parseJobMarkdownContent,
};