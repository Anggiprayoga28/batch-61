document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    
    console.log('Nama:', document.getElementById('name').value);
    console.log('Email:', document.getElementById('email').value);
    console.log('Telepon:', document.getElementById('phone').value);
    console.log('Subjek:', document.getElementById('subject').value);
    console.log('Pesan:', document.getElementById('message').value);
    
    alert('Form telah dikirim!');
});

/// DOM Elements
const projectForm = document.getElementById('project-form');
const projectNameInput = document.getElementById('project-name');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const descriptionInput = document.getElementById('description');
const projectIdInput = document.getElementById('project-id');
const projectsContainer = document.getElementById('projects-container');
const imageUpload = document.getElementById('image-upload');
const imagePath = document.getElementById('image-path');
const attachBtn = document.getElementById('attach-btn');
const submitBtn = document.getElementById('submit-btn');

// Demo Gambbar
const demoImages = [
    'https://i.imgur.com/ZY4hACv.jpg', // code image
    'https://i.imgur.com/IaYJkZY.jpg', // app image
    'https://i.imgur.com/hnfDHHY.jpg', // mobile image
    'https://i.imgur.com/sCNY5Nd.jpg', // technology image
    'https://i.imgur.com/9NWdKq5.jpg', // web image
];

// Projects Array
let projects = JSON.parse(localStorage.getItem('projects')) || [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    
    // Handle file upload
    imageUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            imagePath.value = file.name;
            
            // Convert image to base64 string to store in localStorage
            const reader = new FileReader();
            reader.onload = function() {
                // Store the base64 image temporarily
                localStorage.setItem('tempImageData', reader.result);
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Click the hidden file input when user clicks on "choose" or attachment button
    attachBtn.addEventListener('click', () => {
        imageUpload.click();
    });
    
    // Form submit handler
    projectForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProject();
    });
});

// Calculate project duration in months
function calculateDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInTime = end.getTime() - start.getTime();
    const diffInMonths = Math.ceil(diffInTime / (1000 * 3600 * 24 * 30));
    return diffInMonths <= 0 ? 1 : diffInMonths;
}

// Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Save project
function saveProject() {
    // Get selected technologies
    const technologies = [];
    if (document.getElementById('node-js').checked) technologies.push('Node.js');
    if (document.getElementById('next-js').checked) technologies.push('Next.js');
    if (document.getElementById('react-js').checked) technologies.push('React.js');
    if (document.getElementById('typescript').checked) technologies.push('TypeScript');
    
    // Get the uploaded image data or use a random demo image
    let imageData = localStorage.getItem('tempImageData');
    if (!imageData) {
        // No image uploaded, use random demo image
        imageData = demoImages[Math.floor(Math.random() * demoImages.length)];
    }
    
    // Create project object
    const project = {
        id: projectIdInput.value || Date.now().toString(),
        name: projectNameInput.value,
        startDate: startDateInput.value,
        endDate: endDateInput.value,
        description: descriptionInput.value,
        technologies: technologies,
        image: imageData, // Store the actual image data
        createdAt: new Date().toISOString()
    };
    
    // Check if we're editing an existing project
    const existingProjectIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingProjectIndex !== -1) {
        // Update existing project
        projects[existingProjectIndex] = project;
    } else {
        // Add new project
        projects.push(project);
    }
    
    // Save to localStorage
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // Clear the temporary image data
    localStorage.removeItem('tempImageData');
    
    // Reset form
    resetForm();
    
    // Re-render projects
    renderProjects();
}

// Reset form
function resetForm() {
    projectForm.reset();
    projectIdInput.value = '';
    imagePath.value = '';
    submitBtn.textContent = 'submit';
}

// Render projects
function renderProjects() {
    projectsContainer.innerHTML = '';
    
    // Sort projects by creation date (newest first)
    const sortedProjects = [...projects].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    sortedProjects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsContainer.appendChild(projectCard);
    });
}

// Create project card
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    // Calculate duration
    const duration = calculateDuration(project.startDate, project.endDate);
    
    // Create Tech Icons HTML
    const techIconsHTML = createTechIcons(project.technologies);
    
    // Use the stored image data directly
    let imageSrc = project.image;
    
    card.innerHTML = `
        <div class="project-image" style="background-image: url('${imageSrc}')"></div>
        <div class="project-info">
            <div class="project-title">${project.name} - ${new Date(project.startDate).getFullYear()}</div>
            <div class="project-date">durasi: ${duration} bulan</div>
            <div class="project-author">author: 3 orang</div>
            <div class="project-desc">
                ${project.description.length > 100 
                    ? project.description.substring(0, 100) + '...' 
                    : project.description}
            </div>
            <div class="tech-badges">
                ${techIconsHTML}
            </div>
            <div class="action-buttons">
                <button class="edit-btn" data-id="${project.id}">edit</button>
                <button class="delete-btn" data-id="${project.id}">delete</button>
            </div>
        </div>
    `;
    
    // Add event listeners for edit and delete buttons
    card.querySelector('.edit-btn').addEventListener('click', () => {
        editProject(project.id);
    });
    
    card.querySelector('.delete-btn').addEventListener('click', () => {
        deleteProject(project.id);
    });
    
    return card;
}

// Create tech icons
function createTechIcons(technologies) {
    let icons = '';
    
    technologies.forEach(tech => {
        let icon = '';
        
        // Set icon based on technology
        if (tech === 'Node.js') icon = '🟢';
        else if (tech === 'Next.js') icon = '⚫';
        else if (tech === 'React.js') icon = '⚛️';
        else if (tech === 'TypeScript') icon = '🔷';
        
        icons += `<div class="tech-badge" title="${tech}">${icon}</div>`;
    });
    
    return icons;
}

// Edit project
function editProject(id) {
    const project = projects.find(p => p.id === id);
    
    if (project) {
        // Fill form with project data
        projectNameInput.value = project.name;
        startDateInput.value = project.startDate;
        endDateInput.value = project.endDate;
        descriptionInput.value = project.description;
        projectIdInput.value = project.id;
        
        // Check technology checkboxes
        document.getElementById('node-js').checked = project.technologies.includes('Node.js');
        document.getElementById('next-js').checked = project.technologies.includes('Next.js');
        document.getElementById('react-js').checked = project.technologies.includes('React.js');
        document.getElementById('typescript').checked = project.technologies.includes('TypeScript');
        
        // Display image name (for UI purposes)
        if (project.image && project.image.startsWith('data:')) {
            imagePath.value = 'Uploaded image';
            // Store the image temporarily for editing
            localStorage.setItem('tempImageData', project.image);
        } else if (project.image) {
            imagePath.value = 'Demo image';
        }
        
        // Change submit button text
        submitBtn.textContent = 'Update';
        
        // Scroll to form
        document.querySelector('.section-title').scrollIntoView({ behavior: 'smooth' });
    }
}

// Delete project
function deleteProject(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        projects = projects.filter(p => p.id !== id);
        localStorage.setItem('projects', JSON.stringify(projects));
        renderProjects();
    }
}