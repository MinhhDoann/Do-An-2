// === Biến DOM ===
const modal = document.getElementById("authModal");
const loginBtn = document.querySelector(".login-btn");
const closeBtn = document.querySelector(".close");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showLogin = document.getElementById("show-login");
const showRegister = document.getElementById("show-register");
const formTitle = document.getElementById("form-title");
const message = document.getElementById("message");

// === Mở form khi nhấn nút ===
loginBtn.addEventListener("click", () => {
    modal.style.display = "flex";
});

// === Đóng form ===
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    message.textContent = "";
});

// === Đóng khi click ra ngoài ===
window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
        message.textContent = "";
    }
});

// === Chuyển qua Đăng ký ===
showRegister.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    registerForm.style.display = "flex";
    formTitle.textContent = "Đăng ký";
    message.textContent = "";
});

// === Chuyển qua Đăng nhập ===
showLogin.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "flex";
    registerForm.style.display = "none";
    formTitle.textContent = "Đăng nhập";
    message.textContent = "";
});

// === Đăng ký ===
registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();

    if (!username || !email || !password) {
        message.textContent = "Vui lòng nhập đầy đủ thông tin!";
        return;
    }

    let users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.some(u => u.username === username)) {
        message.textContent = "Tên đăng nhập đã tồn tại!";
        return;
    }

    users.push({ username, email, password });
    localStorage.setItem("users", JSON.stringify(users));
    message.style.color = "green";
    message.textContent = "Đăng ký thành công! Hãy đăng nhập.";
    registerForm.reset();

    setTimeout(() => {
        showLogin.click();
        message.textContent = "";
    }, 1500);
});

// === Đăng nhập ===
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
        message.style.color = "green";
        message.textContent = "Đăng nhập thành công!";
        setTimeout(() => {
            modal.style.display = "none";
            message.textContent = "";
            loginBtn.textContent = `👋 ${user.username}`;
            loginBtn.disabled = true;
            loginBtn.style.cursor = "default";
        }, 1000);
    } else {
        message.style.color = "red";
        message.textContent = "Sai tên đăng nhập hoặc mật khẩu!";
    }
});
