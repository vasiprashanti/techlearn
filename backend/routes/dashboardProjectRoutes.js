import express from 'express';
import Mini from '../models/miniProject.js';
import Mid from '../models/MidProject.js';
import Major from '../models/majorProject.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard/projects', protect, async (req, res) => {
  try {
    const [mini, mid, major] = await Promise.all([
      Mini.find(),
      Mid.find(),
      Major.find(),
    ]);

    res.json({
      miniProjects: mini,
      midProjects: mid,
      majorProjects: major,
    });
  } catch (err) {
    console.error('Error fetching dashboard projects:', err);
    res.status(500).json({ message: 'Error loading project data' });
  }
});

export default router;
