import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from "../layout/Table.module.css"; 
import styleUser from "../layout/User.module.css";
import Swal from 'sweetalert2';
import { PlusCircle, Trash2, Search, UserCog, Mail, Calendar, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
});

function Teachers() {
    const [teachers, setTeachers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // --- STATE CHO PHÂN TRANG ---
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPage: 1
    });

    const [newTeacher, setNewTeacher] = useState({
        fullName: "",
        email: "",
        password: ""
    });

    const token = localStorage.getItem("token");

    // 1. Lấy danh sách giáo viên có kèm phân trang
    const fetchTeachers = async (page = 1) => {
        setLoading(true);
        try {
            // 💡 Truyền page lên query để Backend xử lý
            const res = await axios.get(`http://localhost:5000/api/admin/teachers?page=${page}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                setTeachers(res.data.data);
                // Cập nhật thông tin phân trang từ Backend trả về
                if (res.data.pagination) {
                    setPagination({
                        currentPage: res.data.pagination.currentPage,
                        totalPage: res.data.pagination.totalPage
                    });
                }
            }
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: 'Không thể tải danh sách giáo viên' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchTeachers(1); 
    }, []);

    // 2. Xử lý tạo giáo viên mới
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/admin/teachers", newTeacher, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                Toast.fire({ icon: 'success', title: res.data.message });
                setIsModalOpen(false);
                setNewTeacher({ fullName: "", email: "", password: "" });
                fetchTeachers(pagination.currentPage); // Load lại trang hiện tại
            }
        } catch (err) {
            Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Lỗi tạo giáo viên' });
        }
    };

    // 3. Xử lý xóa giáo viên
    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: `Xác nhận xóa?`,
            text: `Bạn có chắc muốn xóa giảng viên ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Xóa ngay',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                const res = await axios.delete(`http://localhost:5000/api/admin/teachers/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    Toast.fire({ icon: 'success', title: res.data.message });
                    fetchTeachers(pagination.currentPage);
                }
            } catch (err) {
                Toast.fire({ icon: 'error', title: err.response?.data?.message || 'Lỗi khi xóa' });
            }
        }
    };

    // 4. Lọc tại chỗ (Nếu bạn muốn search server-side thì nên gọi lại API fetch)
    const filteredTeachers = teachers.filter(t => 
        t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.tableContainer}>
            <div className={styles.tableHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <UserCog size={28} color="#4f46e5" /> Quản lý Giảng viên
                    </h2>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm nhanh..." 
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className={styles.saveBtn} style={{ background: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PlusCircle size={20} /> Thêm Giảng viên
                    </button>
                </div>
            </div>

            <table className={styles.customTable}>
                <thead>
                    <tr>
                        <th><div style={{display:'flex', alignItems:'center', gap:'8px'}}><Users size={16}/> Họ và Tên</div></th>
                        <th><div style={{display:'flex', alignItems:'center', gap:'8px'}}><Mail size={16}/> Email</div></th>
                        <th style={{textAlign: 'center'}}>Số lớp dạy</th>
                        <th><div style={{display:'flex', alignItems:'center', gap:'8px'}}><Calendar size={16}/> Ngày tạo</div></th>
                        <th style={{textAlign: 'center'}}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" style={{textAlign:'center', padding: '40px'}}>Đang tải dữ liệu...</td></tr>
                    ) : filteredTeachers.length > 0 ? (
                        filteredTeachers.map((t) => (
                            <tr key={t.id}>
                                <td style={{ fontWeight: '600' }}>{t.fullName}</td>
                                <td>{t.email}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <span style={{ 
                                        background: t.totalClasses > 0 ? '#e0e7ff' : '#f1f5f9', 
                                        padding: '4px 12px', borderRadius: '20px', fontSize: '12px', 
                                        color: t.totalClasses > 0 ? '#4338ca' : '#94a3b8', fontWeight: '600'
                                    }}>
                                        {t.totalClasses} lớp
                                    </span>
                                </td>
                                <td>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(t.id, t.fullName)}>
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="5" style={{textAlign:'center', padding: '40px'}}>Trống.</td></tr>
                    )}
                </tbody>
            </table>

            {/* --- BỘ PHÂN TRANG (PAGINATION) --- */}
            {pagination.totalPage > 1 && (
                <div className={styleUser.paginationContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '25px' }}>
                    <button 
                        disabled={pagination.currentPage <= 1}
                        onClick={() => fetchTeachers(pagination.currentPage - 1)}
                        className={styleUser.pageBtn}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    {[...Array(pagination.totalPage)].map((_, index) => {
                        const pageNum = index + 1;
                        return (
                            <button
                                key={pageNum}
                                onClick={() => fetchTeachers(pageNum)}
                                className={`${styleUser.pageBtn} ${pagination.currentPage === pageNum ? styleUser.activePage : ''}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}

                    <button 
                        disabled={pagination.currentPage >= pagination.totalPage}
                        onClick={() => fetchTeachers(pagination.currentPage + 1)}
                        className={styleUser.pageBtn}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* Modal Thêm giáo viên */}
            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <form className={styles.editForm} onSubmit={handleCreate} style={{ maxWidth: '450px' }}>
                        <h3 style={{ marginBottom: '5px' }}>Đăng ký Giảng viên</h3>
                        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>Tạo tài khoản mới để giảng viên đăng nhập vào hệ thống.</p>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Họ và tên</label>
                            <input 
                                required 
                                value={newTeacher.fullName} 
                                onChange={e => setNewTeacher({...newTeacher, fullName: e.target.value})} 
                                placeholder="VD: Thầy Nguyễn Văn A" 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Email công việc</label>
                            <input 
                                required 
                                type="email" 
                                value={newTeacher.email} 
                                onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} 
                                placeholder="teacher@university.edu.vn" 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Mật khẩu mặc định</label>
                            <input 
                                required 
                                type="password" 
                                value={newTeacher.password} 
                                onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} 
                                placeholder="Tối thiểu 6 ký tự" 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        
                        <div className={styles.editFormActions}>
                            <button type="submit" className={styles.saveBtn} style={{ flex: 1 }}>Tạo tài khoản</button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className={styles.cancelBtn} style={{ flex: 1 }}>Hủy</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Teachers;