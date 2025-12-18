
const defaultUsers = [
    { 
        id: 'USER001', 
        name: 'Admin Tổng', 
        email: 'admin@company.com', 
        password: 'admin123', 
        role: 'admin'
    },
    { 
        id: 'USER002', 
        name: 'Nguyễn Văn Tài', 
        email: 'taixe@company.com', 
        password: 'taixe123', 
        role: 'nhân viên kho'
    },
    { 
        id: 'USER003', 
        name: 'Hoàng La Thám', 
        email: 'ketoan@company.com', 
        password: 'ketoan123', 
        role: 'nhân viên kho'
    },
    { 
        id: 'USER004', 
        name: 'Lê Văn Quý', 
        email: 'quanly@company.com', 
        password: 'quanly123', 
        role: 'Điều Phối'
    }
];

if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    console.log('Đã khởi tạo danh sách users mặc định (không có warehouseId và status)');
}

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.querySelector('.signup');
    const loginForm = document.querySelector('.signup-login');
    const toLogin = document.getElementById('to-login');
    const toRegister = document.getElementById('to-register'); 

    if (toLogin) {
        toLogin.addEventListener('click', (e) => {
            e.preventDefault();
            signupForm?.classList.add('hidden');
            loginForm?.classList.remove('hidden');
        });
    }

    if (toRegister) {
        toRegister.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm?.classList.add('hidden');
            signupForm?.classList.remove('hidden');
        });
    }

    const loginSubmit = document.querySelector('.signup-login input[type="submit"]');
    if (loginSubmit) {
        loginSubmit.addEventListener('click', (e) => {
            e.preventDefault();

            const email = document.getElementById('email-login')?.value.trim();
            const password = document.getElementById('password-login')?.value;

            if (!email || !password) {
                alert('Vui lòng nhập đầy đủ email và mật khẩu!');
                return;
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                alert(`Đăng nhập thành công!\nChào mừng ${user.name}`);
                
                localStorage.setItem('isLoggedIn', 'true');

                localStorage.setItem('currentUser', JSON.stringify(user));
                
                window.location.href = 'index.html';
            } else {
                alert('Điền thông tin đúng thì zô \n không thì liên hệ với: 0972631151');
            }
        });
    }

    const loginBtn = document.getElementById('login');
    const logoutBtn = document.getElementById('outlogin');
    const logoutLink = document.getElementById('logout-link');

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }

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