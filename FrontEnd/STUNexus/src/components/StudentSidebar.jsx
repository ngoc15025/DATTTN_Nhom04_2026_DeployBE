import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaHistory, FaExclamationCircle, FaBook, FaQrcode, FaShieldAlt, FaTimes } from 'react-icons/fa';

const StudentSidebar = ({ show, onClose }) => {
  return (
    <div className={`sidebar shadow-sm ${show ? 'show' : ''}`}>
      {/* Logo */}
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

      {/* Navigation */}
      <div className="sidebar-nav">
        <div className="px-4 py-2 mt-2 text-uppercase text-muted fw-bold" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
          Không Gian Học Tập
        </div>

        <NavLink to="/student/dashboard" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaHome />
          <span>Trang Chủ</span>
        </NavLink>

        <NavLink to="/student/qr-scan" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaQrcode />
          <span>Quét Mã Điểm Danh</span>
        </NavLink>

        <NavLink to="/student/classes" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaBook />
          <span>Lớp Học Của Tôi</span>
        </NavLink>

        <NavLink to="/student/history" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaHistory />
          <span>Lịch Sử Điểm Danh</span>
        </NavLink>

        <NavLink to="/student/profile" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaShieldAlt />
          <span>Bảo Mật & Passkey</span>
        </NavLink>

        <NavLink to="/student/complaints" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaExclamationCircle />
          <span>Gửi Phản Hồi</span>
        </NavLink>
      </div>
    </div>
  );
};

export default StudentSidebar;
