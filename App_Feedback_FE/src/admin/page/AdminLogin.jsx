import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      // Đặt tên biến là 'data' ở đây để bên dưới dùng được
      const data = await res.json(); 

      console.log("Dữ liệu từ Server:", data);

      if (!res.ok) {
        alert(data.message || "Đăng nhập thất bại");
        return;
      }

      if (data.token && data.user) {
  // 💡 BƯỚC 1: Xóa sạch dấu vết cũ
  localStorage.clear(); 

  // 💡 BƯỚC 2: Lưu dữ liệu mới
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.user.role.toLowerCase());

  const userRole = data.user.role.toLowerCase();

  if (userRole === "admin" || userRole === "teacher") {
    // 💡 BƯỚC 3: Thay navigate bằng cái này để làm mới hoàn toàn hệ thống
    window.location.href = "/admin"; 
  } else {
    alert("Sinh viên không có quyền vào đây!");
    localStorage.clear();
  }
}
    } catch (err) {
      console.error("Lỗi kết nối:", err);
      alert("Không thể kết nối đến server. Vui lòng kiểm tra lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h2>Admin Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <br /><br />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;