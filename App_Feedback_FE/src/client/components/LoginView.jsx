import React, { useState, useEffect } from 'react';
import '../layout/LoginView.css';
import axios from '../../axiosConfig';
import toast, { Toaster } from 'react-hot-toast';
// Import Loader
import { tailChase } from 'ldrs';

if (typeof window !== 'undefined') {
  tailChase.register(); 
}

const LoginView = ({ onLoginSuccess, onBack ,onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('login');
  
  const [form, setForm] = useState({
    email: localStorage.getItem('saved_email') || '',
    password: localStorage.getItem('saved_password') || '',
    remember: !!localStorage.getItem('saved_email'),
    otp: '',
    newPassword: ''
  });

  // Tự động điền lại nếu có dữ liệu lưu
  useEffect(() => {
    const email = localStorage.getItem('saved_email');
    const pass = localStorage.getItem('saved_password');
    if (email && pass) {
      setForm(prev => ({ ...prev, email, password: pass, remember: true }));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 💡 Trước khi login mới, dọn dẹp sạch rác cũ
      const rememberEmail = localStorage.getItem('saved_email');
      const rememberPass = localStorage.getItem('saved_password');
      localStorage.clear(); 

      const res = await axios.post('/users/login', {
        email: form.email,
        password: form.password
      });

      // Lưu lại nếu có tick "Nhớ thông tin"
      if (form.remember) {
        localStorage.setItem('saved_email', form.email);
        localStorage.setItem('saved_password', form.password);
      }

      // Gọi hàm thành công để chuyển trang
      onLoginSuccess(res.data, res.data.user.studentCode);
      
    } catch (err) {
      toast.error("Sai tài khoản hoặc mật khẩu");
    } finally {
      setLoading(false);
    }
  };
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/users/forgot-password', { email: form.email });
      toast.success("Mã OTP đã được gửi vào Email của bạn");
      setViewMode('forgot_step2'); // Chuyển sang form nhập OTP và Pass mới
    } catch (err) {
      toast.error(err.response?.data?.message || "Email không tồn tại");
    } finally {
      setLoading(false);
    }
  };

 const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await axios.post('/users/reset-password', {
            email: form.email,
            otp: form.otp,
            newPassword: form.newPassword
        });

        toast.success("Đặt lại mật khẩu thành công!");

        //  CHỈ CẦN GỌI HÀM NÀY:
        if (onLogout) {
            onLogout(); 
        }

    } catch (err) {
        toast.error(err.response?.data?.message || "Mã OTP không đúng");
    } finally {
        setLoading(false);
    }
};


 return (
    <div className="form-container">
      <Toaster position="top-center" />

      {/* --- CHẾ ĐỘ ĐĂNG NHẬP --- */}
      {viewMode === 'login' && (
        <form onSubmit={handleSubmit} className="fade-in">
          <h4>Đăng nhập sinh viên</h4>
          
          <input 
            type="email" 
            placeholder="Email sinh viên" 
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})} 
            required 
          />
          
          <input 
            type="password" 
            placeholder="Mật khẩu" 
            value={form.password} 
            onChange={e => setForm({...form, password: e.target.value})} 
            required 
          />

          <div className="form-options">
            <label className="remember-me">
              <input 
                type="checkbox" 
                checked={form.remember} 
                onChange={e => setForm({...form, remember: e.target.checked})} 
              /> 
              Nhớ thông tin
            </label>

            <div className="forgot-pass-link">
              <span onClick={() => setViewMode('forgot_step1')}>Quên mật khẩu?</span>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <div className="loader-container">
                <div className="spinner"></div>
                <span>Đang xác thực...</span>
              </div>
            ) : "Đăng nhập"}
          </button>
          
          <button type="button" className="btn-back" onClick={onBack}>Quay lại trang chủ</button>
        </form>
      )}

      {/* --- QUÊN MẬT KHẨU BƯỚC 1: NHẬP EMAIL --- */}
      {viewMode === 'forgot_step1' && (
        <form onSubmit={handleRequestOTP} className="fade-in">
          <h4>Quên mật khẩu</h4>
          <p style={{fontSize: '13px', color: '#666'}}>Nhập email để nhận mã xác thực.</p>
          
          <input 
            type="email" 
            placeholder="Nhập email của bạn" 
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})} 
            required 
          />
          
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi mã xác thực"}
          </button>
          
          <button type="button" className="btn-back" onClick={() => setViewMode('login')}>Quay lại</button>
        </form>
      )}

      {/* --- QUÊN MẬT KHẨU BƯỚC 2: NHẬP OTP & PASS MỚI --- */}
      {viewMode === 'forgot_step2' && (
        <form onSubmit={handleResetPassword} className="fade-in">
          <h4>Đặt lại mật khẩu</h4>
          
          <input 
            type="text" 
            placeholder="Nhập mã OTP (6 số)" 
            value={form.otp} 
            onChange={e => setForm({...form, otp: e.target.value})} 
            required 
          />
          
          <input 
            type="password" 
            placeholder="Mật khẩu mới" 
            value={form.newPassword} 
            onChange={e => setForm({...form, newPassword: e.target.value})} 
            required 
          />
          
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
          </button>
          
          <button type="button" className="btn-back" onClick={() => setViewMode('forgot_step1')}>Quay lại</button>
        </form>
      )}
    </div>
  );
};

export default LoginView;