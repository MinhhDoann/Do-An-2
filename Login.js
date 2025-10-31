document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.querySelector('.signup');
    const loginForm = document.querySelector('.signup-login');
    const toLogin = document.getElementById('to-login');
    const toRegister = document.getElementById('to-register');

    // === CHUYỂN SANG ĐĂNG NHẬP ===
    if (toLogin) {
        toLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
    }

    // === CHUYỂN SANG ĐĂNG KÝ ===
    if (toRegister) {
        toRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        });
    }

    // === XỬ LÝ ĐĂNG NHẬP (bạn chưa có, thêm nếu cần) ===
    const loginSubmit = document.querySelector('.signup-login input[type="submit"]');
    if (loginSubmit) {
        loginSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('email-login').value;
            const password = document.getElementById('password-login').value;

            if (!email || !password) {
                alert('Vui lòng nhập email và mật khẩu!');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                alert('Đăng nhập thành công!');
                window.location.href = 'index.html';
            } else {
                alert('Email hoặc mật khẩu sai!');
            }
        });
    }
});