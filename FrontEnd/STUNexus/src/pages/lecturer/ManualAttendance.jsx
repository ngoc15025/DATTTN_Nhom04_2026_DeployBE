import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import { FaArrowLeft, FaSave, FaCheck, FaExclamationTriangle, FaSync } from 'react-icons/fa';

const ManualAttendance = () => {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [sessionInfo, setSessionInfo] = useState({ date: '', time: '', tenLop: '', trangThaiBh: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const maBuoiHoc = parseInt(classId);
      
      // 1. Lấy chi tiết buổi học (để lấy MaLop và thông tin hiển thị)
      const sessionRes = await axiosClient.get(`/buoihoc/${maBuoiHoc}`);
      const session = sessionRes.data;
      setSessionInfo({
        date: session.ngayHoc,
        time: `${session.gioBatDau} - ${session.gioKetThuc}`,
        tenLop: session.tenLop,
        trangThaiBh: session.trangThaiBh ?? 0
      });

      // 2. Lấy danh sách SV của lớp đó
      const studentsRes = await axiosClient.get(`/lophoc/${session.maLop}/students`);
      const allStudents = studentsRes.data?.data || [];

      // 3. Lấy dữ liệu điểm danh hiện tại (nếu có)
      const attendRes = await axiosClient.get(`/diemdanh/session/${maBuoiHoc}`);
      const currentAttendance = attendRes.data || [];

      // 4. Merge dữ liệu
      const merged = allStudents.map(s => {
        const att = currentAttendance.find(a => a.maSv === s.maSv);
        return {
          ...s,
          trangThai: att ? att.trangThai : 4, // Mặc định 4 (Vắng không phép) nếu chưa có record
          ghiChu: att ? att.ghiChu : '',
          maThietBiLog: att ? att.maThietBiLog : null
        };
      });

      setStudents(merged);
    } catch (err) {
      console.error('Lỗi tải dữ liệu điểm danh:', err);
      alert('Không thể tải dữ liệu buổi học!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  const handleStatusChange = (id, newStatus) => {
    setStudents(prev => prev.map(s => s.maSv === id ? { ...s, trangThai: parseInt(newStatus) } : s));
  };

  const handleNoteChange = (id, newNote) => {
    setStudents(prev => prev.map(s => s.maSv === id ? { ...s, ghiChu: newNote } : s));
  };

  const exportExcel = async () => {
    try {
      const maBuoiHoc = parseInt(classId);
      const res = await axiosClient.get(`/excel/session/${maBuoiHoc}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      // Lấy tên file từ header nếu có, hoặc đặt tên mặc định
      link.setAttribute('download', `DiemDanh_${sessionInfo.tenLop}_${sessionInfo.date}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Lỗi xuất excel:", err);
      alert("Không thể xuất file Excel!");
    }
  };

  const saveAttendance = async () => {
    try {
      const maBuoiHoc = parseInt(classId);
      const payload = students.map(s => ({
        maBuoiHoc: maBuoiHoc,
        maSv: s.maSv,
        trangThai: s.trangThai,
        ghiChu: s.ghiChu
      }));

      await axiosClient.post('/diemdanh/bulk-update', payload);
      alert('Lưu bảng điểm danh thành công!');
      navigate(-1);
    } catch (err) {
      alert('Lỗi khi lưu dữ liệu!');
    }
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle shadow-sm" style={{width: '40px', height: '40px'}} onClick={() => navigate(-1)}><FaArrowLeft /></button>
          <h3 className="m-0 fw-bold text-dark">Sổ tay Điểm danh - {sessionInfo.tenLop}</h3>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success d-flex align-items-center gap-2 px-3 shadow-sm border-2 fw-bold" onClick={exportExcel} style={{borderRadius: '8px'}}>
            <FaSync /> Xuất Excel
          </button>
          <button className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" onClick={saveAttendance} style={{borderRadius: '8px'}}>
            <FaSave /> Lưu Danh Sách
          </button>
        </div>
      </div>
      
      <div className="card glass-panel border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row mb-4 bg-light p-3 rounded-3 mx-0 align-items-center">
            <div className="col-md-3"><strong>Ngày học:</strong> {sessionInfo.date}</div>
            <div className="col-md-3"><strong>Giờ học:</strong> {sessionInfo.time}</div>
            <div className="col-md-3"><strong>Sĩ số:</strong> {students.length}</div>
            <div className="col-md-3">
              <strong>Trạng thái: </strong>
              {sessionInfo.trangThaiBh === 0 && <span className="badge bg-secondary ms-2">Chưa điểm danh</span>}
              {sessionInfo.trangThaiBh === 1 && <span className="badge bg-success ms-2">Đang mở QR</span>}
              {sessionInfo.trangThaiBh === 2 && <span className="badge bg-primary ms-2">Đã chốt sổ</span>}
            </div>
          </div>

          {/* Khi chưa điểm danh (TrangThaiBh = 0), không hiện bảng */}
          {sessionInfo.trangThaiBh === 0 ? (
            <div className="alert alert-secondary border-0 rounded-4 p-4 text-center">
              <FaExclamationTriangle className="text-warning fs-3 mb-3 d-block mx-auto" />
              <h6 className="fw-bold text-dark mb-1">Buổi học chưa mở điểm danh</h6>
              <p className="text-muted small mb-0">Danh sách điểm danh sẽ xuất hiện sau khi giảng viên mở phiên QR hoặc chốt sổ tay.</p>
            </div>
          ) : (
          <div className="table-responsive border-0">
            <table className="table table-custom table-hover w-100 align-middle mobile-card-view">
              <thead>
                <tr>
                  <th>Mã SV</th>
                  <th>Họ Tên</th>
                  <th style={{width: '200px'}}>Xác Thực</th>
                  <th style={{width: '210px'}}>Trạng Thái Điểm Danh</th>
                  <th>Ghi Chú</th>
                </tr>
              </thead>
              <tbody>
                {students.map((sv) => (
                  <tr key={sv.maSv}>
                    <td data-label="Mã SV" className="fw-semibold text-primary">{sv.maSv}</td>
                    <td data-label="Họ Tên">
                      <div className="d-flex align-items-center py-1">
                        <div className="me-3 bg-secondary bg-opacity-25 text-dark rounded-circle d-flex align-items-center justify-content-center shadow-sm d-none d-md-flex" style={{width: '35px', height: '35px', fontWeight: 'bold'}}>
                          {sv.hoTen?.charAt(0)}
                        </div>
                        <span className="fw-medium text-dark">{sv.hoTen}</span>
                      </div>
                    </td>
                    <td data-label="Xác Thực">
                      {sv.trangThai === 5 ? (
                        <span className="badge bg-danger p-2 w-100 d-flex align-items-center justify-content-center gap-1 shadow-sm" style={{borderRadius: '6px'}}>
                          <FaExclamationTriangle /> GIAN LẬN
                        </span>
                      ) : sv.maThietBiLog ? (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 p-2 w-100 d-flex align-items-center justify-content-center gap-1" style={{borderRadius: '6px'}}>
                          <FaCheck /> Đã xác thực
                        </span>
                      ) : (
                        <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 p-2 w-100 d-flex align-items-center justify-content-center gap-1" style={{borderRadius: '6px'}}>
                           Chưa điểm danh
                        </span>
                      )}
                    </td>
                    <td data-label="Điểm danh">
                      <select 
                        className={`form-select form-select-sm fw-bold border-0 shadow-sm ${
                          sv.trangThai === 1 ? 'bg-success bg-opacity-10 text-success' : 
                          sv.trangThai === 2 ? 'bg-warning bg-opacity-10 text-warning' : 
                          sv.trangThai === 5 ? 'bg-danger bg-opacity-10 text-danger' : 'bg-danger bg-opacity-10 text-danger'
                        }`}
                        value={sv.trangThai}
                        onChange={(e) => handleStatusChange(sv.maSv, e.target.value)}
                        style={{height: '38px', borderRadius: '8px'}}
                      >
                        <option value="1">Có mặt</option>
                        <option value="2">Đi trễ</option>
                        <option value="3">Vắng có phép</option>
                        <option value="4">Vắng không phép</option>
                        {sv.trangThai === 5 && <option value="5">⚠️ Gian lận</option>}
                      </select>
                    </td>
                    <td data-label="Ghi chú">
                      <input 
                        type="text" 
                        className="form-control form-control-sm border-0 bg-light" 
                        placeholder={sv.ghiChu || "Thêm ghi chú..."}
                        value={sv.ghiChu}
                        onChange={(e) => handleNoteChange(sv.maSv, e.target.value)}
                        style={{height: '38px', borderRadius: '8px'}}
                      />
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan="4" className="text-center text-muted py-5"><FaExclamationTriangle className="fs-1 text-warning mb-3 d-block mx-auto"/><p>Lớp hiện không có sinh viên</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualAttendance;
