import React, { useContext, useState, useRef, useEffect } from 'react';
import { FaUserCircle, FaSignOutAlt, FaBars } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getRoleLabel = (role) => {
    if (role === 'admin') return 'Quản Trị Viên';
    if (role === 'lecturer') return 'Giảng Viên';
    if (role === 'student') return 'Sinh Viên';
    return 'Khách';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    setIsOpen(false);
    navigate(`/${user?.role}/profile`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="top-header glass-panel border-0 border-bottom rounded-0 position-relative" style={{zIndex: 1050}}>
      <div className="header-left d-flex align-items-center gap-2 gap-md-3">
        {/* Nút Hamburger cho Mobile - Hiện với mọi Role */}
        <button 
          className="btn btn-light bg-transparent border-0 d-md-none d-flex align-items-center justify-content-center p-2 rounded-circle hover-bg-light"
          onClick={onMenuClick}
          style={{width: '40px', height: '40px'}}
        >
          <FaBars className="fs-5 text-dark" />
        </button>

        <h5 className="mb-0 text-dark fw-bold d-none d-md-block">Hệ thống Điểm danh</h5>
        <h6 className="mb-0 text-dark fw-bold d-md-none">STUNexus</h6>
      </div>
      <div className="header-right d-flex align-items-center gap-4">
        
        <div className="position-relative" ref={dropdownRef}>
          <div className="user-profile d-flex align-items-center gap-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)} style={{cursor: 'pointer'}}>
            <div className={`avatar rounded-circle text-white d-flex align-items-center justify-content-center fw-bold shadow-sm ${user?.role === 'admin' ? 'bg-danger' : user?.role === 'lecturer' ? 'bg-success' : 'bg-primary'}`} style={{width: '35px', height: '35px', backgroundImage: user?.AnhDaiDien ? `url(${user.AnhDaiDien})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0}}>
              {!user?.AnhDaiDien && (user?.HoTen ? user.HoTen.charAt(0) : 'U')}
            </div>
            <div className="d-none d-md-block text-start" style={{userSelect: 'none'}}>
              <p className="mb-0 fw-bold small text-dark">{user?.HoTen || 'Chưa đăng nhập'}</p>
              <p className="mb-0 text-muted" style={{fontSize: '0.75rem'}}>{getRoleLabel(user?.role)}</p>
            </div>
          </div>
          
          {isOpen && (
            <div className="dropdown-menu dropdown-menu-end shadow border-0 mt-3 show" style={{borderRadius: '12px', right: 0, left: 'auto', position: 'absolute', minWidth: '220px', zIndex: 1060}}>
              <div className="d-block d-md-none px-3 py-2 border-bottom mb-2 bg-light rounded-top-3">
                 <p className="mb-0 fw-bold small text-dark">{user?.HoTen}</p>
                 <p className="mb-0 text-muted" style={{fontSize: '0.75rem'}}>{getRoleLabel(user?.role)}</p>
              </div>

              {user?.role !== 'admin' && (
                <button className="dropdown-item py-2 d-flex align-items-center gap-2 text-dark fw-medium" onClick={handleProfile}>
                  <FaUserCircle className="text-primary"/> Hồ sơ cá nhân
                </button>
              )}
              {user?.role !== 'admin' && <div className="dropdown-divider"></div>}
              
              <button className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger fw-medium" onClick={handleLogout}>
                <FaSignOutAlt /> Đăng xuất
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
