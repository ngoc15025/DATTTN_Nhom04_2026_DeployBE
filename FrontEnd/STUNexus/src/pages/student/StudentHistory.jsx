import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axiosClient from '../../utils/axiosClient';
import { FaHistory, FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const StudentHistory = () => {
  const { user } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const maSv = user?.MaSV || user?.MaId;
        if (!maSv) return;
        
        setLoading(true);
        const res = await axiosClient.get(`/diemdanh/student/${maSv}`);
        setHistory(res.data);
        setError(null);
      } catch (err) {
        setError('Không thể tải lịch sử điểm danh. Vui lòng thử lại sau.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 1: return <span className="badge bg-success rounded-pill px-3 py-2"><FaCheckCircle className="me-1"/> Có mặt</span>;
      case 2: return <span className="badge bg-warning text-dark rounded-pill px-3 py-2"><FaInfoCircle className="me-1"/> Đi trễ</span>;
      case 3: return <span className="badge bg-info rounded-pill px-3 py-2"><FaInfoCircle className="me-1"/> Vắng có phép</span>;
      case 4: return <span className="badge bg-danger rounded-pill px-3 py-2"><FaTimesCircle className="me-1"/> Vắng không phép</span>;
      case 5: return <span className="badge bg-dark rounded-pill px-3 py-2"><FaExclamationTriangle className="me-1"/> Lỗi xác thực</span>;
      default: return <span className="badge bg-secondary rounded-pill px-3 py-2">Không xác định</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Format YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'Chưa điểm danh';
    const date = new Date(timeString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Caculate Stats
  const total = history.length;
  const present = history.filter(h => h.trangThai === 1 || h.trangThai === 2).length;
  const absent = history.filter(h => h.trangThai === 3 || h.trangThai === 4).length;
  const issues = history.filter(h => h.trangThai === 5).length;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex align-items-center mb-4">
        <FaHistory className="fs-2 text-primary me-3" />
        <h2 className="mb-0 fw-bold">Lịch Sử Điểm Danh</h2>
      </div>

      {error ? (
        <div className="alert alert-danger shadow-sm border-0 rounded-4">
          <FaExclamationTriangle className="me-2" /> {error}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="card border-0 bg-primary bg-opacity-10 rounded-4 text-center p-3 h-100 shadow-sm">
                <h6 className="text-primary fw-bold mb-1">Tổng Số</h6>
                <h3 className="text-primary mb-0">{total}</h3>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 bg-success bg-opacity-10 rounded-4 text-center p-3 h-100 shadow-sm">
                <h6 className="text-success fw-bold mb-1">Có Mặt / Trễ</h6>
                <h3 className="text-success mb-0">{present}</h3>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 bg-danger bg-opacity-10 rounded-4 text-center p-3 h-100 shadow-sm">
                <h6 className="text-danger fw-bold mb-1">Vắng Mặt</h6>
                <h3 className="text-danger mb-0">{absent}</h3>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="card border-0 bg-dark bg-opacity-10 rounded-4 text-center p-3 h-100 shadow-sm">
                <h6 className="text-dark fw-bold mb-1">Lỗi Xác Thực</h6>
                <h3 className="text-dark mb-0">{issues}</h3>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div className="card-header bg-white border-bottom p-4">
              <h5 className="mb-0 fw-bold text-dark">Lịch sử chi tiết (Gần nhất xếp trước)</h5>
            </div>
            <div className="card-body p-0">
              {history.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ minWidth: '800px' }}>
                    <thead className="table-light text-muted">
                      <tr>
                        <th className="py-3 px-4 border-bottom-0">Ngày</th>
                        <th className="py-3 px-4 border-bottom-0">Môn Học</th>
                        <th className="py-3 px-4 border-bottom-0">Trạng Thái</th>
                        <th className="py-3 px-4 border-bottom-0">Thời Gian Quét</th>
                        <th className="py-3 px-4 border-bottom-0">Ghi Chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, index) => (
                        <tr key={item.maDiemDanh || index}>
                          <td className="px-4 fw-medium text-dark">{formatDate(item.ngayHoc)}</td>
                          <td className="px-4">
                            <span className="fw-bold text-primary">{item.tenMon || `Buổi ${item.maBuoiHoc}`}</span>
                          </td>
                          <td className="px-4">{getStatusBadge(item.trangThai)}</td>
                          <td className="px-4 text-muted">{formatTime(item.thoiGianQuet)}</td>
                          <td className="px-4 text-muted fst-italic">
                            {item.ghiChu || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <FaHistory className="fs-1 opacity-25 mb-3" />
                  <p>Bạn chưa có dữ liệu điểm danh nào.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentHistory;
