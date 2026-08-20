import mongoose from "mongoose";
import Job from "../models/Job.js";

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
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
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
     * User profile values.
     */
    const degreeBranch = user.degreeBranch?.trim() || "";
    const graduationYear = user.graduationYear
      ? String(user.graduationYear)
      : "";

    /*
     * If the user has no recommendation information,
     * do NOT return every published job.
     */
    if (!degreeBranch && !graduationYear) {
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
        },
        message:
          "Complete your profile to get personalized job recommendations",
      });
    }

    /*
     * Base filter.
     */
    const filter = {
      status: "Published",
    };

    /*
     * --------------------------------------------------------
     * BRANCH MATCHING
     * --------------------------------------------------------
     *
     * Example:
     *
     * User:
     * degreeBranch = "AI/ML"
     *
     * Job:
     * eligibleBranches = ["AI/ML", "CSE"]
     */
    if (degreeBranch) {
      filter.eligibleBranches = {
        $regex: `^${escapeRegex(degreeBranch)}$`,
        $options: "i",
      };
    }

    /*
     * --------------------------------------------------------
     * GRADUATION YEAR MATCHING
     * --------------------------------------------------------
     */
    if (graduationYear) {
      filter.graduationYear = graduationYear;
    }

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
     * FETCH + COUNT TOGETHER
     * --------------------------------------------------------
     */
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .select(jobListFields)
        .sort({
          publishedAt: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(itemsPerPage)
        .lean(),

      Job.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / itemsPerPage) || 1;

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
      recommendationCriteria: {
        degreeBranch: degreeBranch || null,
        graduationYear: graduationYear
          ? Number(graduationYear)
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching recommended jobs:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch recommended jobs",
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