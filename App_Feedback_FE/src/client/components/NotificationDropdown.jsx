import React, { useState } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import '../layout/NotificationDropdown.css'; 
import moment from 'moment';

//  1: Thêm onNotificationClick vào danh sách Props nhận vào
const NotificationDropdown = ({
   notifications,
   onMarkAllRead,
   onNotificationClick
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [preview, setPreview] = useState(null);

    const unreadCount = notifications?.filter(n => !n.IsRead).length || 0;

return (
    <div className="notification-container">

        {/* Nút chuông */}
        <div
            className="bell-wrapper"
            onClick={() => setIsOpen(!isOpen)}
        >
            <Bell size={22} color="white" />

            {unreadCount > 0 && (
                <span className="noti-badge">
                    {unreadCount}
                </span>
            )}
        </div>

        {/* Dropdown thông báo */}
        {isOpen && (
            <div className="noti-dropdown fade-in">

                <div className="noti-header">
                    <span>Thông báo</span>

                    {unreadCount > 0 && (
                        <CheckCheck
                            size={16}
                            className="mark-read-btn"
                            title="Đánh dấu đã đọc tất cả"
                            onClick={onMarkAllRead}
                        />
                    )}
                </div>

                <div className="noti-list">
                    {notifications?.length > 0 ? (
                        notifications.map((n) => (
                           <div
                                key={n.Id}
                                className={`noti-item ${n.IsRead ? 'read' : 'unread'}`}
                                onClick={() => {
                                    // Chỉ gọi một lần duy nhất
                                    if (onNotificationClick) {
                                        onNotificationClick(n, setPreview); 
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="noti-dot"></div>

                                <div className="noti-content">
                                    <p className="noti-title">
                                        {n.Title}
                                    </p>

                                    <p className="noti-msg">
                                        {n.Message}
                                    </p>

                                <small className="noti-date">
                                {moment.utc(n.CreatedAt).format('hh:mm:ss A')}
                                </small>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="noti-empty">
                            Không có thông báo nào
                        </div>
                    )}
                </div>

            </div>
        )}

        {/* Popup preview nổi */}
        {preview && (
            <div className="notification-preview-popup fade-in">

                <div className="preview-header">
                    <h4>{preview.Title}</h4>

                    <button
                        className="preview-close-btn"
                        onClick={() => setPreview(null)}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="preview-content">

                    <p className="preview-message">
                        {preview.Message}
                    </p>

                    {preview.comment && (
                        <div className="teacher-comment">
                            <strong>Nhận xét GV:</strong>

                            <p>{preview.comment}</p>
                        </div>
                    )}

                    {preview.strengths && (
                        <div className="preview-section">
                            <strong>Điểm mạnh:</strong>

                            <p>{preview.strengths}</p>
                        </div>
                    )}

                    {preview.weakness && (
                        <div className="preview-section">
                            <strong>Cần cải thiện:</strong>

                            <p>{preview.weakness}</p>
                        </div>
                    )}

                </div>
            </div>
        )}

    </div>
);
};

export default NotificationDropdown;