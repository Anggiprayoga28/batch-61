// app.js - Main Express application file with PostgreSQL integration
const methodOverride = require('method-override');
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import database configuration
const { db, initializeTables } = require('./db');

// Initialize Express
const app = express();
const port = process.env.PORT || 3000;

// Configure Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// Configure Handlebars
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    // Helper to check equality
    eq: function(a, b) {
      return a === b;
    },
    // Helper to check if greater than
    gt: function(a, b) {
      return a > b;
    }
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Calculate project duration in months
const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInTime = end.getTime() - start.getTime();
  const diffInMonths = Math.ceil(diffInTime / (1000 * 3600 * 24 * 30));
  return diffInMonths <= 0 ? 1 : diffInMonths;
};

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/contact', (req, res) => {
  res.render('contact');
});

// Contact form submission - now saves to PostgreSQL
app.post('/api/contact', async (req, res) => {
  try {
    const contactData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      subject: req.body.subject,
      message: req.body.message
    };
    
    // Save to PostgreSQL database
    const savedContact = await db.createContact(contactData);
    
    // Log to console for development
    console.log('\n========== CONTACT FORM SUBMISSION ==========');
    console.log(`ID      : ${savedContact.id}`);
    console.log(`Name    : ${savedContact.name}`);
    console.log(`Email   : ${savedContact.email}`);
    console.log(`Phone   : ${savedContact.phone}`);
    console.log(`Subject : ${savedContact.subject}`);
    console.log(`Message : ${savedContact.message}`);
    console.log(`Time    : ${new Date(savedContact.submitted_at).toLocaleString()}`);
    console.log('===========================================\n');
    
    res.json({ 
      success: true, 
      message: 'Thank you for your message. We will get back to you soon!',
      data: savedContact
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({ 
      success: false, 
      error: 'There was an error submitting your message. Please try again.' 
    });
  }
});

// Projects page - fetch from PostgreSQL
app.get('/projects', async (req, res) => {
  try {
    const projects = await db.getAllProjects();
    
    // Add duration to each project and format dates
    const projectsWithDuration = projects.map(project => {
      return {
        ...project,
        duration: calculateDuration(project.start_date, project.end_date),
        startDate: project.start_date, // Keep original format for form
        endDate: project.end_date       // Keep original format for form
      };
    });
    
    res.render('projects', { projects: projectsWithDuration });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).send('Error loading projects');
  }
});

// Project detail page route
app.get('/projects/:id', async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id);
    
    if (!project) {
      return res.status(404).send('Project not found');
    }
    
    // Calculate duration
    const duration = calculateDuration(project.start_date, project.end_date);
    
    // Format dates for display
    const startDate = new Date(project.start_date).toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const endDate = new Date(project.end_date).toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    res.render('project-detail', { 
      project: {
        ...project,
        duration,
        startDate,
        endDate
      } 
    });
  } catch (error) {
    console.error('Error fetching project detail:', error);
    res.status(500).send('Error loading project');
  }
});

// Create new project - save to PostgreSQL
app.post('/api/projects', upload.single('image'), async (req, res) => {
  try {
    // Get selected technologies
    const technologies = [];
    if (req.body.nodeJs === 'on') technologies.push('Node.js');
    if (req.body.nextJs === 'on') technologies.push('Next.js');
    if (req.body.reactJs === 'on') technologies.push('React.js');
    if (req.body.typescript === 'on') technologies.push('TypeScript');
    
    // Get the image path
    let imagePath = '';
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    } else {
      // Use a random demo image if no image uploaded
      const demoImages = [
        '/img/demo-image-1.jpg',
        '/img/demo-image-2.jpg',
        '/img/demo-image-3.jpg',
        '/img/demo-image-4.jpg',
        '/img/demo-image-5.jpg',
      ];
      imagePath = demoImages[Math.floor(Math.random() * demoImages.length)];
    }
    
    // Create project object
    const projectData = {
      id: uuidv4(),
      name: req.body.projectName,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      description: req.body.description,
      technologies: technologies,
      image: imagePath
    };
    
    // Save to PostgreSQL
    await db.createProject(projectData);
    
    res.redirect('/projects');
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).send('Error creating project');
  }
});

// Replace the existing update project route in app.js with this corrected version

// Update project - PostgreSQL (POST /api/projects/:id)
app.post('/api/projects/:id', upload.single('image'), async (req, res) => {
  try {
    console.log('=== UPDATE PROJECT DEBUG ===');
    console.log('Project ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const projectId = req.params.id;
    
    // Get existing project from PostgreSQL
    const existingProject = await db.getProjectById(projectId);
    
    if (!existingProject) {
      console.log('Project not found with ID:', projectId);
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    console.log('Existing project found:', existingProject);
    
    // Get selected technologies
    const technologies = [];
    if (req.body.nodeJs === 'on') technologies.push('Node.js');
    if (req.body.nextJs === 'on') technologies.push('Next.js');
    if (req.body.reactJs === 'on') technologies.push('React.js');
    if (req.body.typescript === 'on') technologies.push('TypeScript');
    
    console.log('Technologies selected:', technologies);
    
    // Validate required fields
    if (!req.body.projectName || !req.body.startDate || !req.body.endDate || !req.body.description) {
      console.log('Missing required fields');
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    
    // Handle image upload
    let imagePath = existingProject.image;
    if (req.file) {
      // If we have a new image, delete the old one if it's not a demo image
      if (existingProject.image && existingProject.image.startsWith('/uploads/')) {
        const oldImagePath = path.join(__dirname, 'public', existingProject.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      imagePath = `/uploads/${req.file.filename}`;
    }
    
    // Prepare updated project data
    const updatedProjectData = {
      name: req.body.projectName,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      description: req.body.description,
      technologies: technologies, // PostgreSQL array will handle this correctly
      image: imagePath
    };
    
    console.log('Updated project data:', updatedProjectData);
    
    // Update in PostgreSQL database
    await db.updateProject(projectId, updatedProjectData);
    
    console.log('Project updated successfully in database');
    
    // Redirect to projects page
    res.redirect('/projects');
    
  } catch (error) {
    console.error('=== ERROR UPDATING PROJECT ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request params:', req.params);
    console.error('Request body:', req.body);
    res.status(500).json({ success: false, error: 'Error updating project: ' + error.message });
  }
});

// Delete project - PostgreSQL
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const projectId = req.params.id;
    
    // Get project before deletion to handle image cleanup
    const project = await db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    
    // Delete from PostgreSQL
    await db.deleteProject(projectId);
    
    // Delete uploaded image file if exists
    if (project.image && project.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, 'public', project.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: 'Error deleting project' });
  }
});

// Get specific project - PostgreSQL
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Format dates for form (YYYY-MM-DD format)
    const formattedProject = {
      ...project,
      startDate: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
      endDate: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : ''
    };
    
    res.json(formattedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Error fetching project' });
  }
});

// Admin route to view all contacts (optional)
app.get('/admin/contacts', async (req, res) => {
  try {
    const contacts = await db.getAllContacts();
    res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Error fetching contacts' });
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initializeTables();
    
    // Start the server
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      console.log('Database connection established and tables initialized');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();