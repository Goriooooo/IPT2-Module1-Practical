import express from 'express';
import Feedback from '../models/feedback.model.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Submit feedback (Customer)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { orderId, rating, feedbackType, message } = req.body;

    // Validation
    if (!orderId || !rating || !feedbackType || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const feedback = new Feedback({
      userId: req.user.id,
      orderId,
      customerInfo: {
        name: req.user.name,
        email: req.user.email
      },
      rating,
      feedbackType,
      message
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

// Get all feedbacks (Admin)
router.get('/admin/all', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

// Get my feedback (Customer)
router.get('/my-feedback', authMiddleware, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
});

// Update feedback status (Admin)
router.patch('/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        adminNotes,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
});

// Delete feedback (Admin)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete feedback',
      error: error.message
    });
  }
});

// Get feedback statistics (Admin)
router.get('/admin/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const totalFeedback = await Feedback.countDocuments();
    const avgRating = await Feedback.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const feedbackByType = await Feedback.aggregate([
      { $group: { _id: '$feedbackType', count: { $sum: 1 } } }
    ]);

    const feedbackByStatus = await Feedback.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const ratingDistribution = await Feedback.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalFeedback,
        averageRating: avgRating[0]?.avgRating || 0,
        feedbackByType,
        feedbackByStatus,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message
    });
  }
});

export default router;
