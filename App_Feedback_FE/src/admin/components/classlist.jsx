import React from "react";
import styles from "../layout/User.module.css";
import styleUser from "../layout/User.module.css";

function ClassList({
teacherClasses = [],
  handleSelectClass,
  setIsCreateClassModalOpen,
  handleMouseDown,
  handleMouseUp,
  showDeleteId,
  selectedClassIds , // Khai báo 1 lần duy nhất ở đây
  setSelectedClassIds,   // Khai báo 1 lần duy nhất ở đây
  handleDeleteSelected  
}) {
  const isAnyDeleting = selectedClassIds && selectedClassIds.length > 0;

  return (
    <div>
      <div className={styles.tableHeader}>
        <h2>{isAnyDeleting ? `Đang chọn ${selectedClassIds.length} lớp` : "Danh sách Lớp học"}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAnyDeleting && (
            <button className={styles.saveBtn} style={{ backgroundColor: '#ef4444' }} onClick={handleDeleteSelected}>
              Xoá mục đã chọn
            </button>
          )}
          <button className={styles.saveBtn} onClick={() => setIsCreateClassModalOpen(true)}>
            + Tạo lớp mới
          </button>
        </div>
      </div>

      <div className={styles.classGrid}>
        {teacherClasses.map((cls) => {
          const isSelected = selectedClassIds.includes(cls.id);

          return (
            <div
              key={cls.id}
              className={`${styles.classCard} ${isSelected ? styleUser.cardSelected : ''}`}
              onMouseDown={() => handleMouseDown(cls.id)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={(e) => {
                // Nếu đang hiện nút xoá (chế độ chọn) thì chỉ tích chọn, không vào lớp
                if (isAnyDeleting) {
                  e.stopPropagation();
                  setSelectedClassIds(prev => 
                    prev.includes(cls.id) ? prev.filter(id => id !== cls.id) : [...prev, cls.id]
                  );
                  return;
                }
                handleSelectClass(cls);
              }}
              style={{ position: 'relative', border: isSelected ? '2px solid #ef4444' : '1px solid #ddd' }}
            >
              {/* Hiện checkbox khi bắt đầu có 1 lớp bị ấn giữ */}
              {isAnyDeleting && (
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  readOnly
                  style={{ position: 'absolute', top: '10px', left: '10px', width: '20px', height: '20px' }}
                />
              )}

              <h3>{cls.className}</h3>
              <p>{isAnyDeleting ? "Tích để chọn" : "Bấm để quản lý sinh viên"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ClassList;