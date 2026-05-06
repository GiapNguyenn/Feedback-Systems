import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Pin, Trash2, MessageSquare, Sparkle } from 'lucide-react';
import { useNotify } from '../../hooks/useNotify';
import UserSetting from '../components/UserSetting';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import moment from 'moment';
import '../layout/SubmissionDashboard.css';

const SubmissionDashboard = ({ user, submissions, onLogout, currentAnalysis, setCurrentAnalysis, onAnalyze, onUpload ,fetchSubmissions, currentTheme,   // 👈 THÊM DÒNG NÀY
  onToggleTheme }) => {
  const [activeTab, setActiveTab] = useState('list');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetAssignmentId, setTargetAssignmentId] = useState('');
  const [loading, setLoading] = useState(false); // Đã có state loading
  const { notifySuccess, notifyError, confirmAction } = useNotify();
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Tự động cuộn xuống
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);
  

  // Kết quả phân tích mới
useEffect(() => {
  if (currentAnalysis && currentAnalysis.issues) {
    setActiveTab('chat'); 
  }
}, [currentAnalysis]);


  const handleSendMessage = async () => {
  // Kiểm tra kỹ ID trước khi gửi
  if (!chatInput.trim() || !currentAnalysis?.analysisId) {
    console.error("Thiếu nội dung chat hoặc Analysis ID");
    return;
  }

  const userMsg = {
    sender: 'user',
    text: chatInput,
    time: moment().format('HH:mm')
  };

  setMessages(prev => [...prev, userMsg]);
  const currentInput = chatInput;
  setChatInput('');
  setIsTyping(true);

  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      `http://localhost:5000/api/analysis/${currentAnalysis.analysisId}/chat`, 
      { question: currentInput }, // ĐẢM BẢO DÙNG 'question' VÌ BACKEND ĐANG ĐỢI KEY NÀY
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const aiReply = {
      sender: 'ai',
      text: res.data.answer, 
      time: moment().format('HH:mm')
    };
    setMessages(prev => [...prev, aiReply]);
  } catch (err) {
    console.error("Lỗi chat chi tiết:", err.response?.data || err.message);
    notifyError("AI gặp sự cố khi trả lời, vui lòng thử lại!");
  } finally {
    setIsTyping(false);
  }
};


const handleSelectHistory = async (submissionId) => {
  if (!submissionId) return;

  // TẠO BIẾN CỜ HIỆU TRONG PHẠM VI HÀM
  let isCancelled = false;

  // Dọn sạch ngay lập tức để user thấy đang load bài mới
  setMessages([]);
  setCurrentAnalysis(null);
  setIsTyping(true);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  try {
    const resAnalysis = await axios.get(`http://localhost:5000/api/analysis/history/${submissionId}`, config);
    // Nếu trong lúc chờ API mà user đã click bài khác, dừng lại luôn
    if (isCancelled) return; 

    if (resAnalysis.data) {
      const analysisData = resAnalysis.data;
      const resChat = await axios.get(`http://localhost:5000/api/analysis/${analysisData.analysisId}/chat`, config);
      
      if (isCancelled) return; // Kiểm tra lại lần nữa sau API chat
      const rawHistory = resChat.data.chatHistory || resChat.data;
      setCurrentAnalysis(analysisData);

       let formatted = [];

      if (Array.isArray(rawHistory) && rawHistory.length > 0) {

        const chatMessages = rawHistory.map((msg) => ({
          sender: msg.role === 'ai' ? 'ai' : 'user',
          text: msg.message,
          issues: null,
          time: moment.utc(msg.createdAt).format('HH:mm')
        }));

        formatted = [
          {
            sender: 'ai',
            text: `Kết quả phân tích cho bài: **${analysisData.assignmentTitle}**`,
            issues: analysisData.issues || [],
            time: ''
          },
          ...chatMessages
        ];

      } else {
        formatted = [{
          sender: 'ai',
          text: `Kết quả phân tích cho bài: **${analysisData.assignmentTitle}**`,
          issues: analysisData.issues || [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      }

      setMessages(formatted);
    }
  } catch (err) {
    console.error("Lỗi load bài:", err);
  } finally {
    if (!isCancelled) setIsTyping(false);
  }

  // Hàm dọn dẹp (Nếu cần dùng trong useEffect)
  return () => { isCancelled = true; };
};


const handleDelete = async (subId) => {
    const isConfirmed = await confirmAction(
      'Xác nhận xoá?', 
      'Toàn bộ lịch sử phân tích và chat của bài này sẽ bị mất!',
      'Xoá ngay'
    );

    if (!isConfirmed) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/submissions/${subId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      notifySuccess("Đã xoá bài nộp thành công");
      
      // 1. Cập nhật lại danh sách sidebar
      await fetchSubmissions(); 

      // 2. TỰ ĐỘNG QUAY VỀ MÀN HÌNH NỘP BÀI MỚI
        setCurrentAnalysis(null); // Tắt màn hình chat của bài vừa xóa
        setActiveTab('list');
      
      // 3. Nếu bạn đang lưu bài hiện tại trong state (ví dụ currentAnalysis), hãy reset nó
      if (typeof setCurrentAnalysis === 'function') {
          setCurrentAnalysis(null);
      }

    } catch (err) {
      notifyError("Lỗi khi xoá dữ liệu");
    }
};

  // --- HÀM GHIM MỚI ---
  const handlePin = async (subId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`http://localhost:5000/api/submissions/${subId}/pin`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      notifySuccess("Đã cập nhật trạng thái ghim");
      fetchSubmissions(); 
    } catch (err) {
      notifyError("Không thể ghim bài nộp");
    }
  };
const handleViewCode = async (id) => {
    if (!id) return notifyError("ID bài nộp không hợp lệ!");
    
    setLoading(true);
    try {
        const response = await fetch(`http://localhost:5000/api/submissions/code/${id}`);
        const result = await response.json();
        if (result.success) {
            
            let lang = result.language ? result.language.toLowerCase() : "javascript";
            
            if (lang.includes("c#") || lang.includes("cs")) {
                lang = "csharp"; 
            } else if (lang.includes("py")) {
                lang = "python";
            }
          
            setSelectedSubmission({
                Id: id,
                Code: result.code,        
                FileName: result.fileName, 
                Language: lang
            });
        } else {
            notifyError(result.message);
        }
    } catch (error) {
        notifyError("Lỗi kết nối server");
    } finally {
        setLoading(false);
    }
};
  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          {/* Nếu bạn có dùng Lucide-React thì thêm icon MessageSquare hoặc Sparkles */}
          <Sparkle size={20} color="#6366f1" style={{marginRight: '5px'}} />
          <h4>FeedBack</h4>
        </div>
        <button 
          onClick={() => {
            setActiveTab('list');
            setCurrentAnalysis(null); // Đảm bảo đóng bài đang xem để hiện chỗ nộp mới
          }} 
          className="new-chat-btn"
        >
          + Bài nộp mới
        </button>
        
        <div className="history-items">
          {submissions && submissions.map((sub, idx) => (
            <div 
                key={sub.id || idx} 
                className={`history-link-container ${
                  (currentAnalysis?.submissionId === sub.id || currentAnalysis?.id === sub.id) ? 'active' : ''
                }`}
              >
              {/* Click vào vùng này để xem lịch sử */}
              <div className="history-main-content" onClick={() => handleSelectHistory(sub.id)}>
                <span className="icon">
                  <MessageSquare size={16} />
                </span>
                <div className="history-info">
                  <p className="file-name">{sub.FileName || "Bài nộp"}</p>
                  <small>{sub.Language}</small>
                </div>
              </div>

              {/* Cụm nút chức năng hiện lên khi hover */}
              <div className="history-actions">
                <button 
                  className={`btn-action-pin ${sub.IsPinned ? 'pinned' : ''}`} 
                  onClick={(e) => {
                    e.stopPropagation(); // Không cho nhảy vào handleSelectHistory
                    handlePin(sub.id);
                  }}
                  title={sub.IsPinned ? "Bỏ ghim" : "Ghim"}
                >
                  <Pin size={14} fill={sub.IsPinned ? "currentColor" : "none"} />
                </button>
                
                <button 
                  className="btn-action-delete" 
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleDelete(sub.id);
                  }}
                  title="Xoá bài nộp"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <UserSetting user={user} onLogout={onLogout} onToggleTheme={onToggleTheme} currentTheme={currentTheme}/>
      </aside>

      {/* MAIN CONTENT */}
      <main className="dashboard-main">
        
        {activeTab === 'list' ? (
          <div className="list-view-container">
            <h3>Danh sách tệp hiện có</h3>
            
            {/* --- VÙNG CUỘN DANH SÁCH --- */}
          <div className="container-fluid" style={{ height: '100%' }}>
              <div className="row" style={{ height: '100%' }}>
                
                {/* BÊN TRÁI: DANH SÁCH TỆP (Vùng cuộn) */}
                  <div 
                    className="submissions-scroll-area" 
                    style={{ 
                      maxHeight: 'calc(100vh - 350px)', 
                      overflowY: 'auto',
                      overflowX: 'hidden' 
                    }}
                  >
                    <div className="submissions-grid">
                      {submissions.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={`submission-card-modern ${selectedSubmission?.Id === (item.Id || item.id) ? 'active' : ''}`}
                          onClick={() => handleViewCode(item.Id || item.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="card-body">
                            <h5>{item.FileName}</h5>
                            <small>{item.Language}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
              </div>
            </div>

            {/* --- KHỐI UPLOAD (CỐ ĐỊNH Ở DƯỚI) --- */}
            <div className="upload-section-modern">
              <div className="upload-controls">
                <input 
                  type="file" 
                  id="file-upload" 
                  style={{ display: 'none' }} 
                  onChange={(e) => setSelectedFile(e.target.files[0])} 
                />
                
                <label htmlFor="file-upload" className="btn-choose-file">
                  {selectedFile ? ` ${selectedFile.name}` : " Chọn file "}
                </label>

                <button 
                  className="btn-submit-now"
                  disabled={!selectedFile || loading}
                  onClick={async () => {
                    // Gọi hàm upload từ cha (FloatingFeedback) truyền xuống
                    const result = await onUpload(null, selectedFile); 
                    
                    if (result && result.issues) {
                      // 1. Lưu dữ liệu phân tích
                      setCurrentAnalysis(result); 

                      // 2. Ép nhảy sang Tab Chat
                      setActiveTab('chat');

                      // 3. Hiển thị tin nhắn AI kèm danh sách lỗi ngay lập tức
                      setMessages([{
                        sender: 'ai',
                        text: `Kết quả phân tích cho bài: **${selectedFile.name}**`,
                        issues: result.issues, // Đổ danh sách lỗi vào đây
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }]);

                      setSelectedFile(null);
                    }
                  }}
                >
                  {loading ? "Đang xử lý..." : "Phân tích"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* --- VIEW CHAT AI --- */
          <div className="chat-ai-container" key={currentAnalysis?.analysisId || 'loading'} >
            <div className="chat-header-info">
              <strong>AI Assistant : </strong>
              <small>Đang xem: {currentAnalysis?.assignmentTitle || "Đang tải..."}</small>
            </div>

            <div className="chat-messages-area" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.sender}`}>
                  <div className="message-bubble">
                    {msg.sender === 'ai' ? (
                      <div className="markdown-content">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="msg-text">{msg.text}</p>
                    )}

                    {msg.issues && Array.isArray(msg.issues) && msg.issues.length > 0 && (
                  <div className="issues-analysis-card">
                    <p className="card-tag">Gợi ý chi tiết</p>
                    {msg.issues.map((issue, idx) => (
                      <div key={idx} className="issue-item">
                        {/* 1. Sửa LineNumber thành line hoặc lineNumber */}
                        <div className="line-number" style={{ color: '#ef4444', fontWeight: 'bold', marginBottom: '4px' }}>
                          Dòng {issue.line ?? issue.LineNumber ?? 0}
                        </div>
                        
                        {/* 2. Sửa Message thành message */}
                        <p className="error-text" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                          <b>❌ Lỗi:</b> {issue.message ?? issue.Message ?? "Không xác định được lỗi"}
                        </p>

                        <div className="suggestion-box">
                          <div className="fix-content">
                            <span style={{ fontSize: '14px' }}>💡 <b>Gợi ý:</b></span>
                            
                            {/* 3. Sửa Suggestion thành suggestion */}
                            {(issue.suggestion || issue.Suggestion)?.split('->').map((part, pIdx, arr) => {
                              const text = part.trim();
                              const isExplanation = pIdx === 1 && arr.length === 3; 

                              return (
                                <React.Fragment key={pIdx}>
                                  {isExplanation ? (
                                    <span className="explain-text">{text}</span>
                                  ) : (
                                    <code className="code-highlight">{text}</code>
                                  )}
                                  {pIdx < arr.length - 1 && <span className="arrow-sep"> ➜ </span>}
                                </React.Fragment>
                              );
                            }) || "Hãy kiểm tra lại đoạn code này"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                  <span className="msg-time">
                    {msg.time} 
                  </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="message-row ai">
                  <div className="message-bubble typing">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    AI đang suy nghĩ...
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-sticky">
              <div className="input-group-messenger">
                <input 
                      value={chatInput || ""} 
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Hỏi AI thêm về lỗi này..." 
                    />
                <button className="btn-send-msg" onClick={handleSendMessage}>➤</button>
              </div>
            </div>
          </div> // Đóng chat-ai-container
        )}
        {selectedSubmission && (
          <div className="code-viewer-overlay" onClick={() => setSelectedSubmission(null)}>
            {/* onClick ở trên để click ra ngoài là đóng modal */}
            
            <div className="code-viewer-modal" onClick={(e) => e.stopPropagation()}>
              {/* e.stopPropagation để click bên trong modal không bị đóng */}
              
              <div className="modal-header">
                <h4 style={{ margin: 0 }}>📄 {selectedSubmission.FileName}</h4>
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  style={{ background: '#ff5f56', border: 'none', color: 'white', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                <SyntaxHighlighter 
                  language={selectedSubmission.Language?.toLowerCase() || 'javascript'} 
                  style={atomDark}
                  showLineNumbers={true}
                  customStyle={{ margin: 0, height: '100%' }}
                >
                  {selectedSubmission.Code}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SubmissionDashboard;