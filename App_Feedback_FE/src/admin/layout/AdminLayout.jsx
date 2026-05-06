import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function AdminLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      {/* Sidebar dính chặt bên trái */}
      <Sidebar />

      {/* Nội dung bên phải - Phải đẩy margin-left để không bị đè */}
      <div style={{ 
        flex: 1, 
        marginLeft: "260px", // 💡 QUAN TRỌNG: Phải bằng width của Sidebar
        padding: "30px",
        minHeight: "100vh",
        transition: "all 0.3s ease" // Hiệu ứng mượt nếu sau này Giáp làm nút thu nhỏ
      }}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;