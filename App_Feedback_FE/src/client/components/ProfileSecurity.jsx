import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Mail, ArrowLeft, Loader2, User } from 'lucide-react';

const ProfileSecurity = ({ user, onBack, onSuccess, onLogout }) => {
    const [view, setView] = useState('INFO'); // INFO | CHANGE_PASSWORD | CHANGE_EMAIL
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({ 
        currentPassword: '', 
        newValue: '', 
        emailConfirm: '', 
        otp: '' 
    });

    const token = localStorage.getItem("token");

    // Hàm hiện thông báo nội bộ
    const showNotice = (text, type = 'error') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    // Bước 1: Yêu cầu OTP
    const handleRequestOTP = async (targetType) => {
        if (!formData.currentPassword) return showNotice('Vui lòng nhập mật khẩu hiện tại');
        if (targetType === 'CHANGE_EMAIL' && !formData.emailConfirm) return showNotice('Vui lòng nhập Email mới');
        
        setLoading(true);
        try {
            await axios.post("http://localhost:5000/api/otp/request", {
                type: targetType,
                currentPassword: formData.currentPassword,
                newEmail: targetType === 'CHANGE_EMAIL' ? formData.emailConfirm : null
            }, { headers: { Authorization: `Bearer ${token}` } });

            setStep(2);
            showNotice('Mã OTP đã gửi về Gmail của bạn!', 'success');
        } catch (err) {
            showNotice(err.response?.data?.message || 'Lỗi gửi yêu cầu');
        } finally { setLoading(false); }
    };

    // Bước 2: Xác thực OTP và Cập nhật
    const handleVerify = async () => {
        if (!formData.otp) return showNotice('Vui lòng nhập mã OTP');
        
        setLoading(true);
        try {
            await axios.post("http://localhost:5000/api/otp/verify", {
                otp: formData.otp,
                newValue: view === 'CHANGE_EMAIL' ? formData.emailConfirm : formData.newValue
            }, { headers: { Authorization: `Bearer ${token}` } });

            showNotice('Cập nhật thành công! Đang đăng xuất...', 'success');

            //Đợi 2s cho người dùng thấy thông báo rồi mới Logout
            setTimeout(() => {
                if (onLogout) {
                    onLogout(); 
                } else {
                    localStorage.clear();
                    window.location.href = "/";
                }
            }, 2000);

        } catch (err) {
            showNotice(err.response?.data?.message || 'Mã OTP không chính xác');
        } finally { setLoading(false); }
    };
    
    return (
        <div className="menu-content fade-in">
            {/* Header động theo view */}
            <div className="submenu-header" onClick={view === 'INFO' ? onBack : () => {setView('INFO'); setStep(1);}}>
                <ArrowLeft size={18} /> 
                <span>{view === 'INFO' ? 'Trang cá nhân' : 'Xác thực bảo mật'}</span>
            </div>
            <hr />

            {/* Vùng hiển thị thông báo nội bộ */}
            {message.text && (
                <div className={`status-msg ${message.type}`} style={{
                    margin: '10px 15px', padding: '10px', borderRadius: '8px', fontSize: '12px', textAlign: 'center',
                    backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ padding: '0 15px 15px 15px' }}>
                {view === 'INFO' ? (
                    /* Giao diện xem thông tin */
                    <div className="profile-display fade-in">
                        <div className="user-card-large" style={{textAlign: 'center', padding: '20px 0'}}>
                            <div className="avatar-big" style={{width: '60px', height: '60px', borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '24px', fontWeight: 'bold'}}>
                                {user?.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <h4 style={{margin: '5px 0'}}>{user?.fullName}</h4>
                            <p style={{fontSize: '13px', color: '#64748b'}}>{user?.email}</p>
                        </div>
                        <div className="security-actions" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            <button className="btn-outline" onClick={() => setView('CHANGE_PASSWORD')}><Lock size={14} /> Đổi mật khẩu</button>
                            <button className="btn-outline" onClick={() => setView('CHANGE_EMAIL')}><Mail size={14} /> Đổi Gmail</button>
                        </div>
                    </div>
                ) : (
                    /* Giao diện Đổi Pass / Email */
                    <div className="otp-section fade-in" style={{marginTop: '15px'}}>
                        {step === 1 ? (
                            <div className="step-1">
                                <label style={{fontSize: '12px', color: '#666'}}>Mật khẩu hiện tại</label>
                                <input type="password" className="form-input" placeholder="Xác nhận mật khẩu cũ" onChange={e => setFormData({...formData, currentPassword: e.target.value})} />
                                
                                {view === 'CHANGE_EMAIL' && (
                                    <>
                                        <label style={{fontSize: '12px', color: '#666', marginTop: '10px', display: 'block'}}>Email mới</label>
                                        <input className="form-input" placeholder="Nhập email mới..." onChange={e => setFormData({...formData, emailConfirm: e.target.value})} />
                                    </>
                                )}
                                
                                <button className="btn-confirm" style={{marginTop: '15px'}} onClick={() => handleRequestOTP(view)} disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : "Gửi mã xác thực"}
                                </button>
                            </div>
                        ) : (
                            <div className="step-2">
                                <input className="form-input" placeholder="Mã OTP 6 số" onChange={e => setFormData({...formData, otp: e.target.value})} />
                                
                                {view === 'CHANGE_PASSWORD' && (
                                    <input className="form-input" type="password" placeholder="Mật khẩu mới" style={{marginTop: '10px'}} onChange={e => setFormData({...formData, newValue: e.target.value})} />
                                )}
                                
                                <button className="btn-confirm" style={{marginTop: '15px'}} onClick={handleVerify} disabled={loading}>
                                    {loading ? "Đang xử lý..." : "Xác nhận cập nhật"}
                                </button>
                                <p style={{textAlign: 'center', fontSize: '12px', color: '#6366f1', marginTop: '10px', cursor: 'pointer'}} onClick={() => setStep(1)}>Quay lại bước 1</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileSecurity;