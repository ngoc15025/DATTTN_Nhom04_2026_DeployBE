import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axiosClient from '../../utils/axiosClient';
import { FaUserGraduate, FaCalendarCheck, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const LecturerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ totalStudents: 0, avgAttendance: 0, warningStudents: 0 });

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get(`/diemdanh/lecturer-stats/${user.MaGV || user.MaId}`);
        setStats(res.data);
      } catch (err) {
        console.error('Lỗi tải thống kê:', err);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="container-fluid">
      <h3 className="mb-4 mt-2 fw-bold text-dark">Báo Cáo Chuyên Cần</h3>
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card glass-panel border-0 border-start border-primary border-4 p-4 shadow-sm" style={{borderRadius: '12px'}}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted fw-bold mb-1 text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>TỔNG SINH VIÊN Q.LÝ</p>
                <h2 className="fw-bold mb-0 text-dark">{stats.totalStudents}</h2>
              </div>
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle">
                <FaUserGraduate className="fs-2 text-primary" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card glass-panel border-0 border-start border-success border-4 p-4 shadow-sm" style={{borderRadius: '12px'}}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted fw-bold mb-1 text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>TỶ LỆ ĐI HỌC (T.BÌNH)</p>
                <h2 className="fw-bold mb-0 text-success">{stats.avgAttendance}%</h2>
              </div>
              <div className="bg-success bg-opacity-10 p-3 rounded-circle">
                <FaCalendarCheck className="fs-2 text-success" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card glass-panel border-0 border-start border-danger border-4 p-4 shadow-sm" style={{borderRadius: '12px'}}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <p className="text-muted fw-bold mb-1 text-uppercase" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>SV VẮNG/TRỄ CAO (≥3)</p>
                <h2 className="fw-bold mb-0 text-danger">{stats.warningStudents}</h2>
              </div>
              <div className="bg-danger bg-opacity-10 p-3 rounded-circle">
                <FaExclamationTriangle className="fs-2 text-danger" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card glass-panel border-0 shadow-sm mt-5">
        <div className="card-header bg-white border-bottom py-3">
          <h6 className="m-0 fw-bold text-dark">Cảnh báo Sinh viên cấm thi</h6>
        </div>
        <div className="card-body p-0">
          {stats.warningList && stats.warningList.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted">
                  <tr>
                    <th className="py-3 px-4 border-bottom-0">Mã SV</th>
                    <th className="py-3 px-4 border-bottom-0">Họ Tên</th>
                    <th className="py-3 px-4 border-bottom-0">Lớp</th>
                    <th className="py-3 px-4 border-bottom-0">Môn / Lớp HP</th>
                    <th className="py-3 px-4 border-bottom-0 text-center">Tình Trạng (Vắng)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.warningList.map((sv, idx) => (
                    <tr key={idx}>
                      <td className="px-4 fw-bold text-primary">{sv.maSv}</td>
                      <td className="px-4 fw-medium text-dark">{sv.hoTen}</td>
                      <td className="px-4"><span className="badge bg-secondary bg-opacity-10 text-dark border">{sv.lop}</span></td>
                      <td className="px-4">
                        <div className="fw-bold text-truncate" style={{maxWidth: '200px'}} title={sv.tenMon || sv.tenLop}>
                           {sv.tenMon || sv.tenLop}
                        </div>
                        <div className="text-muted small">Mã: {sv.tenLop}</div>
                      </td>
                      <td className="px-4 text-center">
                         <div className={`badge ${sv.tiLeVang >= 50 ? 'bg-danger' : 'bg-warning text-dark'} rounded-pill px-3 py-2`} style={{fontSize: '0.85rem'}}>
                           {sv.soBuoiVang}/{sv.tongBuoi} ({sv.tiLeVang}%)
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-center">
              <div className="bg-success bg-opacity-10 d-inline-flex justify-content-center align-items-center rounded-circle mb-3" style={{width: '80px', height: '80px'}}>
                <FaCheckCircle className="text-success fs-1" />
              </div>
              <p className="text-muted fw-medium fs-5 mb-0">
                Bạn đang quản lý lớp học rất tốt. Không có sinh viên nào rơi vào ngưỡng cấm thi!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
