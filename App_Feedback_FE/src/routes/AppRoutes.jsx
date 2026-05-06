import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AdminLayout from "../admin/layout/AdminLayout";
import ClientLayout from "../client/layout/ClientLayout"; 

// Pages
import AdminLogin from "../admin/page/AdminLogin";
import AdminProtected from "./AdminProtected";
import Dashboard from "../admin/page/Dashboard";
import Users from "../admin/page/Users";
import Submissions from "../admin/page/Submissions";
import StudentProgress from "../admin/page/StudentProgress";
import Teachers from "../admin/page/Teachers";
import SystemLogs from "../admin/page/SystemLogs";
import Maintenance from "../admin/page/Maintenance";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= ROUTE CHO CLIENT ================= */}
        <Route path="/" element={<ClientLayout />}>
          <Route index element={
            <div style={{ padding: '50px', textAlign: 'center' }}>
              <h1>Web Hệ Thống</h1>
              <p>Hệ thống bài tập</p>
            </div>
          } />
          {/* Giáp có thể thêm các trang như /about, /contact ở đây */}
        </Route>

        {/* ================= ROUTE CHO LOGIN ADMIN ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />

       <Route 
            path="/admin" 
            element={
              <AdminProtected>
                <AdminLayout />
              </AdminProtected>
            }
          >

            {/* DASHBOARD */}
            <Route index element={<Dashboard />} />

            {/* ================= TEACHER ================= */}

            <Route
              path="users"
              element={
                <AdminProtected requiredRole="teacher">
                  <Users />
                </AdminProtected>
              }
            />

            <Route
              path="submissions"
              element={
                <AdminProtected requiredRole="teacher">
                  <Submissions />
                </AdminProtected>
              }
            />

            <Route
              path="StudentProgress"
              element={
                <AdminProtected requiredRole="teacher">
                  <StudentProgress />
                </AdminProtected>
              }
            />

            {/* ================= ADMIN ================= */}

            <Route
              path="teachers"
              element={
                <AdminProtected requiredRole="admin">
                  <Teachers />
                </AdminProtected>
              }
            />

            <Route
              path="logs"
              element={
                <AdminProtected requiredRole="admin">
                  <SystemLogs />
                </AdminProtected>
              }
            />

            <Route
              path="maintenance"
              element={
                <AdminProtected requiredRole="admin">
                  <Maintenance />
                </AdminProtected>
              }
            />

          </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;