import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AiFeedbackModal from './AiFeedbackModal';
import LoginView from './LoginView';
import  { Toaster, toast } from 'react-hot-toast'
import { Pin, Trash2, MessageSquare, Plus, LogOut, Search } from 'lucide-react';
import SubmissionDashboard from './SubmissionDashboard';
import '../layout/FloatingFeedback.css';

const FloatingFeedback = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [loading, setLoading] = useState(false); // ĐÃ FIX: Thêm state loading ở đây
  const [isMaximized, setIsMaximized] = useState(false);
  // State để quản lý việc hiện bảng hỏi "Có muốn phân tích không?"
const [showAnalyzeConfirm, setShowAnalyzeConfirm] = useState(false);
// Lưu ID bài nộp vừa tạo để dùng cho việc phân tích sau đó
const [pendingSubId, setPendingSubId] = useState(null);
// State cho thông báo thuần túy (Success/Error)
const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
const [notifications, setNotifications] = useState([]);
const [isMaintenance, setIsMaintenance] = useState(false);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };
const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'default');

// Hàm này Giáp sẽ truyền xuống SubmissionDashboard hoặc UserSetting để bấm nút đổi
const toggleTheme = () => {
  const newTheme = theme === 'default' ? 'anime' : 'default';
  setTheme(newTheme);
  localStorage.setItem('app-theme', newTheme);
};
const reloadSystem = async () => {

    const token = localStorage.getItem('token');

    if (!token) return;

    try {

        setCurrentAnalysis(null);

        await fetchSubmissions(token);

        await fetchNotifications();


    } catch (err) {
        console.log(err);
    }
};
useEffect(() => {
    const initAuth = async () => {
        try {
            const maintenanceRes = await axios.get('http://localhost:5000/api/admin/setting/maintenance-status');
            const systemInMaintenance = maintenanceRes.data.status;
            setIsMaintenance(systemInMaintenance);

            const savedUser = localStorage.getItem('user');
            const savedToken = localStorage.getItem('token');

            if (savedUser && savedToken) {
                const userObj = JSON.parse(savedUser);
                setUser(userObj);

                // Nếu Backend trả về status: false (hết bảo trì), code sẽ chạy xuống đây
                if (systemInMaintenance && userObj.role !== 'admin') return;

                setView('dashboard');
                await fetchSubmissions(savedToken);
            }
        } catch (err) {
            // CHỈ hiện bảo trì nếu lỗi là 503
            if (err.response?.status === 503) {
                setIsMaintenance(true);
            } else if (err.response?.status === 401) {
                // Nếu 401 thì kệ nó, cho người dùng ở màn hình Landing để họ Login
                setIsMaintenance(false); 
                setView('landing');
            }
        }
    };
    initAuth();
}, []);

const fetchSubmissions = async (token) => {
    try {
        const res = await axios.get(`http://localhost:5000/api/submissions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSubmissions(res.data.data || []);
    } catch (e) {
        // Bắt lỗi 503 ở đây để ép hiện màn hình bảo trì
        if (e.response?.status === 503) {
            setIsMaintenance(true);
        } else {
            console.error("Lỗi fetch:", e);
        }
    }
};

const handleFileUpload = async (assignmentId, file) => {
  const token = localStorage.getItem('token');
  if (loading) return; 

  const config = { 
    headers: { 
      Authorization: `Bearer ${token}`, 
      'Content-Type': 'multipart/form-data' 
    } 
  };

  try {
    setLoading(true);
    setStatusMsg({ text: 'Đang gửi bài và kiểm tra bảo mật...', type: 'info' });

    const formData = new FormData();
    formData.append('file', file);
    
    // Bước 1: Upload file
    const uploadRes = await axios.post('http://localhost:5000/api/submissions/upload', formData, config);
    const newSubId = uploadRes.data.submissionId;

    if (newSubId) {
      setStatusMsg({ text: 'Tải lên thành công! AI đang phân tích bài của bạn...', type: 'info' });
      
      // Bước 2: Gọi AI phân tích
      const analysisResult = await handleAnalyzeExisting(newSubId);
      
      // Bước 3: Cập nhật state cục bộ
      setCurrentAnalysis(analysisResult); 
      
      setStatusMsg({ text: 'Phân tích hoàn tất!', type: 'success' });
      await fetchSubmissions(token); 

      // Trả về kết quả phân tích để Dashboard xử lý nhảy Tab
      return analysisResult; 
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Lỗi: File quá lớn (>2MB) hoặc sai định dạng!";
    setStatusMsg({ text: errorMsg, type: 'error' });
    if (error.response?.status === 429) {
       Swal.fire('Thông báo', errorMsg, 'warning');
    }
    return null; // Trả về null nếu lỗi
  } finally {
    setLoading(false);
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 5000);
  }
};

const handleAnalyzeExisting = async (submissionId) => {
    if (!submissionId) return;
    setIsAnalyzing(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
        // 1. Gọi API phân tích - Nhận luôn kết quả trả về từ Backend (res.data)
        const res = await axios.post(
            `http://localhost:5000/api/submissions/${submissionId}/analyze`, 
            {}, 
            config
        );

        // 2. Kiểm tra nếu Backend trả về success và có issues (lỗi)
        if (res.data && res.data.success) {
                    // Đảm bảo object này có đủ thông tin như một "history item"
                    const fullData = {
                        ...res.data,
                        id: submissionId, // Gán ID để Sidebar biết đang chọn bài nào
                    };
                    setCurrentAnalysis(fullData); 
                    return fullData;
                }
    
    } catch (error) {
        console.error("Lỗi phân tích:", error);
        // Lưu ý: Dùng toast.error nếu bạn dùng react-hot-toast
        toast.error("Lỗi: " + (error.response?.data?.message || "Không thể phân tích"));
    } finally {
        setIsAnalyzing(false);
    }
};

const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await axios.get('http://localhost:5000/api/feedback/notifications', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
            setNotifications(res.data.data);
        }
    } catch (err) {
        console.log("Lỗi lấy thông báo:", err);
    }
};
const handleNotificationClick = async (noti, setPreview) => {
    const token = localStorage.getItem('token');

    try {
        // TRƯỜNG HỢP 1: THÔNG BÁO CÓ BÀI TẬP (Cần lấy thêm chi tiết feedback)
        if (noti.SubmissionId) {
            const res = await axios.get(
                `http://localhost:5000/api/submissions/${noti.SubmissionId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                const data = res.data.data;
                setPreview({
                    ...noti,
                    comment: data.TeacherComment,
                    strengths: data.Strengths,
                    weakness: data.WeaknessAnalysis,
                    aiDraft: data.AIDraft
                });
            }
        } 
        // TRƯỜNG HỢP 2: THÔNG BÁO NHẮC NHỞ (Không có bài tập)
        else {
            // Vẫn setPreview để hiện Popup, chỉ hiện Title và Message
            setPreview({
                ...noti,
                comment: null, // Không có nhận xét
                strengths: null,
                weakness: null
            });
        }

        // --- ĐOẠN DƯỚI NÀY DÙNG CHUNG CHO CẢ 2 LOẠI: ĐÁNH DẤU ĐÃ ĐỌC ---
        await axios.put(
            `http://localhost:5000/api/feedback/notifications/${noti.Id}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );

        fetchNotifications();

    } catch (err) {
        console.log("Lỗi xử lý thông báo:", err);
    }
};
return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="floating-button" onClick={() => setIsOpen(!isOpen)}>
        <span style={{ fontSize: '28px', color: 'white' }}>{isOpen ? '✕' : '💬'}</span>
      </div>

      {isOpen && (
        <AiFeedbackModal
          onClose={() => setIsOpen(false)}
          currentAnalysis={currentAnalysis}
          view={view}
          submissions={submissions}
          onConfirmSync={handleAnalyzeExisting}
          isAnalyzing={isAnalyzing}
          showSuccessToast={showSuccessToast}
          className={theme === 'anime' ? 'anime-modal' : ''}
          title={view === 'dashboard' ? `SV: ${user?.fullName || user?.username}` : "Hệ thống Feedback"}
          notifications={notifications}
          fetchNotifications={fetchNotifications}
          onNotificationClick={handleNotificationClick}
          onReloadSystem={reloadSystem}
        >
          <div className={`theme-wrapper ${theme}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            
            {/* NẾU BẢO TRÌ: Hiện đè lên tất cả */}
            {isMaintenance && user?.role !== 'admin' ? (
              <div className="maintenance-overlay" style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: 'white', zIndex: 9999, display: 'flex', 
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ fontSize: '50px' }}>🛠️</div>
                <h3 style={{ marginTop: '10px' }}>Hệ thống đang bảo trì</h3>
                <p style={{ padding: '0 20px', color: '#666' }}>Vui lòng quay lại sau ít phút.</p>
                <button className="btn-primary" onClick={() => window.location.reload()}>Tải lại</button>
              </div>
            ) : (
              /* --- KẾT THÚC PHẦN BẢO TRÌ - BÊN DƯỚI LÀ NỘI DUNG CŨ --- */
              <>
                {statusMsg.text && (
                  <div className={`status-toast ${statusMsg.type}`}>
                    <div className="toast-content">
                      {statusMsg.type === 'info' && <span className="spinner">🌀</span>}
                      {statusMsg.type === 'error' && <span>❌ </span>}
                      {statusMsg.type === 'success' && <span>✅ </span>}
                      {statusMsg.text}
                    </div>
                  </div>
                )}

                {view === 'dashboard' && (
                  <SubmissionDashboard
                    user={user}
                    submissions={submissions}
                    onLogout={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      setStatusMsg({ text: '', type: '' });
                      setView('landing');
                      setUser(null);
                      setSubmissions([]);
                      setCurrentAnalysis(null);
                    }}
                    currentAnalysis={currentAnalysis}
                    setCurrentAnalysis={setCurrentAnalysis}
                    onAnalyze={handleAnalyzeExisting}
                    onUpload={handleFileUpload}
                    loading={loading}
                    fetchSubmissions={() => fetchSubmissions(localStorage.getItem('token'))}
                    currentTheme={theme}
                    onToggleTheme={toggleTheme}
                  />
                )}

                {view === 'landing' && (
                  <div className="landing-container fade-in">
                    <div className="landing-content">
                      <div className="landing-bg-circle"></div>
                      <h2 className="landing-title">Chào mừng bạn!</h2>
                      <p className="landing-subtitle">Hệ thống Feedback</p>
                      <button
                        className="btn-primary-large pulse-button"
                        onClick={() => setView('login')}
                      >
                        Đăng nhập
                      </button>
                      <div className="landing-footer">
                        <span>© 2026 Feedback System • </span>
                      </div>
                    </div>
                  </div>
                )}

                {view === 'login' && (
                  <LoginView
                    onLoginSuccess={(data) => {
                      const { token, user: userProfile } = data;
                      setUser(userProfile);
                      localStorage.setItem('user', JSON.stringify(userProfile));
                      localStorage.setItem('token', token);
                      fetchSubmissions(token);
                      fetchNotifications();
                      setView('dashboard');
                    }}
                    onLogout={() => {
                      localStorage.clear();
                      setStatusMsg({ text: '', type: '' });
                      setView('landing');
                      setUser(null);
                      setSubmissions([]);
                      setNotifications([]);
                      setCurrentAnalysis(null);
                    }}
                    onBack={() => setView('landing')}
                  />
                )}
              </>
            )}
          </div>
        </AiFeedbackModal>
      )}
    </>
  );
};

export default FloatingFeedback;