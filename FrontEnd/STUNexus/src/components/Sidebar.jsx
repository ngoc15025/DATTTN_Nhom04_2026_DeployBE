import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaChalkboardTeacher, FaUserGraduate, FaLayerGroup, FaBook, FaChartBar, FaSignOutAlt, FaTimes } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const Sidebar = ({ show, onClose }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`sidebar shadow-sm ${show ? 'show' : ''}`}>
      <div className="brand d-flex align-items-center justify-content-between">
        <img src="/logo.png" alt="STU Portal" style={{maxHeight: '60px', objectFit: 'contain'}} />
        <button 
          className="btn btn-light d-md-none border-0 rounded-circle" 
          onClick={onClose}
          style={{width: '35px', height: '35px', padding: 0}}
        >
          <FaTimes />
        </button>
      </div>
      
      <div className="sidebar-nav">
        <NavLink to="/admin/dashboard" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaChartBar />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/admin/lecturers" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaChalkboardTeacher />
          <span>Quản lý Giảng viên</span>
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2">
          <FaSignOutAlt /> Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
