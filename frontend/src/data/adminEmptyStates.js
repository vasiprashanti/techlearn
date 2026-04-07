export const emptyDashboardOverview = {
  kpis: [],
  collegeRanking: [],
  topStudents: [],
  recentActivity: [],
  mostSolved: [],
  batches: [],
};

export const emptyAnalyticsState = {
  platformOverview: [],
  studentEngagement: {
    dailyActive: 0,
    totalStudents: 0,
    weeklyActive: 0,
    inactive: 0,
    avgStreak: 0,
  },
  learningPerformance: {
    avgScore: 0,
    submissionSuccess: 0,
    avgSolveTime: 0,
  },
  batchPerformance: {
    active: 0,
    upcoming: 0,
    completed: 0,
    topBatches: [],
  },
  contentInsights: {
    totalQuestions: 0,
    usedInTracks: 0,
    unusedQuestions: 0,
    avgTrackLength: 0,
    difficulty: [],
    trackTemplates: 0,
  },
  platformHealth: {
    engagementRate: 0,
    activeStudents: 0,
    totalStudents: 0,
    resourcesUploaded: 0,
    resourcesViewed: 0,
  },
};

export const emptySystemHealthState = {
  kpis: [],
  services: [],
  recentAlerts: [],
};

export const emptyNotifications = [];
export const emptyColleges = [];
export const emptyBatches = [];
export const emptyStudents = [];
export const emptyResources = [];
export const emptyQuestionCategories = [];
export const emptyTrackTemplates = [];

export const emptyCertificatesState = {
  issuedCertificates: [],
  finalTests: [],
  templates: [],
};

export const emptySubmissionState = {
  submissions: [],
  kpis: {
    totalToday: 0,
    accepted: 0,
    successRate: 0,
    avgExecutionTime: "0ms",
  },
};

export const emptyAuditSummary = {
  totalActions: 0,
  today: 0,
  deletions: 0,
};

export const emptyAuditLogs = [];

export const emptyReportsState = {
  reportTypes: [],
  recentExports: [],
};
