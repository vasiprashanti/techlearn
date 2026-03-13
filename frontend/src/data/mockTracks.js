export const getInitialTrackState = () => ({
  id: "trk_dsa_01",
  name: "DSA Mastery Track",
  description: "30-day Data Structures & Algorithms curriculum for technical rounds.",
  totalDays: 30,
  questions: [
    { day: 1, id: "q_001", title: "Two Sum", category: "Arrays & Hashing", difficulty: "Easy", status: "active", score: null, attempts: 0 },
    { day: 2, id: "q_002", title: "Reverse Linked List", category: "Linked Lists", difficulty: "Medium", status: "locked", score: null, attempts: 0 },
    { day: 3, id: "q_003", title: "Binary Tree Level Order Traversal", category: "Trees", difficulty: "Medium", status: "locked", score: null, attempts: 0 },
    { day: 4, id: "q_004", title: "Maximum Subarray Sum", category: "Dynamic Programming", difficulty: "Medium", status: "locked", score: null, attempts: 0 },
    { day: 5, id: "q_005", title: "Merge K Sorted Lists", category: "Linked Lists", difficulty: "Hard", status: "locked", score: null, attempts: 0 }
  ]
});