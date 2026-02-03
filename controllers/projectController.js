const Project = require('../models/Project');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'public/uploads/projects';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'project-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

exports.upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { title, description, shortDescription, liveUrl, githubUrl, tags, technologies, featured } = req.body;

    // Parse tags and technologies from strings to arrays
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    const techArray = technologies ? technologies.split(',').map(tech => tech.trim()) : [];

    const projectData = {
      title,
      description,
      shortDescription,
      liveUrl,
      githubUrl,
      tags: tagsArray,
      technologies: techArray,
      featured: featured === 'true'
    };

    // Add image URL if file was uploaded
    if (req.file) {
      projectData.imageUrl = `/uploads/projects/${req.file.filename}`;
    }

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Project creation error:', error);

    // Delete uploaded file if there was an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    console.log('Fetching projects with query:', req.query);
    const { featured, tag, page = 1, limit = 10 } = req.query;

    const query = {};
    if (featured === 'true') query.featured = true;
    if (tag) query.tags = { $in: [tag] };

    const projects = await Project.find(query)
      .sort({ featured: -1, order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      data: projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { title, description, shortDescription, liveUrl, githubUrl, tags, technologies, featured, order } = req.body;

    const updateData = {
      title,
      description,
      shortDescription,
      liveUrl,
      githubUrl,
      featured: featured === 'true',
      order: order ? parseInt(order) : 0
    };

    // Parse tags and technologies from strings to arrays
    if (tags) updateData.tags = tags.split(',').map(tag => tag.trim());
    if (technologies) updateData.technologies = technologies.split(',').map(tech => tech.trim());

    // Handle image update
    if (req.file) {
      updateData.imageUrl = `/uploads/projects/${req.file.filename}`;

      // Delete old image if exists
      const oldProject = await Project.findById(req.params.id);
      if (oldProject && oldProject.imageUrl && oldProject.imageUrl.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, '..', 'public', oldProject.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error('Error deleting old image:', err);
          });
        }
      }
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Project update error:', error);

    // Delete uploaded file if there was an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete image file if exists
    if (project.imageUrl && project.imageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '..', 'public', project.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error('Error deleting image:', err);
        });
      }
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get project statistics
exports.getProjectStats = async (req, res) => {
  try {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          featured: { $sum: { $cond: [{ $eq: ['$featured', true] }, 1, 0] } },
          tags: { $push: '$tags' }
        }
      },
      {
        $project: {
          _id: 0,
          total: 1,
          featured: 1,
          totalTags: { $size: { $setUnion: [{ $reduce: { input: '$tags', initialValue: [], in: { $concatArrays: ['$$value', '$$this'] } } }, []] } }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || { total: 0, featured: 0, totalTags: 0 }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};