import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { AlertCircle, Ghost, CheckCircle, Send, ArrowLeft, Search, X } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Toast } from "../../helpers/toast";
import Swal from 'sweetalert2';
import styles from "../layout/StudentProgress.module.css"; 
import styleUser from "../layout/User.module.css"; 

const StudentProgress = () => {
  const [students, setStudents] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null); // Trạng thái lớp đang chọn
  const [searchTerm, setSearchTerm] = useState("");
  const [historyData, setHistoryData] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]); // Lưu danh sách ID các SV được chọn
  const [isSending, setIsSending] = useState(false);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");

  const token = localStorage.getItem("token");

  // 1. Load danh sách lớp khi vừa vào trang
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/classes/teacher/classes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeacherClasses(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách lớp:", err);
    }
  };

  // 2. Load dữ liệu rủi ro của sinh viên khi chọn 1 lớp
  const fetchRiskData = async (classId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/progress/risk-assessment?classId=${classId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.data || []);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu tiến độ:", err);
    }
  };

  const handleSelectClass = (cls) => {
    setSelectedClass(cls);
    fetchRiskData(cls.id);
  };
  const handleShowHistory = async (student) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:5000/api/progress/student-history/${student.Id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cập nhật dữ liệu vào state để Modal tự động hiện ra
      setHistoryData(res.data.data || []);
      setSelectedStudentName(student.fullName);
    } catch (err) {
      console.error("Lỗi lấy lịch sử sinh viên:", err);
    }
  };

  // Logic lọc sinh viên theo ô tìm kiếm
  // --- CHỈ GIỮ LẠI MỘT BIẾN filteredStudents DUY NHẤT Ở ĐÂY ---
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.studentCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = selectedRisk === "" || s.RiskLevel?.toLowerCase() === selectedRisk.toLowerCase();

    return matchesSearch && matchesRisk;
  });
  // Hàm chọn/bỏ chọn từng sinh viên
const toggleSelectStudent = (id) => {
  setSelectedStudentIds(prev => 
    prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
  );
};

// Hàm gửi thông báo hàng loạt
const handleSendBulkReminders = async () => {
  if (selectedStudentIds.length === 0)  return Toast.fire({
      icon: 'warning',
      title: 'Vui lòng chọn ít nhất một sinh viên!'
    });
  
  // Thay thế prompt bằng SweetAlert2 Input
  const { value: message } = await Swal.fire({
    title: 'Gửi thông báo nhắc nhở',
    input: 'textarea', // Dùng textarea để nhập được nhiều dòng
    inputLabel: `Gửi cho ${selectedStudentIds.length} sinh viên được chọn`,
    inputPlaceholder: 'Nhập nội dung thông báo tại đây...',
    showCancelButton: true,
    confirmButtonText: 'Gửi ngay',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#4f46e5', // Màu tím đồng bộ giao diện của bạn
    inputAttributes: {
      'aria-label': 'Type your message here'
    },
    // Kiểm tra nếu không nhập gì mà bấm gửi
    inputValidator: (value) => {
      if (!value) {
        return 'Bạn cần nhập nội dung thông báo!';
      }
    }
  });

 // Nếu người dùng nhập nội dung và bấm xác nhận
  if (message) {
    try {
      setIsSending(true);
      await axios.post("http://localhost:5000/api/progress/remind-bulk", {
        userIds: selectedStudentIds,
        message: message
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      Toast.fire({ 
        icon: 'success', 
        title: 'Đã gửi thông báo thành công!' 
      });
      
      setSelectedStudentIds([]); // Gửi xong reset checkbox
    } catch (err) {
      console.error("Lỗi gửi thông báo:", err);
      Toast.fire({ 
        icon: 'error', 
        title: 'Đã có lỗi xảy ra khi gửi thông báo!' 
      });
    } finally {
      setIsSending(false);
    }
  }
};
const getRiskConfig = (level) => {
  switch (level?.toLowerCase()) {
    case "high risk":
      return { text: "Rủi ro cao", className: styles.highrisk };
    case "stuck":
      return { text: "Đang bị kẹt", className: styles.stuck }; 
    case "normal":
      return { text: "Bình thường", className: styles.lowrisk };
    default:
      return { text: "Ổn định", className: styles.lowrisk };
  }
};
const handleViewCode = async (subId, fileName) => {
    setIsCodeLoading(true);
    try {
        // Gọi đúng URL của API getSubmissionCode
        const res = await axios.get(`${API_URL}/feedback/submission/${subId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.data.success) {
            setViewCode({
                // Giáp kiểm tra xem trong object data, cột nào chứa code (VD: data.sourceCode)
                content: res.data.data.sourceCode || res.data.data.Content, 
                fileName: fileName
            });
        }
    } catch (err) {
        Toast.fire({ icon: 'error', title: 'Không thể tải code!' });
    } finally {
        setIsCodeLoading(false);
    }
};

  return (
    <div className={styles.progressContainer}>
      
      {/* TRƯỜNG HỢP 1: CHƯA CHỌN LỚP - HIỆN DANH SÁCH CARD LỚP */}
      {!selectedClass ? (
        <div>
          <h1 className={styles.progressTitle}>📊 Chọn lớp để xem tiến độ</h1>
          <div className={styles.classGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {teacherClasses.map((cls) => (
              <div 
                key={cls.id} 
                className={styles.classCard} 
                onClick={() => handleSelectClass(cls)}
                style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', cursor: 'pointer', textAlign: 'center', transition: '0.3s' }}
              >
                <h3 style={{ color: '#4f46e5', margin: 0 }}>{cls.className}</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '10px' }}>Nhấn để xem phân tích rủi ro</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TRƯỜNG HỢP 2: ĐÃ CHỌN LỚP - HIỆN BẢNG CHI TIẾT */
        <div>
          <div className={styles.progressHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              
              <button className={styleUser.backBtn} onClick={() => setSelectedClass(null)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowLeft size={18} /> Quay lại
              </button>
              
              <h2 className={styles.progressTitle}>Lớp: {selectedClass.className}</h2>
            </div>
            <select 
              value={selectedRisk} 
              onChange={(e) => setSelectedRisk(e.target.value)}
              className={styles.riskSelect} // Gọi class từ file CSS
            >
              <option value="">Tất cả trạng thái</option>
              <option value="high risk">Rủi ro cao</option>
              <option value="stuck">Đang bị kẹt</option>
              <option value="normal">Bình thường</option>
            </select>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              {/* NÚT GỬI THÔNG BÁO HIỆN RA KHI CÓ CHỌN SINH VIÊN */}
              {selectedStudentIds.length > 0 && (
                <button 
                  onClick={handleSendBulkReminders}
                  disabled={isSending}
                  style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Send size={16} /> Gửi cho {selectedStudentIds.length} SV
                </button>
              )}
              
              
              <div className={styles.searchWrapper}>
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm MSSV hoặc Tên..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    {/* Checkbox chọn tất cả (nếu muốn) */}
                  </th>
                  <th>Sinh viên</th>
                  <th style={{ textAlign: 'center' }}>Lỗi hiện tại</th>
                  <th style={{ textAlign: 'center' }}>Lần nộp trước</th>
                  <th>Trạng thái rủi ro</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const risk = getRiskConfig(s.RiskLevel); // Gọi hàm chuyển đổi ở đây
                  
                  return (
                    <tr key={s.Id} className={styles.tableRow}>
                      {/* CỘT CHECKBOX */}
                      <td onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedStudentIds.includes(s.Id)}
                          onChange={() => toggleSelectStudent(s.Id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>

                      {/* CÁC CỘT DỮ LIỆU */}
                      <td onClick={() => handleShowHistory(s)}>
                        <div className={styles.studentName}>{s.fullName}</div>
                        <div className={styles.studentCode}>{s.studentCode}</div>
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={() => handleShowHistory(s)}>{s.CurrentErrors}</td>
                      <td style={{ textAlign: 'center' }} onClick={() => handleShowHistory(s)}>{s.PrevErrors}</td>
                      
                      {/* CỘT RỦI RO ĐÃ SỬA */}
                      <td onClick={() => handleShowHistory(s)}>
                        <div className={`${styles.riskBadge} ${risk.className}`}>
                          {risk.text}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* MODAL BIỂU ĐỒ */}
      {historyData && (
        <div className={styles.modalOverlay} onClick={() => setHistoryData(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📈 Tiến độ: {selectedStudentName}</h2>
              <button className={styles.modalClose} onClick={() => setHistoryData(null)}>
                <X size={20} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                {/* Trong StudentProgress.jsx */}
                <XAxis 
                  dataKey="CreatedAt" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('vi-VN')} 
                  fontSize={12}
                  stroke="#64748b"
                />
                <YAxis />
                <Tooltip 
                    // 1. Dòng tiêu đề của Tooltip (Hiện ngày nộp bài)
                    labelFormatter={(label) => `📅 Ngày nộp: ${new Date(label).toLocaleDateString('vi-VN')}`}
                    
                    // 2. Nội dung chi tiết bên trong
                    formatter={(value, name, props) => {
                      // Làm tròn số lỗi
                      const formattedValue = Number.isInteger(value) ? value : value.toFixed(1);

                      // props.payload chứa toàn bộ dữ liệu của điểm đó (bao gồm cả FileName)
                      const fileName = props.payload.FileName;

                      if (name === "Lỗi cá nhân") {
                        return [
                          <div key="custom-tooltip">
                            <div style={{ color: '#6366f1', fontWeight: 'bold' }}>{formattedValue} lỗi</div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                              📂 File: {fileName}
                            </div>
                          </div>,
                          name
                        ];
                      }
                      
                      // Đối với đường "Trung bình lớp" thì chỉ hiện số lỗi thôi
                      return [`${formattedValue} lỗi`, name];
                    }}

                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                  />
                <Legend />
                <Line name="Lỗi cá nhân" type="monotone" dataKey="ErrorCount" stroke="#6366f1" strokeWidth={4} dot={{ r: 6 }} />
                <Line name="Trung bình lớp" type="monotone" dataKey="ClassAvg" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProgress;