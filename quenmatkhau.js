document.getElementById('forgotForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const msg = document.getElementById('forgotMessage');
    
    if (!email) {
        msg.textContent = 'Vui lòng nhập email!';
        msg.style.color = 'red';
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('cl_users')) || [];
    const user = users.find(u => u.email === email);
    
    if (user) {
        // Trong môi trường demo: hiện mật khẩu
        msg.innerHTML = `✅ Tài khoản: <strong>${user.name}</strong><br>Mật khẩu của bạn là: <code>${user.password}</code>`;
        msg.style.color = 'green';
    } else {
        msg.textContent = 'Không tìm thấy tài khoản với email này.';
        msg.style.color = 'red';
    }
});