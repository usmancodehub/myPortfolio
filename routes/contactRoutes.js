const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const contactController = require('../controllers/contactController');
const { auth } = require('../middleware/auth');

// Validation rules
const contactValidation = [
  body('name').notEmpty().withMessage('Name is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('message').isLength({ min: 10 }).withMessage('Message must be at least 10 characters long').trim().escape()
];

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Public routes
router.post('/', contactValidation, validate, contactController.submitContact);

// Protected routes (admin only)
router.get('/', auth, contactController.getAllContacts);
router.get('/stats', auth, contactController.getContactStats);
router.get('/:id', auth, contactController.getContact);
router.put('/:id/status', auth, contactController.updateContactStatus);
router.delete('/:id', auth, contactController.deleteContact);

module.exports = router;