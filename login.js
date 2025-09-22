document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;
    const message = document.getElementById("loginMessage");

    if (!email || !password || !role) {
        message.textContent = "Vui lòng nhập đầy đủ thông tin!";
        message.style.color = "red";
        return;
    }

    // Tài khoản mẫu (demo)
    if (role === "admin" && email === "camtu4864@gmail.com" && password === "123456") {
        message.textContent = "Đăng nhập thành công với quyền Admin!";
        message.style.color = "green";
        setTimeout(() => {
            window.location.href = "admin.html";  // 👉 chuyển sang admin.html
        }, 1000);
    }
    else if (role === "staff" && email === "staff@example.com" && password === "123456") {
        message.textContent = "Đăng nhập thành công với quyền Nhân viên!";
        message.style.color = "green";
        setTimeout(() => {
            window.location.href = "index.html";  // 👉 chuyển sang index.html (giao diện nhân viên)
        }, 1000);
    }
    else {
        message.textContent = "Sai thông tin đăng nhập!";
        message.style.color = "red";
    }
});
