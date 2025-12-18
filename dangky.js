document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const msg = document.getElementById('registerMessage');
    
    if (!fullname || !email || !password || !confirmPassword || !role) {
        msg.textContent = 'Vui lòng nhập đầy đủ thông tin!';
        msg.style.color = 'red';
        return;
    }
    
    if (password.length < 6) {
        msg.textContent = 'Mật khẩu phải có ít nhất 6 ký tự!';
        msg.style.color = 'red';
        return;
    }
    
    if (password !== confirmPassword) {
        msg.textContent = 'Mật khẩu xác nhận không khớp!';
        msg.style.color = 'red';
        return;
    }
    
    let users = JSON.parse(localStorage.getItem('cl_users')) || [];
    
    if (users.some(u => u.email === email)) {
        msg.textContent = 'Email này đã được đăng ký!';
        msg.style.color = 'red';
        return;
    }
    
    users.push({
        name: fullname,
        email: email,
        password: password,
        role: role
    });
    
    localStorage.setItem('cl_users', JSON.stringify(users));
    
    msg.textContent = 'Đăng ký thành công! Vui lòng đăng nhập.';
    msg.style.color = 'green';
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
});