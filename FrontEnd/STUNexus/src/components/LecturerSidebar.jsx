import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { FaUserGraduate, FaChartPie, FaBook, FaCalendarDay, FaBell, FaTimes } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const LecturerSidebar = ({ show, onClose }) => {
  const { user } = useContext(AuthContext);
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const maGv = user?.MaGV || user?.MaId;
    if (!maGv) return;
    import('../utils/axiosClient').then(({ default: axiosClient }) => {
      axiosClient.get(`/phanhoi/lecturer/${maGv}`)
        .then(res => {
          const pending = (res.data?.data || []).filter(a => a.trangThai === 0).length;
          setPendingCount(pending);
        })
        .catch(() => {});
    });
  }, [user]);

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
        <div className="px-4 py-2 mt-2 text-uppercase text-muted fw-bold" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
          Không Gian Quản Lý
        </div>
        <NavLink to="/lecturer/dashboard" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaChartPie />
          <span>Thống kê & Báo cáo</span>
        </NavLink>
        <NavLink to="/lecturer/students" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaUserGraduate />
          <span>Quản lý Sinh Viên</span>
        </NavLink>
        <NavLink to="/lecturer/attendance-today" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaCalendarDay />
          <span>Quản lý Điểm danh</span>
        </NavLink>
        <NavLink to="/lecturer/subjects" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaBook />
          <span>Quản lý Môn / Lớp Học</span>
        </NavLink>
        <NavLink to="/lecturer/appeals" onClick={onClose} className={({isActive}) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <FaBell />
          <span>Xử lý Khiếu Nại</span>
          {pendingCount > 0 && (
            <span className="badge bg-danger rounded-pill ms-auto" style={{fontSize:'0.65rem'}}>{pendingCount}</span>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default LecturerSidebar;
