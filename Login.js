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

    // === XỬ LÝ ĐĂNG NHẬP ===
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
                // ✅ Lưu trạng thái đăng nhập
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', user.email);
                window.location.href = 'index.html';
            } else {
                alert('Email hoặc mật khẩu sai!');
            }
        });
    }

    // === XỬ LÝ HIỂN THỊ HEADER ===
    const loginBtn = document.getElementById('login');
    const logoutBtn = document.getElementById('outlogin');
    const logoutLink = document.getElementById('logout-link');

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
        // Người dùng đã đăng nhập
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
        // Người dùng chưa đăng nhập
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

    // === XỬ LÝ ĐĂNG XUẤT ===
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            alert('Đăng xuất thành công!');
            window.location.href = 'login.html';
        });
    }
});
