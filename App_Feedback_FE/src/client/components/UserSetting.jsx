import React, { useState } from 'react';
import { LogOut, Settings, ChevronRight, ChevronLeft, Monitor, Sparkles } from 'lucide-react';
import ProfileSecurity from './ProfileSecurity'; 
import '../layout/UserSetting.css';

// --- MENU CHÍNH ---
const MainMenu = ({ user, onLogout, goToSettings }) => (
    <div className="menu-content fade-in">
        <div className="user-info-header">
            <p className="user-name">{user?.fullName}</p>
            <p className="user-email">{user?.email}</p>
        </div>
        <hr />
        <button className="menu-item" onClick={goToSettings}>
            <div className="item-left"><Settings size={18} /> <span>Cài đặt tài khoản</span></div>
            <ChevronRight size={16} />
        </button>
        <button className="menu-item" onClick={onLogout}>
            <div className="item-left"><LogOut size={18} color="#ef4444" /> <span style={{color: '#ef4444'}}>Đăng xuất</span></div>
        </button>
    </div>
);

// --- MENU CÀI ĐẶT ---
const SettingsSubMenu = ({ goBack, goToProfile, onToggleTheme, currentTheme }) => (
    <div className="menu-content fade-in">
        <div className="submenu-header" onClick={goBack}>
            <ChevronLeft size={18} /> <span>Cài đặt & Tùy chọn</span>
        </div>
        <hr />
        <button className="menu-item" onClick={goToProfile}>
            <div className="item-left"><Settings size={18} /> <span>Thông tin cá nhân</span></div>
            <ChevronRight size={16} />
        </button>
        
        {/* Nút đổi giao diện */}
        <div className="menu-item" onClick={onToggleTheme} style={{ cursor: 'pointer' }}>
            <div className="item-left">
                {currentTheme === 'anime' ? <Sparkles size={18} color="#000000" /> : <Monitor size={18} />}
                <span style={{ marginLeft: '10px' }}>
                    Giao diện: <strong>{currentTheme === 'anime' ? 'Tối' : 'Sáng'}</strong>
                </span>
            </div>
            <div className={`theme-switch ${currentTheme}`}>
                <div className="switch-handle"></div>
            </div>
        </div>
    </div>
);

// --- COMPONENT TỔNG ---
const UserSetting = ({ user, onLogout, onToggleTheme, currentTheme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuMode, setMenuMode] = useState('main');

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        setMenuMode('main');
    };

    return (
        <div className="user-setting-wrapper">
            <div className="avatar-circle" onClick={toggleMenu}>
                {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>

            {isOpen && (
                <>
                    <div className="menu-backdrop" onClick={() => setIsOpen(false)} />
                    <div className="user-dropdown-menu">
                        {menuMode === 'main' && (
                            <MainMenu user={user} onLogout={onLogout} goToSettings={() => setMenuMode('settings')} />
                        )}
                        
                        {/* SỬA CHỖ NÀY: Truyền theme và hàm đổi theme vào SubMenu */}
                        {menuMode === 'settings' && (
                            <SettingsSubMenu 
                                goBack={() => setMenuMode('main')} 
                                goToProfile={() => setMenuMode('profile')} 
                                onToggleTheme={onToggleTheme} 
                                currentTheme={currentTheme}
                            />
                        )}

                        {menuMode === 'profile' && (
                            <ProfileSecurity 
                                user={user} 
                                onBack={() => setMenuMode('settings')} 
                                onSuccess={() => setIsOpen(false)} 
                                onToggleTheme={onToggleTheme}
                                currentTheme={currentTheme}
                                onLogout={onLogout}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default UserSetting;