// db.js - Database configuration and connection
const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of clients in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL connection error:', err);
  process.exit(-1);
});

// Create tables if they don't exist
const initializeTables = async () => {
  try {
    // Create projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        description TEXT,
        technologies TEXT[], -- Array of strings for technologies
        image VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(500),
        message TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create trigger to update updated_at column for projects
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
      CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
};

// Database query functions
const db = {
  // Generic query function
  query: (text, params) => pool.query(text, params),

  // Projects functions
  getAllProjects: async () => {
    try {
      const result = await pool.query(`
        SELECT id, name, start_date, end_date, description, technologies, image, created_at, updated_at
        FROM projects 
        ORDER BY created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  getProjectById: async (id) => {
    try {
      const result = await pool.query(
        'SELECT * FROM projects WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching project by ID:', error);
      throw error;
    }
  },

  createProject: async (projectData) => {
    try {
      const { id, name, startDate, endDate, description, technologies, image } = projectData;
      const result = await pool.query(
        `INSERT INTO projects (id, name, start_date, end_date, description, technologies, image)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, name, startDate, endDate, description, technologies, image]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  updateProject: async (id, projectData) => {
    try {
      const { name, startDate, endDate, description, technologies, image } = projectData;
      const result = await pool.query(
        `UPDATE projects 
         SET name = $2, start_date = $3, end_date = $4, description = $5, technologies = $6, image = $7
         WHERE id = $1
         RETURNING *`,
        [id, name, startDate, endDate, description, technologies, image]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    try {
      const result = await pool.query(
        'DELETE FROM projects WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Contacts functions
  createContact: async (contactData) => {
    try {
      const { name, email, phone, subject, message } = contactData;
      const result = await pool.query(
        `INSERT INTO contacts (name, email, phone, subject, message)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, email, phone, subject, message]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  },

  getAllContacts: async () => {
    try {
      const result = await pool.query(`
        SELECT * FROM contacts 
        ORDER BY submitted_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }
};

module.exports = {
  pool,
  db,
  initializeTables
};