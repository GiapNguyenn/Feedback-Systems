import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "../layout/Sidebar.module.css";
import { LogOut, User, Info, PhoneCall, ChevronUp, ChevronDown } from "lucide-react";
import Swal from 'sweetalert2';

function Sidebar() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("role")?.toLowerCase();
  const userFullName = localStorage.getItem("fullName") || "Giảng viên";
  const [showUserMenu, setShowUserMenu] = useState(false);

  const teacherMenus = [
    { path: "/admin", label: "Trang chủ" },
    { path: "/admin/users", label: "Sinh viên" },
    { path: "/admin/submissions", label: "Bài nộp" },
    { path: "/admin/StudentProgress", label: "Tiến độ học tập" },
  ];

  const adminMenus = [
    { path: "/admin", label: "Trang chủ" },
    { path: "/admin/teachers", label: "Quản lý giáo viên" },
    { path: "/admin/logs", label: "Logs hệ thống" },
    { path: "/admin/maintenance", label: "Bảo trì hệ thống" },
    { path: "/admin/analytics", label: "Thống kê AI" },
  ];

  const menus = userRole === "admin" ? adminMenus : teacherMenus;

  // Hàm xử lý Logout
  const handleLogout = () => {
    Swal.fire({
      title: 'Xác nhận đăng xuất?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Ở lại'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        navigate("/admin/login");
      }
    });
  };

  return (
    <div className={styles.sidebarContainer}>
      <div className={styles.topSection}>
        <h2 className={styles.title}>
          {userRole === "admin" ? "Admin Panel" : "Teacher Panel"}
        </h2>

        <ul className={styles.menuList}>
          {menus.map((item) => (
            <li key={item.path} className={styles.menuItem}>
              <NavLink 
                to={item.path} 
                end={item.path === "/admin"}
                className={({ isActive }) => isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* PHẦN FOOTER: THÔNG TIN USER & LOGOUT */}
      <div className={styles.sidebarFooter}>
        <div className={styles.userSection} onClick={() => setShowUserMenu(!showUserMenu)}>
          <div className={styles.userAvatar}>
            {userFullName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{userFullName}</p>
            <p className={styles.userRoleText}>{userRole === 'admin' ? 'Quản trị viên' : 'Giảng viên'}</p>
          </div>
          {showUserMenu ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>

        {showUserMenu && (
          <div className={styles.userDropdown}>
            <div className={styles.dropdownItem} onClick={() => Swal.fire('Hệ thống Feedback', 'Phiên bản 2.0 - Hỗ trợ chấm bài bằng AI.', 'info')}>
              <Info size={16} /> <span>Giới thiệu hệ thống</span>
            </div>
            
            {userRole === 'teacher' && (
              <a href="mailto:admin@system.com" className={styles.dropdownItem}>
                <PhoneCall size={16} /> <span>Liên hệ Admin</span>
              </a>
            )}

            <hr className={styles.divider} />
            
            <div className={`${styles.dropdownItem} ${styles.logoutBtn}`} onClick={handleLogout}>
              <LogOut size={16} /> <span>Đăng xuất</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;