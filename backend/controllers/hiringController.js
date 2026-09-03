import mongoose from "mongoose";
import Job from "../models/Job.js";
import User from "../models/User.js";
/*
 * Escape special regex characters.
 * This prevents user input from being treated as regex syntax.
 */
const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/*
 * Create a case-insensitive regex.
 */
const createRegex = (value = "") => {
  return new RegExp(escapeRegex(value.trim()), "i");
};

/*
 * Parse pagination safely.
 */
const getPagination = (page, limit) => {
  const currentPage = Math.max(parseInt(page, 10) || 1, 1);

  const itemsPerPage = Math.min(
    Math.max(parseInt(limit, 10) || 10, 1),
    50
  );

  return {
    currentPage,
    itemsPerPage,
    skip: (currentPage - 1) * itemsPerPage,
  };
};

/*
 * Fields returned in the User-side job listing.
 */
const jobListFields = [
  "JID",
  "roleId",
  "companyName",
  "companyLogo",
  "title",
  "companyType",
  "jobType",
  "workMode",
  "location",
  "experience",
  "salary",
  "skills",
  "education",
  "eligibleBranches",
  "graduationYear",
  "eligibility",
  "description",
  "responsibilities",
  "requirements",
  "benefits",
  "applicationUrl",
  "applicationDeadline",
  "publishedAt",
  "createdAt",
].join(" ");

/*
 * ============================================================
 * GET /api/jobs
 * ============================================================
 *
 * User-side Hiring page.
 *
 * Supported query parameters:
 *
 * search
 * category       -> jobs | internships | freelance
 * jobType        -> exact job type
 * location
 * experience
 * workMode
 * sort           -> newest | oldest | deadline
 * page
 * limit
 */
export const listActiveJobs = async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      jobType = "",
      location = "",
      experience = "",
      workMode = "",
      sort = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    /*
     * Category and exact jobType should not be used together.
     */
    if (category.trim() && jobType.trim()) {
      return res.status(400).json({
        success: false,
        message: "Use either category or jobType, not both",
      });
    }

    const { currentPage, itemsPerPage, skip } = getPagination(
      page,
      limit
    );

    /*
     * Only Published jobs are visible to users.
     */
    const filter = {
      status: "Published",
      $and: [{
        $or: [
          { applicationDeadline: null },
          { applicationDeadline: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        ],
      }],
    };

    /*
     * --------------------------------------------------------
     * SEARCH
     * --------------------------------------------------------
     *
     * Search in:
     * - title
     * - company name
     * - skills
     * - location
     */
    if (search.trim()) {
      const searchRegex = createRegex(search);

      filter.$or = [
        { title: searchRegex },
        { companyName: searchRegex },
        { skills: searchRegex },
        { location: searchRegex },
      ];
    }

    /*
     * --------------------------------------------------------
     * CATEGORY
     * --------------------------------------------------------
     *
     * Jobs
     * Internships
     * Freelance
     */
    if (category.trim()) {
      const normalizedCategory = category.trim().toLowerCase();

      if (normalizedCategory === "internships") {
        filter.jobType = /^internship$/i;
      } else if (normalizedCategory === "freelance") {
        filter.jobType = /^freelance$/i;
      } else if (normalizedCategory === "jobs") {
        /*
         * Jobs = everything except Internship and Freelance.
         */
        filter.jobType = {
          $not: /^(internship|freelance)$/i,
        };
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Invalid category. Allowed values: jobs, internships, freelance",
        });
      }
    }

    /*
     * --------------------------------------------------------
     * EXACT JOB TYPE
     * --------------------------------------------------------
     */
    if (jobType.trim()) {
      filter.jobType = new RegExp(
        `^${escapeRegex(jobType.trim())}$`,
        "i"
      );
    }

    /*
     * --------------------------------------------------------
     * LOCATION
     * --------------------------------------------------------
     */
    if (location.trim()) {
      filter.location = createRegex(location);
    }

    /*
     * --------------------------------------------------------
     * EXPERIENCE
     * --------------------------------------------------------
     */
    if (experience.trim()) {
      filter.experience = createRegex(experience);
    }

    /*
     * --------------------------------------------------------
     * WORK MODE
     * --------------------------------------------------------
     */
    if (workMode.trim()) {
      filter.workMode = createRegex(workMode);
    }

    /*
     * --------------------------------------------------------
     * SORTING
     * --------------------------------------------------------
     *
     * newest
     * oldest
     * deadline
     */
    let sortOption;

    if (sort === "newest") {
      sortOption = {
        createdAt: -1,
      };
    } else if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    } else if (sort === "deadline") {
      sortOption = {
        applicationDeadline: 1,
        createdAt: -1,
      };
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Invalid sort option. Allowed values: newest, oldest, deadline",
      });
    }

    /*
     * --------------------------------------------------------
     * COUNT
     * --------------------------------------------------------
     */
    const total = await Job.countDocuments(filter);

    /*
     * --------------------------------------------------------
     * FETCH JOBS
     * --------------------------------------------------------
     */
    const jobs = await Job.find(filter)
      .select(jobListFields)
      .sort(sortOption)
      .skip(skip)
      .limit(itemsPerPage)
      .lean();

    const totalPages = Math.ceil(total / itemsPerPage);

    return res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: currentPage,
        limit: itemsPerPage,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching active jobs:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch jobs",
    });
  }
};


/*
 * ============================================================
 * GET /api/jobs/:jobId
 * ============================================================
 *
 * Get complete details of one Published job.
 */
export const getActiveJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    /*
     * Validate MongoDB ObjectId.
     */
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    /*
     * Only Published jobs can be viewed by users.
     */
    const job = await Job.findOne({
      _id: jobId,
      status: "Published",
    })
      .select(jobListFields)
      .populate("roleId", "roleName")
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error fetching active job:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job",
    });
  }
};


/*
 * ============================================================
 * GET /api/jobs/for-you
 * ============================================================
 *
 * Personalized jobs for the logged-in user.
 *
 * Matching:
 * - degreeBranch
 * - graduationYear
 *
 * Optional filters:
 * - search
 * - jobType
 * - location
 * - experience
 * - workMode
 * - page
 * - limit
 */
export const listRecommendedJobs = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    /*
     * Fetch the latest User document so recommendation
     * preferences are always up to date.
     */
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    const {
      search = "",
      jobType = "",
      location = "",
      experience = "",
      workMode = "",
      page = 1,
      limit = 10,
    } = req.query;

    const { currentPage, itemsPerPage, skip } = getPagination(
      page,
      limit
    );

    /*
     * --------------------------------------------------------
     * USER PROFILE VALUES
     * --------------------------------------------------------
     */

    const degreeBranch =
      user.degreeBranch?.trim() || "";

    const graduationYear = user.graduationYear
      ? String(user.graduationYear)
      : "";

    const targetRole =
      user.targetRole?.trim() || "";

    const otherTargetRole =
      user.otherTargetRole?.trim() || "";

    const targetCompanies = Array.isArray(
      user.targetCompanies
    )
      ? user.targetCompanies
          .map((company) => String(company).trim())
          .filter(Boolean)
      : [];

    const studentSkills = Array.isArray(user.skills)
      ? user.skills
          .map((skill) => String(skill).trim())
          .filter(Boolean)
      : [];

    /*
     * If the user has no recommendation information,
     * do not return every published job.
     */
    if (
      !degreeBranch &&
      !graduationYear &&
      !targetRole &&
      !otherTargetRole &&
      targetCompanies.length === 0 &&
      studentSkills.length === 0
    ) {
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page: currentPage,
          limit: itemsPerPage,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        recommendationCriteria: {
          degreeBranch: null,
          graduationYear: null,
          targetRole: null,
          otherTargetRole: null,
          targetCompanies: [],
          skills: [],
        },
        message:
          "Complete your profile to get personalized job recommendations",
      });
    }

    /*
     * --------------------------------------------------------
     * BASE FILTER
     * --------------------------------------------------------
     */

    const filter = {
      status: "Published",
    };

    /*
     * --------------------------------------------------------
     * SEARCH
     * --------------------------------------------------------
     */

    if (search.trim()) {
      const searchRegex = createRegex(search);

      filter.$or = [
        { title: searchRegex },
        { companyName: searchRegex },
        { skills: searchRegex },
        { location: searchRegex },
      ];
    }

    /*
     * --------------------------------------------------------
     * JOB TYPE
     * --------------------------------------------------------
     */

    if (jobType.trim()) {
      filter.jobType = new RegExp(
        `^${escapeRegex(jobType.trim())}$`,
        "i"
      );
    }

    /*
     * --------------------------------------------------------
     * LOCATION
     * --------------------------------------------------------
     */

    if (location.trim()) {
      filter.location = createRegex(location);
    }

    /*
     * --------------------------------------------------------
     * EXPERIENCE
     * --------------------------------------------------------
     */

    if (experience.trim()) {
      filter.experience = createRegex(experience);
    }

    /*
     * --------------------------------------------------------
     * WORK MODE
     * --------------------------------------------------------
     */

    if (workMode.trim()) {
      filter.workMode = createRegex(workMode);
    }

    /*
     * --------------------------------------------------------
     * FETCH ELIGIBLE JOBS
     * --------------------------------------------------------
     *
     * We fetch all published jobs first because personalization & ranking
     * happens in memory across all profile dimensions.
     */

    const jobs = await Job.find(filter)
      .select(`${jobListFields} roleId eligibleBranches graduationYear`)
      .populate("roleId", "roleName")
      .lean();

    /*
     * --------------------------------------------------------
     * PERSONALIZATION SCORING
     * --------------------------------------------------------
     *
     * Target Role       = +6
     * Target Company    = +5
     * Matching Branch   = +4 (or +2 if job is open to Any Branch)
     * Matching Grad Year= +4 (or +2 if job is open to Any Year)
     * Matching Skill    = +2 each (up to +10)
     */

    const normalizedDegreeBranch =
      degreeBranch.toLowerCase();

    const normalizedGraduationYear =
      graduationYear.toLowerCase();

    const normalizedTargetRole =
      targetRole.toLowerCase();

    const normalizedOtherTargetRole =
      otherTargetRole.toLowerCase();

    const normalizedTargetCompanies =
      targetCompanies.map((company) =>
        company.toLowerCase()
      );

    const normalizedStudentSkills =
      studentSkills.map((skill) =>
        skill.toLowerCase()
      );

    const scoredJobs = jobs.map((job) => {
      let recommendationScore = 0;

      const jobTitle =
        String(job.title || "").toLowerCase();

      const roleName =
        String(
          job.roleId?.roleName || ""
        ).toLowerCase();

      const companyName =
        String(
          job.companyName || ""
        ).toLowerCase();

      const jobSkills = Array.isArray(job.skills)
        ? job.skills.map((skill) =>
            String(skill).toLowerCase()
          )
        : [];

      const jobBranches = Array.isArray(job.eligibleBranches)
        ? job.eligibleBranches.map((b) =>
            String(b).toLowerCase()
          )
        : [];

      const jobGradYear =
        String(job.graduationYear || "").toLowerCase();

      /*
       * 1. Target Role Match (+6)
       */
      if (
        normalizedTargetRole &&
        (
          jobTitle.includes(normalizedTargetRole) ||
          roleName.includes(normalizedTargetRole) ||
          normalizedTargetRole.includes(jobTitle) ||
          normalizedTargetRole.includes(roleName)
        )
      ) {
        recommendationScore += 6;
      }

      if (
        normalizedOtherTargetRole &&
        (
          jobTitle.includes(normalizedOtherTargetRole) ||
          roleName.includes(normalizedOtherTargetRole)
        )
      ) {
        recommendationScore += 5;
      }

      /*
       * 2. Target Company Match (+5)
       */
      if (
        normalizedTargetCompanies.some(
          (company) =>
            companyName === company ||
            companyName.includes(company) ||
            company.includes(companyName)
        )
      ) {
        recommendationScore += 5;
      }

      /*
       * 3. Degree / Branch Match (+4 for exact match, +2 if open/any)
       */
      if (normalizedDegreeBranch) {
        const isBranchMatch = jobBranches.some(
          (b) =>
            b.includes(normalizedDegreeBranch) ||
            normalizedDegreeBranch.includes(b) ||
            (normalizedDegreeBranch.includes("computer") && (b.includes("cs") || b.includes("it") || b.includes("software")))
        );

        if (isBranchMatch) {
          recommendationScore += 4;
        } else if (jobBranches.length === 0 || jobBranches.some((b) => b.includes("any") || b.includes("all"))) {
          recommendationScore += 2;
        }
      }

      /*
       * 4. Graduation Year Match (+4 for exact match, +2 if open/any)
       */
      if (normalizedGraduationYear) {
        if (jobGradYear && jobGradYear.includes(normalizedGraduationYear)) {
          recommendationScore += 4;
        } else if (!jobGradYear || jobGradYear.includes("any") || jobGradYear.includes("all")) {
          recommendationScore += 2;
        }
      }

      /*
       * 5. Skills Match (+2 per matching skill, max 10)
       */
      const matchingSkills =
        normalizedStudentSkills.filter(
          (studentSkill) =>
            jobSkills.some(
              (jobSkill) =>
                jobSkill === studentSkill ||
                jobSkill.includes(studentSkill) ||
                studentSkill.includes(jobSkill)
            )
        );

      recommendationScore += Math.min(
        matchingSkills.length * 2,
        10
      );

      return {
        ...job,
        recommendationScore,
      };
    });

    /*
     * --------------------------------------------------------
     * RELEVANCE THRESHOLD
     * --------------------------------------------------------
     *
     * Only return jobs that are genuinely relevant.
     * The minimum threshold must be at least one real
     * signal match beyond the open branch/year bonuses.
     *
     * Open branch alone = +2
     * Open grad year alone = +2
     * Total from "open" fallbacks alone = 4
     *
     * So threshold = 5 means the job MUST match at least
     * one of: target role (+6), target company (+5),
     * exact branch (+4), exact year (+4), or a skill (+2).
     * A job with only open-branch + open-year bonuses (4) is excluded.
     */
    const MIN_RELEVANCE_SCORE = 5;

    const relevantJobs = scoredJobs.filter(
      (j) => j.recommendationScore >= MIN_RELEVANCE_SCORE
    );

    /*
     * --------------------------------------------------------
     * SORT BY PERSONALIZATION
     * --------------------------------------------------------
     *
     * Highest recommendation score first.
     * If scores are equal, newest jobs first.
     */

    relevantJobs.sort((a, b) => {
      if (
        b.recommendationScore !==
        a.recommendationScore
      ) {
        return (
          b.recommendationScore -
          a.recommendationScore
        );
      }

      return (
        new Date(
          b.publishedAt || b.createdAt
        ) -
        new Date(
          a.publishedAt || a.createdAt
        )
      );
    });

    /*
     * --------------------------------------------------------
     * PAGINATION
     * --------------------------------------------------------
     */

    const total = relevantJobs.length;

    const paginatedJobs = relevantJobs.slice(
      skip,
      skip + itemsPerPage
    );

    const totalPages =
      Math.ceil(total / itemsPerPage) || 1;

    return res.status(200).json({
      success: true,
      data: paginatedJobs,
      pagination: {
        page: currentPage,
        limit: itemsPerPage,
        total,
        totalPages,
        hasNextPage:
          currentPage < totalPages,
        hasPreviousPage:
          currentPage > 1,
      },
      recommendationCriteria: {
        degreeBranch:
          degreeBranch || null,

        graduationYear:
          graduationYear
            ? Number(graduationYear)
            : null,

        targetRole:
          targetRole || null,

        otherTargetRole:
          otherTargetRole || null,

        targetCompanies,

        skills: studentSkills,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching recommended jobs:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch recommended jobs",
    });
  }
};

/*
 * ============================================================
 * GET /api/jobs/filters
 * ============================================================
 *
 * Returns available filter values from Published jobs.
 */
export const getJobFilters = async (req, res) => {
  try {
    const jobs = await Job.find({
      status: "Published",
      $or: [
        { applicationDeadline: null },
        { applicationDeadline: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      ],
    })
      .select(
        "location experience workMode jobType companyType"
      )
      .lean();

    const uniqueValues = (values) => {
      return [
        ...new Set(
          values
            .filter(
              (value) =>
                typeof value === "string" && value.trim()
            )
            .map((value) => value.trim())
        ),
      ].sort((a, b) => a.localeCompare(b));
    };

    const filters = {
      location: uniqueValues(
        jobs.map((job) => job.location)
      ),

      experience: uniqueValues(
        jobs.map((job) => job.experience)
      ),

      workMode: uniqueValues(
        jobs.map((job) => job.workMode)
      ),

      jobType: uniqueValues(
        jobs.map((job) => job.jobType)
      ),

      companyType: uniqueValues(
        jobs.map((job) => job.companyType)
      ),
    };

    return res.status(200).json({
      success: true,
      data: filters,
    });
  } catch (error) {
    console.error("Error fetching job filters:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch job filters",
    });
  }
};


/*
 * ============================================================
 * GET /api/jobs/calendar
 * ============================================================
 *
 * Returns Published jobs having application deadlines
 * for a particular month.
 *
 * Example:
 * GET /api/jobs/calendar?month=2026-08
 */
export const getHiringCalendar = async (req, res) => {
  try {
    const { month } = req.query;

    let startDate;
    let endDate;
    let requestedMonth;

    /*
     * --------------------------------------------------------
     * MONTH PROVIDED
     * --------------------------------------------------------
     */
    if (month) {
      const monthMatch = /^(\d{4})-(\d{2})$/.exec(
        month
      );

      if (!monthMatch) {
        return res.status(400).json({
          success: false,
          message: "Month must be in YYYY-MM format",
        });
      }

      const year = Number(monthMatch[1]);
      const monthNumber = Number(monthMatch[2]);

      if (monthNumber < 1 || monthNumber > 12) {
        return res.status(400).json({
          success: false,
          message: "Invalid month",
        });
      }

      requestedMonth = `${year}-${String(
        monthNumber
      ).padStart(2, "0")}`;

      startDate = new Date(
        Date.UTC(year, monthNumber - 1, 1)
      );

      endDate = new Date(
        Date.UTC(year, monthNumber, 1)
      );
    } else {
      /*
       * ------------------------------------------------------
       * CURRENT MONTH
       * ------------------------------------------------------
       */
      const now = new Date();

      const year = now.getUTCFullYear();
      const monthNumber = now.getUTCMonth() + 1;

      requestedMonth = `${year}-${String(
        monthNumber
      ).padStart(2, "0")}`;

      startDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          1
        )
      );

      endDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth() + 1,
          1
        )
      );
    }

    /*
     * --------------------------------------------------------
     * FETCH JOBS
     * --------------------------------------------------------
     */
    const jobs = await Job.find({
      status: "Published",
      applicationDeadline: {
        $gte: startDate,
        $lt: endDate,
      },
    })
      .select(
        [
          "JID",
          "companyName",
          "companyLogo",
          "title",
          "jobType",
          "workMode",
          "location",
          "experience",
          "salary",
          "applicationUrl",
          "applicationDeadline",
        ].join(" ")
      )
      .sort({
        applicationDeadline: 1,
      })
      .lean();

    /*
     * --------------------------------------------------------
     * GROUP BY DATE
     * --------------------------------------------------------
     *
     * Example:
     *
     * {
     *   "2026-08-20": [job1, job2],
     *   "2026-08-30": [job3]
     * }
     */
    const calendar = {};

    for (const job of jobs) {
      if (!job.applicationDeadline) {
        continue;
      }

      const dateKey = new Date(
        job.applicationDeadline
      )
        .toISOString()
        .split("T")[0];

      if (!calendar[dateKey]) {
        calendar[dateKey] = [];
      }

      calendar[dateKey].push(job);
    }

    return res.status(200).json({
      success: true,
      month: requestedMonth,
      total: jobs.length,
      data: calendar,
    });
  } catch (error) {
    console.error(
      "Error fetching hiring calendar:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch hiring calendar",
    });
  }
};


/*
 * ============================================================
 * GET /api/jobs/:jobId/apply
 * ============================================================
 *
 * Returns application URL for a Published job.
 */
export const getJobApplicationUrl = async (req, res) => {
  try {
    const { jobId } = req.params;

    /*
     * Validate ObjectId.
     */
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid job ID format",
      });
    }

    /*
     * Only Published jobs can be applied to.
     */
    const job = await Job.findOne({
      _id: jobId,
      status: "Published",
    })
      .select(
        "applicationUrl applicationDeadline"
      )
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    /*
     * Check deadline only when one exists.
     */
    if (
      job.applicationDeadline &&
      new Date(job.applicationDeadline) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Application deadline has passed",
      });
    }

    /*
     * Application URL is required for applying.
     */
    if (!job.applicationUrl) {
      return res.status(404).json({
        success: false,
        message: "Application URL is not available",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        applicationUrl: job.applicationUrl,
        applicationDeadline:
          job.applicationDeadline,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching job application URL:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch application URL",
    });
  }
};
/**
 * GET /api/jobs/categories
 *
 * Get role categories that have at least one Published job.
 */
export const getJobCategories = async (req, res) => {
  try {
    const categories = await Job.aggregate([
      // Only consider Published jobs
      {
        $match: {
          status: "Published",
          roleId: { $ne: null },
        },
      },

      // Group jobs by role
      {
        $group: {
          _id: "$roleId",
          publishedJobCount: {
            $sum: 1,
          },
        },
      },

      // Get role information
      {
        $lookup: {
          from: "roles",
          localField: "_id",
          foreignField: "_id",
          as: "role",
        },
      },

      // Convert role array into object
      {
        $unwind: "$role",
      },

      // Return the required response fields
      {
        $project: {
          _id: "$role._id",
          roleName: "$role.roleName",
          publishedJobCount: 1,
        },
      },

      // Sort alphabetically
      {
        $sort: {
          roleName: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching job categories:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch job categories",
    });
  }
};
