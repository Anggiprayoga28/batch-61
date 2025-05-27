// scripts/setup-db.js - Database setup and initialization script
const { Pool } = require('pg');
require('dotenv').config();

// Create connection to PostgreSQL (without specifying database)
const setupPool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

const dbName = process.env.DB_NAME || 'project';

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up database...');
    
    // Check if database exists
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = $1`;
    const dbExists = await setupPool.query(checkDbQuery, [dbName]);
    
    if (dbExists.rows.length === 0) {
      // Create database if it doesn't exist
      console.log(`📝 Creating database: ${dbName}`);
      await setupPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database ${dbName} created successfully`);
    } else {
      console.log(`✅ Database ${dbName} already exists`);
    }
    
    // Close setup connection
    await setupPool.end();
    
    // Connect to the specific database to create tables
    const dbPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: dbName,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
    });
    
    console.log('📋 Creating tables...');
    
    // Create projects table
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        description TEXT,
        technologies TEXT[],
        image VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Projects table created/verified');
    
    // Create contacts table
    await dbPool.query(`
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
    console.log('✅ Contacts table created/verified');
    
    // Create trigger function for updating timestamps
    await dbPool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create trigger for projects table
    await dbPool.query(`
      DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
      CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Database triggers created/updated');
    
    // Insert sample data (optional)
    const projectCount = await dbPool.query('SELECT COUNT(*) FROM projects');
    if (parseInt(projectCount.rows[0].count) === 0) {
      console.log('📝 Inserting sample project data...');
      
      const sampleProjects = [
        {
          id: require('uuid').v4(),
          name: 'Portfolio Website',
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          description: 'A responsive portfolio website built with Express.js and PostgreSQL',
          technologies: ['Node.js', 'Express.js', 'PostgreSQL', 'Handlebars'],
          image: '/img/demo-image-1.jpg'
        },
        {
          id: require('uuid').v4(),
          name: 'E-commerce Platform',
          start_date: '2024-02-01',
          end_date: '2024-04-30',
          description: 'Full-stack e-commerce platform with payment integration',
          technologies: ['React.js', 'Node.js', 'PostgreSQL'],
          image: '/img/demo-image-2.jpg'
        }
      ];
      
      for (const project of sampleProjects) {
        await dbPool.query(
          `INSERT INTO projects (id, name, start_date, end_date, description, technologies, image)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [project.id, project.name, project.start_date, project.end_date, 
           project.description, project.technologies, project.image]
        );
      }
      console.log('✅ Sample data inserted');
    }
    
    await dbPool.end();
    console.log('🎉 Database setup completed successfully!');
    console.log(`\n📊 Database Details:`);
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || 5432}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    console.log('\n🚀 You can now start your application with: npm start');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
};

// Run the setup
setupDatabase();