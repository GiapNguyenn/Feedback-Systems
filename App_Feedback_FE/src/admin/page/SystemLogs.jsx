import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from "../layout/Table.module.css"; 
import styleUser from "../layout/User.module.css"; 
import { 
  ShieldCheck, Clock, User, 
  AlertCircle, Info, AlertTriangle, ChevronLeft, ChevronRight, Filter 
} from 'lucide-react';

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 1. Thêm State để lưu mức độ lọc
  const [filterLevel, setFilterLevel] = useState(""); 
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPage: 1
  });

  const token = localStorage.getItem("token");

  // 2. Cập nhật hàm fetch: Truyền thêm tham số level vào URL
  const fetchLogs = async (page = 1, level = filterLevel) => {
    setLoading(true);
    try {
      // Gửi tham số ?level=... lên Backend
      const res = await axios.get(`http://localhost:5000/api/admin/system-logs?page=${page}&level=${level}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Lỗi lấy log:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  // 3. Hàm xử lý khi thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const selectedLevel = e.target.value;
    setFilterLevel(selectedLevel);
    // Khi lọc mới, luôn quay về trang 1
    fetchLogs(1, selectedLevel); 
  };

  const getLevelBadge = (level) => {
    const config = {
      'ERROR': { color: '#ef4444', bg: '#fef2f2', icon: <AlertCircle size={14}/> },
      'WARNING': { color: '#f59e0b', bg: '#fffbeb', icon: <AlertTriangle size={14}/> },
      'INFO': { color: '#3b82f6', bg: '#eff6ff', icon: <Info size={14}/> },
      'SUCCESS': { color: '#10b981', bg: '#ecfdf5', icon: <ShieldCheck size={14}/> }
    };
    const style = config[level] || config['INFO'];
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', backgroundColor: style.bg, color: style.color }}>
        {style.icon} {level}
      </span>
    );
  };

  return (
    <div className={styles.tableContainer}>
      {/* 4. Sửa Header để chứa thanh lọc */}
      <div className={styles.tableHeader} style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={28} color="#4f46e5" /> Nhật ký hệ thống
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '5px' }}>
            Theo dõi mọi hoạt động và thay đổi của người dùng trên hệ thống
          </p>
        </div>

        {/* Giao diện bộ lọc Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <Filter size={16} color="#64748b" />
          <select 
            value={filterLevel} 
            onChange={handleFilterChange}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer', color: '#1e293b' }}
          >
            <option value="">Tất cả mức độ</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
        </div>
      </div>

      <table className={styles.customTable}>
        {/* ... (Giữ nguyên thead và tbody như cũ) ... */}
        <thead>
          <tr>
            <th><div style={{display:'flex', alignItems:'center', gap:'8px'}}><Clock size={16}/> Thời gian</div></th>
            <th>Mức độ</th>
            <th>Hành động</th>
            <th>Chi tiết</th>
            <th><div style={{display:'flex', alignItems:'center', gap:'8px'}}><User size={16}/> Người thực hiện</div></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="5" style={{textAlign:'center', padding: '40px'}}>Đang tải nhật ký...</td></tr>
          ) : logs.map((log) => (
            <tr key={log.id}>
              <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
              <td>{getLevelBadge(log.level)}</td>
              <td style={{ fontWeight: '600', color: '#1e293b' }}>{log.action}</td>
              <td style={{ color: '#475569' }}>{log.description}</td>
              <td>{log.userName || "Hệ thống"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 5. Cập nhật phân trang: Truyền kèm filterLevel khi chuyển trang */}
      {pagination.totalPage > 1 && (
        <div className={styleUser.paginationContainer}>
          <button 
            disabled={pagination.currentPage <= 1}
            onClick={() => fetchLogs(pagination.currentPage - 1, filterLevel)}
            className={styleUser.pageBtn}
          >
            <ChevronLeft size={18} />
          </button>

          {[...Array(pagination.totalPage)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => fetchLogs(i + 1, filterLevel)}
              className={`${styleUser.pageBtn} ${pagination.currentPage === i + 1 ? styleUser.activePage : ''}`}
            >
              {i + 1}
            </button>
          ))}

          <button 
            disabled={pagination.currentPage >= pagination.totalPage}
            onClick={() => fetchLogs(pagination.currentPage + 1, filterLevel)}
            className={styleUser.pageBtn}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default SystemLogs;