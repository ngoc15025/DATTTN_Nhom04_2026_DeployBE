import React, { useState, useEffect, useContext } from 'react';
import axiosClient from '../../utils/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ coMat: 0, vang: 0, diTre: 0, total: 1 });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchAttendance = async () => {
      try {
        const res = await axiosClient.get(`/diemdanh/student/${user.MaSV}`);
        const history = Array.isArray(res.data) ? res.data : [];
        
        const total = history.length;
        const presentOrLate = history.filter(a => a?.trangThai === 1 || a?.trangThai === 2).length;
        const absent = history.filter(a => a?.trangThai === 3 || a?.trangThai === 4).length;
        const issues = history.filter(a => a?.trangThai === 5).length;
        
        setStats({ total, presentOrLate, absent, issues });
        setRecent(history.slice(0, 5));
      } catch (err) {
        console.error('Lỗi tải thống kê điểm danh:', err);
      }
    };

    fetchAttendance();
  }, [user]);

  const percentage = stats.total > 0 ? Math.round((stats.presentOrLate / stats.total) * 100) : 0;

  return (
    <div className="pb-4">
      <div className="bg-primary text-white p-4 rounded-4 shadow-sm mb-4 position-relative overflow-hidden">
        <div className="position-relative" style={{zIndex: 2}}>
          <h5 className="fw-bold mb-1">Xin chào, {user?.HoTen}</h5>
          <p className="mb-0 opacity-75 small">Mã SV: <span className="font-monospace fw-bold">{user?.MaSV}</span></p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card bg-white border-0 shadow-sm rounded-4 p-4 text-center">
            <h6 className="fw-bold text-dark mb-4">Tỷ lệ Chuyên cần</h6>
            <div className="d-flex justify-content-center">
              <div className="position-relative d-inline-flex align-items-center justify-content-center rounded-circle shadow-sm" style={{width: '130px', height: '130px', background: `conic-gradient(var(--bs-primary) ${percentage}%, #e9ecef 0)`}}>
                <div className="bg-white rounded-circle d-flex flex-column align-items-center justify-content-center" style={{width: '100px', height: '100px'}}>
                  <h3 className="mb-0 fw-bold text-primary">{percentage}%</h3>
                </div>
              </div>
            </div>
            <p className="text-muted small mt-3 mb-0 fw-medium">Hãy cố gắng duy trì trên 80% để đủ điều kiện thi nhé!</p>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="col-6">
          <div className="bg-primary bg-opacity-10 rounded-4 p-3 text-center border border-primary border-opacity-25 shadow-sm">
            <h6 className="text-primary fw-bold small mb-1">Tổng Số</h6>
            <h4 className="fw-bold text-primary mb-0">{stats.total}</h4>
          </div>
        </div>
        <div className="col-6">
          <div className="bg-success bg-opacity-10 rounded-4 p-3 text-center border border-success border-opacity-25 shadow-sm">
            <h6 className="text-success fw-bold small mb-1">Có Mặt / Trễ</h6>
            <h4 className="fw-bold text-success mb-0">{stats.presentOrLate}</h4>
          </div>
        </div>
        <div className="col-6">
          <div className="bg-danger bg-opacity-10 rounded-4 p-3 text-center border border-danger border-opacity-25 shadow-sm">
            <h6 className="text-danger fw-bold small mb-1">Vắng Mặt</h6>
            <h4 className="fw-bold text-danger mb-0">{stats.absent}</h4>
          </div>
        </div>
        <div className="col-6">
          <div className="bg-dark bg-opacity-10 rounded-4 p-3 text-center border border-dark border-opacity-25 shadow-sm">
            <h6 className="text-dark fw-bold small mb-1">Lỗi Xác Thực</h6>
            <h4 className="fw-bold text-dark mb-0">{stats.issues}</h4>
          </div>
        </div>
      </div>

      <div>
        <div className="d-flex justify-content-between align-items-end mb-3">
          <h6 className="fw-bold text-dark mb-0">Lịch sử điểm danh gần đây</h6>
          <a href="/student/history" className="small text-primary text-decoration-none fw-medium">Xem tất cả</a>
        </div>
        
        <div className="d-flex flex-column gap-2">
          {recent.map((item, i) => (
            <div key={i} className="bg-white p-3 rounded-4 shadow-sm border-0 d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-1 text-dark text-truncate" style={{maxWidth: '180px'}}>{item.tenMon}</h6>
                <div className="d-flex align-items-center text-muted small">
                  <i className="far fa-calendar-alt me-1"></i> {item.ngayHoc}
                </div>
              </div>
              <span className={`badge rounded-pill px-3 py-2 fw-bold ${
                item.trangThai === 1 ? 'bg-success bg-opacity-10 text-success' : 
                item.trangThai === 2 ? 'bg-warning bg-opacity-10 text-warning' : 'bg-danger bg-opacity-10 text-danger'
              }`}>
                {item.trangThai === 1 ? 'Có mặt' : item.trangThai === 2 ? 'Đi trễ' : 'Vắng'}
              </span>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="text-center p-4 bg-white rounded-4 shadow-sm border-0">
              <p className="text-muted small mb-0">Chưa có dữ liệu điểm danh trong học kỳ này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default StudentDashboard;
