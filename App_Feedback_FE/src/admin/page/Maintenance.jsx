import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Power, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { Toast } from '../../helpers/toast';
import Swal from 'sweetalert2'; // Thêm để xác nhận cho an toàn

function MaintenanceManager() {
    const [isMaint, setIsMaint] = useState(false);
    const [loading, setLoading] = useState(true); // Mặc định là đang load khi mới vào
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Dùng useCallback để tối ưu hàm lấy dữ liệu
    const fetchStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://localhost:5000/api/admin/setting/maintenance-status", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsMaint(res.data.status);
        } catch (err) {
            console.error("Lỗi lấy trạng thái:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // 2. Hàm xử lý bật/tắt có xác nhận
    const handleToggle = async () => {
        const actionText = isMaint ? "TẮT bảo trì" : "BẬT bảo trì";
        
        // Xác nhận qua SweetAlert2 để tránh bấm nhầm làm cả trường bị văng ra ngoài
        const result = await Swal.fire({
            title: `Xác nhận ${actionText}?`,
            text: isMaint 
                ? "Hệ thống sẽ mở lại cho tất cả Sinh viên và Giáo viên." 
                : "Tất cả Sinh viên và Giáo viên sẽ bị đẩy ra trang thông báo bảo trì.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isMaint ? '#10b981' : '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            setIsProcessing(true);
            try {
                const token = localStorage.getItem("token");
                const newStatus = !isMaint;
                
                await axios.post("http://localhost:5000/api/admin/setting/toggle-maintenance", 
                    { status: newStatus },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setIsMaint(newStatus);
                Toast.fire({
                    icon: 'success',
                    title: newStatus ? 'Đã kích hoạt chế độ bảo trì!' : 'Hệ thống đã hoạt động bình thường!'
                });
            } catch (err) {
                Toast.fire({ icon: 'error', title: 'Không thể cập nhật trạng thái!' });
            } finally {
                setIsProcessing(false);
            }
        }
    };

    if (loading) return <div>Đang tải cấu hình...</div>;

    return (
        <div style={{ 
            padding: '24px', 
            background: 'white', 
            borderRadius: '16px', 
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            border: `1px solid ${isMaint ? '#fee2e2' : '#f1f5f9'}`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        padding: '10px',
                        borderRadius: '12px',
                        backgroundColor: isMaint ? '#fee2e2' : '#dcfce7'
                    }}>
                        {isMaint ? <ShieldAlert color="#ef4444" size={24} /> : <ShieldCheck color="#10b981" size={24} />}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Trạng thái vận hành</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: isMaint ? '#ef4444' : '#10b981', fontWeight: '600' }}>
                            {isMaint ? 'Hệ thống đang được bảo trì' : 'Hệ thống đang hoạt động ổn định'}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ 
                background: '#f8fafc', 
                padding: '16px', 
                borderRadius: '12px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0, maxWidth: '60%' }}>
                    Khi bật, chỉ tài khoản Quản trị viên mới có thể truy cập các tính năng.
                </p>
                
                <button 
                    onClick={handleToggle}
                    disabled={isProcessing}
                    style={{
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: isMaint ? '#10b981' : '#ef4444', // Bật thì hiện nút Tắt (Xanh), Tắt thì hiện nút Bật (Đỏ)
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '14px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isMaint ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 4px 12px rgba(239, 68, 68, 0.2)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Power size={18} />}
                    {isMaint ? "MỞ CỬA HỆ THỐNG" : "ĐÓNG CỬA BẢO TRÌ"}
                </button>
            </div>
        </div>
    );
}

export default MaintenanceManager;