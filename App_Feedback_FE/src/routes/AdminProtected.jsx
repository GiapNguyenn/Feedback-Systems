import { Navigate } from "react-router-dom";

function AdminProtected({ children, requiredRole }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role")?.toLowerCase()?.trim(); // Thêm trim để sạch sẽ

  // 1. CHƯA LOGIN: Đá văng ra ngay
  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/admin/login" replace />;
  }

  // 2. SAI QUYỀN TRUY CẬP (Ví dụ: sinh viên cố tình vào)
  const allowedRoles = ["admin", "teacher"];
  if (!role || !allowedRoles.includes(role)) {
    // Xóa sạch để tránh kẹt role cũ
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return <Navigate to="/admin/login" replace />;
  }

  // 3. NẾU VÀO TRANG ADMIN MÀ ROLE LÀ TEACHER (Và ngược lại)
  if (requiredRole && role !== requiredRole.toLowerCase()) {
    // Nếu là giáo viên mà cố vào trang Logs của Admin -> Đẩy về Dashboard chung
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtected;