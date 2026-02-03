const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const adminController = require('../controllers/adminController');
const { auth } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('username').notEmpty().withMessage('Username is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidation = [
  body('username').optional().trim().escape(),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail()
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
];

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      errors: errors.array()
    });
  };
};

// Public routes
router.post('/register', validate(registerValidation), adminController.register);
router.post('/login', validate(loginValidation), adminController.login);

// Protected routes
router.get('/profile', auth, adminController.getCurrentUser);
router.get('/dashboard', auth, adminController.getDashboardStats);

router.put('/profile', 
  auth, 
  validate(updateProfileValidation), 
  adminController.updateProfile
);

router.put('/change-password', 
  auth, 
  validate(changePasswordValidation), 
  adminController.changePassword
);

module.exports = router;