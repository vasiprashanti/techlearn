import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import Batch from '../models/Batch.js';
import User from '../models/User.js';

const batchRoutes = express.Router();

// GET all batches (with optional status / college / search filter)
batchRoutes.get('/', protect, isAdmin, async (req, res) => {
  try {
    const { status, college, search } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.status = status;
    if (college && college !== 'All') filter.college = college;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const batches = await Batch.find(filter)
      .populate('students', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET single batch with populated students
batchRoutes.get('/:id', protect, isAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('students', 'firstName lastName email avatar');
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json(batch);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST create new batch
batchRoutes.post('/', protect, isAdmin, async (req, res) => {
  try {
    const { batchName, college, track, startDate, endDate, description } = req.body;

    if (!batchName || !college || !track || !startDate) {
      return res.status(400).json({ message: 'Missing required fields: batchName, college, track, startDate' });
    }

    const batch = await Batch.create({
      name: batchName,
      college,
      track,
      description: description || '',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      status: 'Active',
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Batch created successfully', batch });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT update batch
batchRoutes.put('/:id', protect, isAdmin, async (req, res) => {
  try {
    const { batchName, college, track, startDate, endDate, status, description } = req.body;
    const update = { name: batchName, college, track, startDate, status };
    if (endDate !== undefined) update.endDate = endDate ? new Date(endDate) : null;
    if (description !== undefined) update.description = description;
    const batch = await Batch.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ message: 'Batch updated successfully', batch });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST add student to batch
batchRoutes.post('/:id/students', protect, isAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found with that email' });

    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    if (batch.students.includes(user._id)) {
      return res.status(400).json({ message: 'Student already in this batch' });
    }
    batch.students.push(user._id);
    await batch.save();

    const updatedBatch = await Batch.findById(req.params.id).populate('students', 'firstName lastName email avatar');
    res.json({ message: 'Student added successfully', batch: updatedBatch });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE remove student from batch
batchRoutes.delete('/:id/students/:userId', protect, isAdmin, async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    batch.students = batch.students.filter(s => s.toString() !== req.params.userId);
    await batch.save();
    res.json({ message: 'Student removed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE batch
batchRoutes.delete('/:id', protect, isAdmin, async (req, res) => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });
    res.json({ message: 'Batch deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default batchRoutes;
