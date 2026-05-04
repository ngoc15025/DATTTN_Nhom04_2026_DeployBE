import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import axiosClient from '../../utils/axiosClient';

const LecturerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ 
    maGv: '', 
    hoLot: '', 
    tenGv: '', 
    taiKhoan: '', 
    matKhau: '', 
    email: '', 
    soDienThoai: '',
    trangThai: 1
  });

  const fetchLecturers = async () => {
    try {
      const res = await axiosClient.get('/giangvien');
      setLecturers(res.data || []);
    } catch (err) {
      console.error('Lỗi tải giảng viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLecturers(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axiosClient.put(`/giangvien/${formData.maGv}`, {
          hoLot: formData.hoLot,
          tenGv: formData.tenGv,
          email: formData.email,
          soDienThoai: formData.soDienThoai,
          trangThai: Number(formData.trangThai)
        });
        alert('Cập nhật hồ sơ giảng viên thành công!');
      } else {
        await axiosClient.post('/giangvien', {
          maGv: formData.maGv,
          taiKhoan: formData.taiKhoan,
          matKhau: formData.matKhau,
          hoLot: formData.hoLot,
          tenGv: formData.tenGv,
          email: formData.email,
          soDienThoai: formData.soDienThoai
        });
        alert('Thêm giảng viên thành công!');
      }
      setShowModal(false);
      fetchLecturers();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };



  const openAdd = () => {
    setFormData({ maGv: '', hoLot: '', tenGv: '', taiKhoan: '', matKhau: '', email: '', soDienThoai: '' });
    setEditMode(false);
    setShowModal(true);
  };

  const openEdit = (gv) => {
    setFormData({ 
      maGv: gv.maGv, 
      hoLot: gv.hoLot || '', 
      tenGv: gv.tenGv || '', 
      taiKhoan: gv.taiKhoan, 
      matKhau: '********', 
      email: gv.email || '', 
      soDienThoai: gv.soDienThoai || '',
      trangThai: gv.trangThai !== undefined ? gv.trangThai : 1
    });
    setEditMode(true);
    setShowModal(true);
  };

  const filtered = lecturers.filter(item => {
    const fullName = `${item.hoLot} ${item.tenGv}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           (item.maGv || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <h3 className="m-0 fw-bold text-dark">Quản lý Giảng viên</h3>
        <button onClick={openAdd} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" style={{borderRadius: '8px', padding: '10px 20px'}}>
          <FaUserPlus /> Thêm Giảng Viên Mới
        </button>
      </div>

      <div className="card glass-panel border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row mb-4">
            <div className="col-md-6 col-lg-4">
              <div className="input-group overflow-hidden shadow-sm" style={{borderRadius: '8px'}}>
                <span className="input-group-text bg-white border-0 text-muted"><FaSearch /></span>
                <input type="text" className="form-control border-0 bg-white" placeholder="Tìm kiếm tên hoặc mã giảng viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div><p className="mt-2 text-muted">Đang tải dữ liệu từ máy chủ...</p></div>
          ) : (
          <div className="table-responsive">
            <table className="table table-custom table-hover w-100 align-middle">
              <thead><tr><th>Mã Giảng Viên</th><th>Họ Tên</th><th>Tài khoản</th><th>Trạng thái</th><th className="text-end">Thao tác</th></tr></thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.maGv}>
                    <td className="fw-semibold text-primary">{item.maGv}</td>
                    <td className="fw-medium text-dark">{item.hoLot} {item.tenGv}</td>
                    <td><span className="font-monospace text-muted">{item.taiKhoan}</span></td>
                    <td>
                      <span className={`badge ${item.trangThai ? 'bg-success' : 'bg-secondary'} bg-opacity-10 ${item.trangThai ? 'text-success border-success' : 'text-secondary border-secondary'} border border-opacity-25 px-3 py-2 rounded-pill`}>
                        {item.trangThai ? 'Hoạt động' : 'Vô hiệu'}
                      </span>
                    </td>
                    <td className="text-end">
                      <button onClick={() => openEdit(item)} className="btn btn-sm btn-light border text-primary hover-primary"><FaEdit /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-muted">Không có dữ liệu. Hãy tạo mới.</td></tr>}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop fade show" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header bg-light border-0 rounded-top-4">
                  <h5 className="modal-title fw-bold text-dark">{editMode ? 'Chỉnh sửa Hồ Sơ Giảng Viên' : 'Khai báo Giảng Viên'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Mã Giảng Viên <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" value={formData.maGv} onChange={e => setFormData({...formData, maGv: e.target.value})} required disabled={editMode} placeholder="VD: GV06" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Họ và tên lót <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" value={formData.hoLot} onChange={e => setFormData({...formData, hoLot: e.target.value})} required placeholder="Nguyễn Văn" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Tên <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" value={formData.tenGv} onChange={e => setFormData({...formData, tenGv: e.target.value})} required placeholder="A" />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Tài khoản truy cập <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" value={formData.taiKhoan} onChange={e => setFormData({...formData, taiKhoan: e.target.value})} required disabled={editMode} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Mật khẩu cấp phát <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" value={formData.matKhau} onChange={e => setFormData({...formData, matKhau: e.target.value})} required />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Email liên hệ</label>
                        <input type="email" className="form-control bg-light border-0" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Số Điện Thoại</label>
                        <input type="text" className="form-control bg-light border-0" value={formData.soDienThoai} onChange={e => setFormData({...formData, soDienThoai: e.target.value})} />
                      </div>
                      {editMode && (
                        <div className="col-12">
                          <label className="form-label small fw-bold text-muted">Trạng thái tài khoản</label>
                          <select
                            className={`form-select border-0 fw-semibold ${
                              Number(formData.trangThai) === 1
                                ? 'bg-success bg-opacity-10 text-success'
                                : 'bg-danger bg-opacity-10 text-danger'
                            }`}
                            value={formData.trangThai}
                            onChange={e => setFormData({...formData, trangThai: e.target.value})}
                          >
                            <option value={1}>✅ Hoạt động — Giảng viên có thể đăng nhập</option>
                            <option value={0}>🔒 Bị khóa — Chặn đăng nhập</option>
                          </select>
                          {Number(formData.trangThai) === 0 && (
                            <div className="alert alert-warning py-2 small mt-2 mb-0">
                              ⚠️ Giảng viên này sẽ không thể đăng nhập vào hệ thống sau khi lưu.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer border-0 bg-light rounded-bottom-4">
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Thực Thi Dữ Liệu</button>
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
export default LecturerManagement;
