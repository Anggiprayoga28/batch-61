// Contact form validation
const contactForm = document.querySelector('.container form');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    if (!name || !email || !phone || !subject || !message) {
      alert('Please fill all fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }
    
    // Phone validation - simple check for digits
    const phoneRegex = /^\d{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      alert('Please enter a valid phone number');
      return;
    }
    
    // Create an object with the form data
    const formData = {
      name: name,
      email: email,
      phone: phone,
      subject: subject,
      message: message
    };
    
    // Log data to browser console
    console.log('Form submitted with the following data:');
    console.log(formData);
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('Subject:', subject);
    console.log('Message:', message);
    
    // Send data to the server to log in VSCode terminal
    fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Server response:', data);
      alert('Thank you for your message. We will get back to you soon!');
      contactForm.reset();
    })
    .catch(error => {
      console.error('Error:', error);
      alert('There was an error sending your message. Please try again.');
    });
    });
  }
  