import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaQrcode, FaListUl, FaCalendarAlt, FaTrash, FaCheckCircle, FaBroadcastTower, FaClock } from 'react-icons/fa';
import axiosClient from '../../utils/axiosClient';

// Kết nối trực tiếp tới BuoiHocController của Backend C#

const SessionsManagement = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ ngayHoc: '', gioBatDau: '07:30', gioKetThuc: '09:30', ghiChu: '' });

  const fetchSessions = async () => {
    try {
      const res = await axiosClient.get(`/buoihoc/class/${classId}?t=${Date.now()}`);
      const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setSessions(data);
    } catch (err) {
      console.error('Lỗi tải buổi học:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [classId]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/buoihoc', {
        ...formData,
        gioBatDau: formData.gioBatDau.length === 5 ? formData.gioBatDau + ':00' : formData.gioBatDau,
        gioKetThuc: formData.gioKetThuc.length === 5 ? formData.gioKetThuc + ':00' : formData.gioKetThuc,
        maLop: classId
      });
      alert('Thêm buổi học thành công!');
      setShowModal(false);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi thêm buổi học!');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cảnh báo: Việc huỷ lịch buổi học sẽ xóa bỏ toàn bộ dữ liệu điểm danh tương ứng. Bạn có chắc chắn?')) {
      try {
        await axiosClient.delete(`/buoihoc/${id}`);
        alert('Đã xóa buổi học thành công.');
        fetchSessions();
      } catch (err) {
        alert(err.response?.data?.message || 'Lỗi khi xóa.');
      }
    }
  };

  const exportFullExcel = async () => {
    try {
      const res = await axiosClient.get(`/excel/class/${classId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BaoCao_ToanKy_${classId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Lỗi xuất excel:", err);
      alert("Không thể xuất báo cáo toàn kỳ!");
    }
  };

  const openAdd = () => {
    setFormData({ ngayHoc: new Date().toISOString().split('T')[0], gioBatDau: '07:30', gioKetThuc: '09:30', ghiChu: 'Buoi hoc ly thuyet' });
    setShowModal(true);
  };

  const SessionStatusBadge = ({ status }) => {
    if (status === 2) return (
      <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
        style={{ backgroundColor: '#d1fae5', color: '#065f46', fontSize: '0.72rem' }}>
        <FaCheckCircle /> Đã điểm danh
      </span>
    );
    if (status === 1) return (
      <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
        style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', fontSize: '0.72rem' }}>
        <FaBroadcastTower /> Đang mở
      </span>
    );
    return (
      <span className="badge d-inline-flex align-items-center gap-1 px-2 py-1 rounded-pill"
        style={{ backgroundColor: '#fef3c7', color: '#92400e', fontSize: '0.72rem' }}>
        <FaClock /> Chưa điểm danh
      </span>
    );
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle shadow-sm" style={{ width: '40px', height: '40px' }} onClick={() => navigate(-1)}><FaArrowLeft /></button>
          <h3 className="m-0 fw-bold text-dark">Lịch trình Buổi học - <span className="text-primary">{classId}</span></h3>
        </div>
        <div className="d-flex gap-2">
          <button onClick={exportFullExcel} className="btn btn-outline-success d-flex align-items-center gap-2 px-3 shadow-sm border-2 fw-bold" style={{ borderRadius: '8px' }}>
            <FaCalendarAlt /> Xuất Báo Cáo Toàn Kỳ
          </button>
          <button onClick={openAdd} className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" style={{ borderRadius: '8px' }}>
            <FaPlus /> Lên Lịch Buổi Mới
          </button>
        </div>
      </div>

      <div className="row g-4">
        {sessions.length > 0 ? sessions.map(b => (
          <div className="col-12 col-md-6 col-xl-4" key={b.maBuoiHoc}>
            <div className="card glass-panel border-0 shadow-sm h-100 position-relative overflow-hidden" style={{ borderRadius: '12px' }}>
              <button onClick={() => handleDelete(b.maBuoiHoc)} className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle shadow d-flex justify-content-center align-items-center" style={{ zIndex: 10, width: '30px', height: '30px', padding: 0 }} title="Hủy Buổi Học này"><FaTrash /></button>
              <div className="card-body p-4 pt-5">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-3 me-3 flex-shrink-0">
                    <FaCalendarAlt className="fs-3" />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <h6 className="fw-bold mb-0 text-dark">Ngày: {b.ngayHoc}</h6>
                      <SessionStatusBadge status={b.trangThaiBh} />
                    </div>
                    <span className="text-muted fw-medium small">{b.gioBatDau} - {b.gioKetThuc}</span>
                  </div>
                </div>
                <p className="text-muted small mb-4 bg-light p-2 rounded-3 border-start border-4 border-warning">{b.ghiChu}</p>
                <div className="d-flex gap-2 mt-auto">
                  {b.trangThaiBh === 2 ? (
                    <button className="btn btn-secondary flex-grow-1 d-flex justify-content-center align-items-center gap-2 fw-semibold shadow-sm" disabled>
                      <FaQrcode /> Đã kết thúc
                    </button>
                  ) : (
                    <button onClick={() => navigate(`/lecturer/qr-attendance/${b.maBuoiHoc}`)} className="btn btn-primary flex-grow-1 d-flex justify-content-center align-items-center gap-2 fw-semibold shadow-sm">
                      <FaQrcode /> Khởi chạy QR
                    </button>
                  )}
                  <button onClick={() => navigate(`/lecturer/manual/${b.maBuoiHoc}`)} className="btn btn-outline-secondary flex-grow-1 d-flex justify-content-center align-items-center gap-2 fw-semibold bg-white shadow-sm">
                    <FaListUl /> Sổ tay
                  </button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-12 mt-4 text-center text-muted bg-white p-5 rounded-4 shadow-sm">
            <FaCalendarAlt className="fs-1 mb-3 opacity-25" />
            <h5 className="fw-medium text-dark">Lớp này hiện chưa có lịch học nào.</h5>
            <p className="mb-0">Vui lòng bấm nút "Lên Lịch Buổi Mới" để khai báo ngày giờ học vào hệ thống.</p>
          </div>
        )}
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header bg-light border-0 rounded-top-4">
                  <h5 className="modal-title fw-bold text-dark">Xếp Lịch Buổi Học Mới</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body p-4">
                    <div className="mb-4">
                      <label className="form-label small fw-bold text-muted">Ngày Học <span className="text-danger">*</span></label>
                      <input type="date" className="form-control bg-light border-0 py-2" value={formData.ngayHoc} onChange={e => setFormData({ ...formData, ngayHoc: e.target.value })} required />
                    </div>
                    <div className="row g-3 mb-4">
                      <div className="col-6">
                        <label className="form-label small fw-bold text-muted">Giờ Bắt Đầu</label>
                        <input type="time" className="form-control bg-light border-0 py-2" value={formData.gioBatDau} onChange={e => setFormData({ ...formData, gioBatDau: e.target.value })} required />
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-bold text-muted">Giờ Kết Thúc</label>
                        <input type="time" className="form-control bg-light border-0 py-2" value={formData.gioKetThuc} onChange={e => setFormData({ ...formData, gioKetThuc: e.target.value })} required />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">Nội dung / Ghi chú <span className="text-danger">*</span></label>
                      <textarea className="form-control bg-light border-0 p-3 rounded-4" rows="3" value={formData.ghiChu} onChange={e => setFormData({ ...formData, ghiChu: e.target.value })} placeholder="VD: Buổi 1 - Học lý thuyết và chia nhóm" required></textarea>
                    </div>
                  </div>
                  <div className="modal-footer border-0 bg-light rounded-bottom-4">
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Lưu Lịch Vào Hệ Thống</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default SessionsManagement;
