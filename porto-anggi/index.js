document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    
    console.log('Nama:', document.getElementById('name').value);
    console.log('Email:', document.getElementById('email').value);
    console.log('Telepon:', document.getElementById('phone').value);
    console.log('Subjek:', document.getElementById('subject').value);
    console.log('Pesan:', document.getElementById('message').value);
    
    alert('Form telah dikirim!');
});