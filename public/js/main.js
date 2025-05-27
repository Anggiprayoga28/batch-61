// Client-side JavaScript for portfolio site
document.addEventListener('DOMContentLoaded', function() {
  // Handle file input for project image
  const imageUpload = document.getElementById('image-upload');
  const imagePath = document.getElementById('image-path');
  const attachBtn = document.getElementById('attach-btn');
  
  if (imageUpload && imagePath && attachBtn) {
      imageUpload.addEventListener('change', function() {
          if (this.files.length > 0) {
              imagePath.value = this.files[0].name;
          } else {
              imagePath.value = '';
          }
      });
      
      attachBtn.addEventListener('click', function() {
          imageUpload.click();
      });
  }
  
  // Form for adding/editing projects
  const projectForm = document.getElementById('project-form');
  const projectId = document.getElementById('project-id');
  const submitBtn = document.getElementById('submit-btn');
  
  // Handle form submission
if (projectForm) {
  projectForm.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent default form submission
      
      const formData = new FormData(projectForm);
      const isUpdate = projectId && projectId.value; // Check if this is an update
      
      console.log('Form submission:', {
          action: projectForm.action,
          method: projectForm.method,
          isUpdate: isUpdate,
          projectId: projectId ? projectId.value : 'none'
      });
      
      fetch(projectForm.action, {
          method: 'POST',
          body: formData
      })
      .then(async response => {
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);
          
          // For successful operations, Express might redirect (302) or return success
          if (response.status === 302 || response.redirected) {
              // Successful redirect
              const message = isUpdate ? 'Project updated successfully!' : 'Project created successfully!';
              alert(message);
              resetForm();
              window.location.href = '/projects'; // Navigate to projects page
              return;
          }
          
          if (response.ok) {
              // Check content type
              const contentType = response.headers.get('Content-Type') || '';
              
              if (contentType.includes('text/html')) {
                  // This is likely a successful redirect to projects page
                  const message = isUpdate ? 'Project updated successfully!' : 'Project created successfully!';
                  alert(message);
                  resetForm();
                  window.location.href = '/projects';
                  return;
              }
              
              if (contentType.includes('application/json')) {
                  const result = await response.json();
                  if (result.success) {
                      const message = isUpdate ? 'Project updated successfully!' : 'Project created successfully!';
                      alert(message);
                      resetForm();
                      window.location.href = '/projects';
                  } else {
                      throw new Error(result.error || 'Operation failed');
                  }
                  return;
              }
              
              // Default success case
              const message = isUpdate ? 'Project updated successfully!' : 'Project created successfully!';
              alert(message);
              resetForm();
              window.location.href = '/projects';
              return;
          }
          
          // Handle error responses
          const contentType = response.headers.get('Content-Type') || '';
          let errorMsg = isUpdate ? 'Failed to update project' : 'Failed to create project';
          
          if (contentType.includes('application/json')) {
              try {
                  const errorData = await response.json();
                  errorMsg = errorData.error || errorData.message || errorMsg;
              } catch(e) {
                  console.error('Failed to parse error JSON:', e);
              }
          } else if (contentType.includes('text/html')) {
              try {
                  const text = await response.text();
                  // Try to extract meaningful error from HTML
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = text;
                  const bodyText = tempDiv.textContent || tempDiv.innerText || '';
                  if (bodyText.trim() && bodyText.length < 200) {
                      errorMsg = bodyText.trim();
                  }
              } catch(e) {
                  console.error('Failed to parse error HTML:', e);
              }
          }
          
          throw new Error(errorMsg);
      })
      .catch(error => {
          console.error('Error submitting project:', error);
          const action = isUpdate ? 'updating' : 'creating';
          alert(`An error occurred while ${action} the project: ${error.message}`);
      });
  });
}

  
 // Ganti bagian setupEditButtons di main.js dengan kode berikut:

function setupEditButtons() {
    const editBtns = document.querySelectorAll('.edit-btn');
    if (editBtns.length > 0) {
        editBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                
                // Fetch project data
                fetch(`/api/projects/${id}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Project not found');
                        }
                        return response.json();
                    })
                    .then(project => {
                        console.log('Loaded project for edit:', project);
                        
                        // Populate form
                        document.getElementById('project-name').value = project.name;
                        document.getElementById('start-date').value = project.startDate.substring(0, 10);
                        document.getElementById('end-date').value = project.endDate.substring(0, 10);
                        document.getElementById('description').value = project.description;
                        
                        // Reset technologies
                        document.getElementById('node-js').checked = false;
                        document.getElementById('next-js').checked = false;
                        document.getElementById('react-js').checked = false;
                        document.getElementById('typescript').checked = false;
                        
                        // Set technologies
                        if (project.technologies) {
                            project.technologies.forEach(tech => {
                                if (tech === 'Node.js') document.getElementById('node-js').checked = true;
                                if (tech === 'Next.js') document.getElementById('next-js').checked = true;
                                if (tech === 'React.js') document.getElementById('react-js').checked = true;
                                if (tech === 'TypeScript') document.getElementById('typescript').checked = true;
                            });
                        }
                        
                        // Set image path if exists
                        if (project.image) {
                            const fileName = project.image.split('/').pop();
                            imagePath.value = fileName;
                        } else {
                            imagePath.value = '';
                        }
                        
                        // PERBAIKAN: Update form untuk edit mode
                        // Ubah action ke endpoint update
                        projectForm.action = `/api/projects/${id}`;
                        
                        // HAPUS method override - gunakan POST biasa
                        // Karena di app.js sudah ada route POST /api/projects/:id untuk update
                        let methodInput = document.getElementById('_method');
                        if (methodInput) {
                            methodInput.remove();
                        }
                        
                        // Set project ID
                        projectId.value = id;
                        submitBtn.textContent = 'Update';
                        
                        console.log('Form updated for edit mode:');
                        console.log('- Action:', projectForm.action);
                        console.log('- Method:', projectForm.method);
                        console.log('- Project ID:', projectId.value);
                        
                        // Scroll to form
                        document.querySelector('.myproject').scrollIntoView({
                            behavior: 'smooth'
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching project data:', error);
                        alert('Failed to load project data. Please try again.');
                    });
            });
        });
    }
}
  
  // Function to register delete button event listeners
  function setupDeleteButtons() {
      const deleteBtns = document.querySelectorAll('.delete-btn');
      if (deleteBtns.length > 0) {
          deleteBtns.forEach(btn => {
              btn.addEventListener('click', function() {
                  if (confirm('Are you sure you want to delete this project?')) {
                      const id = this.getAttribute('data-id');
                      
                      // Use fetch with proper headers
                      fetch(`/api/projects/${id}`, {
                          method: 'DELETE',
                          headers: {
                              'Content-Type': 'application/json',
                          }
                      })
                      .then(response => {
                          if (!response.ok) {
                              throw new Error('Delete failed');
                          }
                          return response.json();
                      })
                      .then(result => {
                          if (result.success) {
                              // Remove the project card from DOM
                              const projectCard = document.querySelector(`.project-card[data-id="${id}"]`);
                              if (projectCard) {
                                  projectCard.remove();
                              }
                              
                              // Check if there are any projects left
                              const projectsContainer = document.getElementById('projects-container');
                              if (projectsContainer && projectsContainer.querySelectorAll('.project-card').length === 0) {
                                  projectsContainer.innerHTML = '<p class="text-center">No projects added yet. Create one above!</p>';
                              }
                              
                              alert('Project deleted successfully!');
                          } else {
                              alert('Failed to delete project. Please try again.');
                          }
                      })
                      .catch(error => {
                          console.error('Error deleting project:', error);
                          alert('An error occurred while deleting the project.');
                      });
                  }
              });
          });
      }
  }
  
  // Setup form reset function
  function resetForm() {
      if (projectForm) {
          projectForm.reset();
          projectForm.method = 'POST';
          projectForm.action = '/api/projects';
          // Remove method input if it exists
          const methodInput = document.getElementById('_method');
          if (methodInput) methodInput.remove();
          
          // Reset project ID and button text
          if (projectId) projectId.value = '';
          if (submitBtn) submitBtn.textContent = 'Submit';
          if (imagePath) imagePath.value = '';
      }
  }
  
  // Initialize the edit and delete button handlers
  setupEditButtons();
  setupDeleteButtons();
  
  // Add "Add New Project" button to reset form
  const addNewBtn = document.createElement('button');
  addNewBtn.type = 'button';
  addNewBtn.id = 'new-project-btn';
  addNewBtn.className = 'btn btn-primary mb-3';
  addNewBtn.textContent = 'Add New Project';
  
  // Insert the button before the form if it doesn't exist
  const projectFormContainer = document.querySelector('.project-form-container');
  if (projectFormContainer && !document.getElementById('new-project-btn')) {
      projectFormContainer.insertBefore(addNewBtn, projectForm);
  }
  
  // Add event listener to the new button
  if (document.getElementById('new-project-btn')) {
      document.getElementById('new-project-btn').addEventListener('click', resetForm);
  }
  
  // Date validation - end date must be after start date
  const startDate = document.getElementById('start-date');
  const endDate = document.getElementById('end-date');
  
  if (startDate && endDate) {
      endDate.addEventListener('change', function() {
          if (startDate.value && endDate.value) {
              const start = new Date(startDate.value);
              const end = new Date(endDate.value);
              
              if (end < start) {
                  alert('End date must be after start date');
                  endDate.value = '';
              }
          }
      });
      
      startDate.addEventListener('change', function() {
          if (startDate.value && endDate.value) {
              const start = new Date(startDate.value);
              const end = new Date(endDate.value);
              
              if (end < start) {
                  endDate.value = '';
              }
          }
      });
  }
  
  // Truncate project descriptions for display
  const projectDescs = document.querySelectorAll('.project-desc');
  if (projectDescs.length > 0) {
      projectDescs.forEach(desc => {
          const text = desc.textContent;
          if (text.length > 100) {
              desc.textContent = text.substring(0, 100) + '...';
          }
      });
  }
});