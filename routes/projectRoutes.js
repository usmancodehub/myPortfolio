const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { auth } = require('../middleware/auth');

// Public routes
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProject);

// Protected routes (admin only)
router.post('/', 
  auth, 
  projectController.upload.single('image'),
  projectController.createProject
);

router.put('/:id', 
  auth, 
  projectController.upload.single('image'),
  projectController.updateProject
);

router.delete('/:id', auth, projectController.deleteProject);
router.get('/stats/all', auth, projectController.getProjectStats);

module.exports = router;