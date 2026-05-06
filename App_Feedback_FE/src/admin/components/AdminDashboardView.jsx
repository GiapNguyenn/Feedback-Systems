


const AdminDashboardView = ({ setIsAddModalOpen }) => {
  return (
    <div className={styleUser.adminWrapper}>
      <div className={styleUser.adminHeader}>
        <h2>Quản trị hệ thống</h2>
        <p>Thực hiện các tác vụ bảo trì và quản lý nhân sự cấp cao</p>
      </div>

      <div className={styleUser.adminGrid}>
        {/* Card Quản lý Giáo viên */}
        <div className={styleUser.adminCard} onClick={() => setIsAddModalOpen(true)}>
          <div className={styleUser.cardIcon} style={{backgroundColor: '#eef2ff', color: '#6366f1'}}>
            <PlusCircle size={24} />
          </div>
          <h3>Đăng ký Giáo viên</h3>
          <p>Tạo tài khoản mới cho Giảng viên tham gia hệ thống.</p>
          <span className={styleUser.cardAction}>Thực hiện ngay →</span>
        </div>

        {/* Card Bảo trì hệ thống */}
        <div className={styleUser.adminCard} onClick={() => Swal.fire('Thông báo', 'Đang quét dọn các bài nộp cũ...', 'info')}>
          <div className={styleUser.cardIcon} style={{backgroundColor: '#fff7ed', color: '#f97316'}}>
            <Settings size={24} />
          </div>
          <h3>Bảo trì Hệ thống</h3>
          <p>Dọn dẹp tệp tin tạm, tối ưu hóa cơ sở dữ liệu bài nộp.</p>
          <span className={styleUser.cardAction}>Chạy bảo trì →</span>
        </div>

        {/* Card Nhật ký */}
        <div className={styleUser.adminCard}>
          <div className={styleUser.cardIcon} style={{backgroundColor: '#ecfdf5', color: '#10b981'}}>
            <Search size={24} />
          </div>
          <h3>Xem Logs</h3>
          <p>Theo dõi lịch sử đăng nhập và các thay đổi quan trọng.</p>
          <span className={styleUser.cardAction}>Xem chi tiết →</span>
        </div>
      </div>
    </div>
  );
};