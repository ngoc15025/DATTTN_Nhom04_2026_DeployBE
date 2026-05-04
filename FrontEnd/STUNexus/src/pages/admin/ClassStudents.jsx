import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUserPlus, FaSearch, FaArrowLeft, FaSync, FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import axiosClient from '../../utils/axiosClient';

const ClassStudents = () => {
  const { maLop } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [foundStudent, setFoundStudent] = useState(null); // null = chưa tra, object = tìm thấy, false = không có
  
  const [formData, setFormData] = useState({ 
    maSv: '', 
    hoLot: '', 
    tenSv: '', 
    taiKhoan: '', 
    matKhau: '', 
    lop: '', 
    email: '', 
    soDienThoai: '' 
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/lophoc/${maLop}/students`);
      setStudents(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải sinh viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [maLop]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post(`/lophoc/${maLop}/add-new-student`, {
        maSv: formData.maSv,
        taiKhoan: formData.taiKhoan,
        matKhau: formData.matKhau,
        hoLot: formData.hoLot,
        tenSv: formData.tenSv,
        lop: formData.lop,
        email: formData.email,
        soDienThoai: formData.soDienThoai
      });
      alert('Thêm sinh viên vào lớp thành công (hoặc sinh viên đã được liên kết)!');
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi thêm sinh viên.');
    }
  };

  const openAdd = () => {
    setFormData({ maSv: '', hoLot: '', tenSv: '', taiKhoan: '', matKhau: '', lop: '', email: '', soDienThoai: '' });
    setFoundStudent(null);
    setShowModal(true);
  };

  // Tra cứu sinh viên theo MSSV từ danh sách tổng
  const handleMssvLookup = async (maSv) => {
    setFormData(prev => ({ ...prev, maSv }));
    if (maSv.length < 3) { setFoundStudent(null); return; }
    setLookupLoading(true);
    try {
      const res = await axiosClient.get('/sinhvien');
      const allStudents = res.data.data || [];
      const found = allStudents.find(s => s.maSv === maSv);
      if (found) {
        // Tách họ lót và tên
        const parts = (found.hoTen || '').trim().split(' ');
        const tenSv = parts.pop();
        const hoLot = parts.join(' ');
        setFormData({
          maSv: found.maSv,
          hoLot: hoLot,
          tenSv: tenSv,
          taiKhoan: found.taiKhoan || found.maSv,
          matKhau: '',
          lop: found.lop || '',
          email: found.email || '',
          soDienThoai: found.soDienThoai || ''
        });
        setFoundStudent(found);
      } else {
        setFoundStudent(false);
      }
    } catch (err) {
      setFoundStudent(false);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('File Excel không có dữ liệu!');
        return;
      }

      const payload = jsonData.map(row => ({
        maSv: String(row['Mã sinh viên'] || ''),
        taiKhoan: String(row['Mã sinh viên'] || ''),
        matKhau: '123456',
        hoLot: String(row['Họ lót'] || ''),
        tenSv: String(row['Tên'] || ''),
        lop: String(row['Mã lớp'] || ''),
        email: String(row['Email'] || ''),
        soDienThoai: String(row['SĐT'] || row['Số điện thoại'] || '')
      })).filter(x => x.maSv && x.tenSv && x.lop);

      if (payload.length === 0) {
        alert('Không tìm thấy dữ liệu hợp lệ. Cần các cột: Mã sinh viên, Họ lót, Tên, Mã lớp.');
        return;
      }

      const res = await axiosClient.post(`/lophoc/${maLop}/import-students`, payload);
      alert(res.data.message);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert('Lỗi xử lý file Excel hoặc dữ liệu gửi lên.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const filtered = students.filter(item => 
    (item.hoTen || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.maSv || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleResetDevice = async (maSv, tenSv) => {
    if (window.confirm(`Bạn có chắc chắn muốn reset thiết bị cho SV ${tenSv} (${maSv})?\n\nViệc này sẽ xóa liên kết thiết bị hiện tại, cho phép sinh viên đăng ký lại Passkey ở máy mới.`)) {
      try {
        const res = await axiosClient.post(`/giangvien/${maSv}/reset-device`);
        alert(res.data.message || 'Đã reset Passkey & thiết bị thành công!');
        fetchStudents(); // Refresh danh sách để cập nhật trạng thái
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Lỗi khi reset thiết bị!');
      }
    }
  };

  const handleRemoveStudent = async (maSv, tenSv) => {
    if (window.confirm(`⚠️ CẢNH BÁO: Bạn có chắc muốn rút sinh viên ${tenSv} (${maSv}) khỏi lớp này?\n\nHành động này cũng sẽ XÓA SẠCH toàn bộ kết quả điểm danh của sinh viên này trong riêng khuôn khổ lớp học hiện tại.\n\nNhấn OK để xóa vĩnh viễn!`)) {
      try {
        const res = await axiosClient.delete(`/lophoc/${maLop}/remove-student/${maSv}`);
        alert(res.data.message || 'Đã xóa sinh viên khỏi lớp!');
        fetchStudents(); // Tải lại danh sách
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || 'Lỗi khi xóa sinh viên khỏi lớp!');
      }
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle shadow-sm" style={{width: '40px', height: '40px'}} onClick={() => navigate(-1)}><FaArrowLeft /></button>
          <h3 className="m-0 fw-bold text-dark">Danh sách Sinh viên - Lớp <span className="text-primary">{maLop}</span></h3>
        </div>
        <div className="d-flex gap-2">
          <label className="btn btn-outline-success d-flex align-items-center gap-2 shadow-sm mb-0" style={{borderRadius: '8px', padding: '10px 20px', cursor: 'pointer'}}>
            {uploading ? <div className="spinner-border spinner-border-sm"></div> : <FaUserPlus />} Thêm bằng file Excel
            <input type="file" accept=".xlsx, .xls" hidden onChange={handleExcelUpload} disabled={uploading} />
          </label>
          <button onClick={openAdd} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" style={{borderRadius: '8px', padding: '10px 20px'}}>
            <FaUserPlus /> Thêm từng sinh viên
          </button>
        </div>
      </div>

      <div className="card glass-panel border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row mb-4">
            <div className="col-md-6 col-lg-4">
              <div className="input-group overflow-hidden shadow-sm" style={{borderRadius: '8px'}}>
                <span className="input-group-text bg-white border-0 text-muted"><FaSearch /></span>
                <input type="text" className="form-control border-0 bg-white" placeholder="Tra cứu sinh viên theo tên/MSSV..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div><p className="mt-2 text-muted">Đang tải dữ liệu từ máy chủ...</p></div>
          ) : (
          <div className="table-responsive">
            <table className="table table-custom table-hover w-100 align-middle">
              <thead><tr><th>Mã Sinh Viên</th><th>Họ Tên</th><th>Tài khoản cổng</th><th>Xác thực Passkey</th><th>SĐT</th><th className="text-end pe-4">Hành động</th></tr></thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.maSv}>
                    <td className="fw-semibold text-primary">{item.maSv}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold" style={{width: '35px', height: '35px'}}>
                          {(item.hoTen || 'S').charAt(0)}
                        </div>
                        <div className="d-flex flex-column">
                          <span className="fw-medium text-dark">{item.hoTen}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="font-monospace text-muted">{item.taiKhoan}</span></td>
                    <td>
                      {item.hasPasskey ? (
                        <div>
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1">Hợp lệ</span>
                          <button 
                              onClick={() => handleResetDevice(item.maSv, item.hoTen)}
                              className="btn btn-link p-0 text-decoration-none text-danger small d-block mt-1 d-flex align-items-center gap-1"
                              style={{fontSize: '0.75rem', opacity: 0.8}}
                          >
                              <FaSync /> Reset Passkey
                          </button>
                        </div>
                      ) : (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1">Chưa đăng ký</span>
                      )}
                    </td>
                    <td><span className="text-muted">{item.soDienThoai || 'N/A'}</span></td>
                    <td className="text-end pe-4">
                      <button 
                         onClick={() => handleRemoveStudent(item.maSv, item.hoTen)}
                         className="btn btn-outline-danger btn-sm rounded-circle d-inline-flex justify-content-center align-items-center bg-danger bg-opacity-10"
                         style={{width: '32px', height: '32px', border: 'none'}}
                         title="Rút sinh viên khỏi lớp"
                      >
                         <FaTrash size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="6" className="text-center py-5 text-muted">Lớp học này chưa có sinh viên nào.</td></tr>}
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
                  <h5 className="modal-title fw-bold text-dark">Thêm Sinh Viên vào Lớp</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSave} autoComplete="off">
                  <div className="modal-body p-4">
                    <div className="alert alert-info py-2 small mb-3">
                      Lưu ý: Nếu sinh viên đã có thông tin trên hệ thống, hệ thống sẽ tự động gán vào lớp mà không tạo trùng lặp.
                    </div>
                    <div className="row g-3">
                      {/* Ô nhập MSSV - luôn hiển thị */}
                      <div className="col-12">
                        <label className="form-label small fw-bold text-muted">MSSV <span className="text-danger">*</span></label>
                        <div className="input-group">
                          <input
                            type="text"
                            autoComplete="off"
                            className="form-control bg-light border-0"
                            placeholder="Nhập MSSV để tra cứu..."
                            value={formData.maSv}
                            onChange={e => handleMssvLookup(e.target.value)}
                            required
                          />
                          {lookupLoading && (
                            <span className="input-group-text bg-white border-0">
                              <div className="spinner-border spinner-border-sm text-primary"></div>
                            </span>
                          )}
                        </div>
                        {foundStudent === false && formData.maSv.length >= 3 && (
                          <div className="text-warning small mt-1">⚠️ MSSV không tìm thấy trong hệ thống. Sinh viên mới sẽ được tạo.</div>
                        )}
                        {foundStudent && (
                          <div className="text-success small mt-1">✅ Tìm thấy: <strong>{foundStudent.hoTen}</strong> — Tự động điền thông tin bên dưới.</div>
                        )}
                      </div>

                      {/* Chỉ hiển thị thông tin khi đã tra cứu (tìm thấy hoặc không tìm thấy) */}
                      {formData.maSv.length >= 3 && (
                        <>
                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-bold text-muted">Họ và Tên lót <span className="text-danger">*</span></label>
                            <input type="text" autoComplete="off" className="form-control bg-light border-0" value={formData.hoLot} onChange={e => setFormData({...formData, hoLot: e.target.value})} required disabled={!!foundStudent} />
                          </div>
                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-bold text-muted">Tên Sinh viên <span className="text-danger">*</span></label>
                            <input type="text" autoComplete="off" className="form-control bg-light border-0" value={formData.tenSv} onChange={e => setFormData({...formData, tenSv: e.target.value})} required disabled={!!foundStudent} />
                          </div>
                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-bold text-muted">Lớp Sinh hoạt <span className="text-danger">*</span></label>
                            <input type="text" autoComplete="off" className="form-control bg-light border-0" placeholder="VD: D21_TH01" value={formData.lop} onChange={e => setFormData({...formData, lop: e.target.value})} required disabled={!!foundStudent} />
                          </div>
                          <div className="col-12 col-md-6">
                            <label className="form-label small fw-bold text-muted">Email sinh viên</label>
                            <input type="email" autoComplete="off" className="form-control bg-light border-0" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!!foundStudent} />
                          </div>
                          {/* Chỉ yêu cầu mật khẩu khi tạo sinh viên mới */}
                          {!foundStudent && (
                            <>
                              <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-muted">Tài khoản truy cập <span className="text-danger">*</span></label>
                                <input type="text" autoComplete="off" className="form-control bg-light border-0" value={formData.taiKhoan} onChange={e => setFormData({...formData, taiKhoan: e.target.value})} required />
                              </div>
                              <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-muted">Mật khẩu cấp phát <span className="text-danger">*</span></label>
                                <input type="password" autoComplete="new-password" className="form-control bg-light border-0" value={formData.matKhau} onChange={e => setFormData({...formData, matKhau: e.target.value})} required />
                              </div>
                              <div className="col-12 col-md-6">
                                <label className="form-label small fw-bold text-muted">Số điện thoại</label>
                                <input type="text" autoComplete="off" className="form-control bg-light border-0" value={formData.soDienThoai} onChange={e => setFormData({...formData, soDienThoai: e.target.value})} />
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer border-0 bg-light rounded-bottom-4">
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Lưu Dữ Liệu</button>
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

export default ClassStudents;
