export const adminStats = {
  kpis: [
    { title: "Total Colleges", value: "5", subtitle: "4 active" },
    { title: "Active Batches", value: "5", subtitle: "7 total" },
    { title: "Total Students", value: "12", subtitle: "10 active" },
    { title: "Tests Conducted", value: "253", subtitle: "All time" },
    { title: "Avg Score", value: "86%", subtitle: "Across all tracks" },
    { title: "Active Tracks", value: "5", subtitle: "10 questions" }
  ],
  collegeRanking: [
    { name: "Harvard University", score: 96 },
    { name: "MIT", score: 94 },
    { name: "IIT Delhi", score: 88 },
    { name: "Stanford University", score: 85 }
  ],
  topStudents: [
    { rank: 1, name: "Kevin Zhang", college: "Harvard University", track: "Machine Learning", score: "96%" },
    { rank: 2, name: "Mike Chen", college: "MIT", track: "Web Development", score: "95%" },
    { rank: 3, name: "Rachel Green", college: "Stanford University", track: "Python Programming", score: "94%" },
    { rank: 4, name: "Alex Johnson", college: "MIT", track: "Data Structures & Algorithms", score: "92%" },
    { rank: 5, name: "David Kim", college: "IIT Delhi", track: "Database Management", score: "91%" }
  ],
  recentActivity: [
    { name: "Alex Johnson", batch: "CS-2024A", streak: 15, date: "2025-02-11" },
    { name: "Sarah Williams", batch: "DS-2024A", streak: 12, date: "2025-02-11" },
    { name: "Lisa Anderson", batch: "CS-2024A", streak: 10, date: "2025-02-11" },
    { name: "Rachel Green", batch: "DS-2024A", streak: 20, date: "2025-02-11" },
    { name: "Priya Patel", batch: "DSA-2024C", streak: 14, date: "2025-02-11" }
  ],
  mostSolved: [
    { title: "Maximum Subarray Sum", track: "Data Structures & Algorithms", difficulty: "Easy", count: "1,560" },
    { title: "Two Sum", track: "Data Structures & Algorithms", difficulty: "Easy", count: "1,245" },
    { title: "SQL Join Operations", track: "Database Management", difficulty: "Easy", count: "1,100" },
    { title: "Reverse Linked List", track: "Data Structures & Algorithms", difficulty: "Medium", count: "890" },
    { title: "Binary Tree Level Order Traversal", track: "Data Structures & Algorithms", difficulty: "Medium", count: "780" }
  ],
  batches: [
    { id: "CS-2024A", status: "Active", college: "MIT", track: "Data Structures & Algorithms", start: "2024-06-01", end: "2024-12-01" },
    { id: "CS-2024B", status: "Active", college: "MIT", track: "Web Development", start: "2024-07-15", end: "2025-01-15" },
    { id: "DS-2024A", status: "Active", college: "Stanford University", track: "Python Programming", start: "2024-06-15", end: "2024-12-15" },
    { id: "WD-2024A", status: "Active", college: "IIT Delhi", track: "Web Development", start: "2024-08-01", end: "2025-02-01" },
    { id: "WD-2024B", status: "Upcoming", college: "IIT Delhi", track: "Database Management", start: "2024-09-01", end: "2025-03-01" }
  ]
};