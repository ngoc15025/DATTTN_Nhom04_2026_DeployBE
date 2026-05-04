import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import axiosClient from '../../utils/axiosClient';

const StudentManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;
  
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
      const res = await axiosClient.get('/sinhvien');
      setStudents(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải sinh viên:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axiosClient.put(`/sinhvien/${formData.maSv}`, {
          hoLot: formData.hoLot,
          tenSv: formData.tenSv,
          lop: formData.lop,
          email: formData.email,
          soDienThoai: formData.soDienThoai
        });
        alert('Cập nhật sinh viên thành công!');
      } else {
        await axiosClient.post('/sinhvien', {
          maSv: formData.maSv,
          taiKhoan: formData.taiKhoan,
          matKhau: formData.matKhau,
          hoLot: formData.hoLot,
          tenSv: formData.tenSv,
          lop: formData.lop,
          email: formData.email,
          soDienThoai: formData.soDienThoai
        });
        alert('Thêm sinh viên thành công!');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu dữ liệu.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cảnh báo: Xoá thẻ sinh viên này sẽ vĩnh viễn xoá dữ liệu liên đới. Vẫn tiếp tục?')) {
      try {
        await axiosClient.delete(`/sinhvien/${id}`);
        alert('Đã xóa sinh viên thành công.');
        fetchStudents();
      } catch (err) {
        alert(err.response?.data?.message || 'Không thể xóa sinh viên này.');
      }
    }
  };

  const openAdd = () => {
    setFormData({ maSv: '', hoLot: '', tenSv: '', taiKhoan: '', matKhau: '', lop: '', email: '', soDienThoai: '' });
    setEditMode(false);
    setShowModal(true);
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) { alert('File Excel không có dữ liệu!'); return; }
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
      if (payload.length === 0) { alert('Không tìm thấy dữ liệu hợp lệ. Cần cột: Mã sinh viên, Họ lót, Tên, Mã lớp.'); return; }
      const res = await axiosClient.post('/sinhvien/import', payload);
      alert(res.data.message);
      fetchStudents();
    } catch (err) {
      console.error(err);
      alert('Lỗi xử lý file Excel.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const openEdit = (sv) => {
    // Tách tên tạm thời nếu BE trả về HoTen gộp (nhưng tốt nhất BE nên trả tách)
    // Ở đây BE Controller.cs GetAll đang gộp: HoTen = s.HoLot + " " + s.TenSv
    // Ta sẽ phỏng đoán: TenSv là chữ cuối cùng, còn lại là HoLot
    const parts = sv.hoTen.trim().split(' ');
    const tenSv = parts.pop();
    const hoLot = parts.join(' ');

    setFormData({ 
      maSv: sv.maSv, 
      hoLot: hoLot, 
      tenSv: tenSv, 
      taiKhoan: sv.taiKhoan, 
      matKhau: '********', // Không sửa pass qua đây hoặc để trống
      lop: sv.lop || '', 
      email: sv.email || '', 
      soDienThoai: sv.soDienThoai || '' 
    });
    setEditMode(true);
    setShowModal(true);
  };

  // Lọc theo từ khóa tìm kiếm
  const filtered = students
    .filter(item =>
      (item.hoTen || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.maSv || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    // Sắp xếp A-Z theo Tên (chữ cuối trong HoTen)
    .sort((a, b) => {
      const tenA = (a.hoTen || '').trim().split(' ').pop().toLowerCase();
      const tenB = (b.hoTen || '').trim().split(' ').pop().toLowerCase();
      return tenA.localeCompare(tenB, 'vi');
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset về trang 1 khi người dùng tìm kiếm
  const handleSearch = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <h3 className="m-0 fw-bold text-dark">Dữ liệu Sinh Viên Tổng</h3>
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
                <input type="text" className="form-control border-0 bg-white" placeholder="Tra cứu sinh viên theo tên/MSSV..." value={searchTerm} onChange={(e) => handleSearch(e.target.value)} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div><p className="mt-2 text-muted">Đang tải dữ liệu từ máy chủ...</p></div>
          ) : (
          <div className="table-responsive">
            <table className="table table-custom table-hover w-100 align-middle">
              <thead><tr><th>Mã Sinh Viên</th><th>Họ Tên</th><th>Lớp</th><th>Email liên hệ</th><th>Tài khoản cổng</th><th className="text-end">Tác vụ</th></tr></thead>
              <tbody>
                {paginated.map(item => (
                  <tr key={item.maSv}>
                    <td className="fw-semibold text-primary">{item.maSv}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold" style={{width: '35px', height: '35px'}}>
                          {(item.hoTen || 'S').charAt(0)}
                        </div>
                        <span className="fw-medium text-dark">{item.hoTen}</span>
                      </div>
                    </td>
                    <td><span className="badge bg-light text-dark border">{item.lop || 'N/A'}</span></td>
                    <td><span className="text-muted">{item.email || 'Chưa cập nhật'}</span></td>
                    <td><span className="font-monospace text-muted">{item.taiKhoan}</span></td>
                    <td className="text-end">
                      <button onClick={()=>openEdit(item)} className="btn btn-sm btn-light border me-2 text-primary hover-primary"><FaEdit /></button>
                      <button onClick={()=>handleDelete(item.maSv)} className="btn btn-sm btn-light border text-danger hover-danger"><FaTrash /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="6" className="text-center py-5 text-muted">Không tìm thấy sinh viên nào.</td></tr>}
              </tbody>
            </table>
          </div>
          )}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center pt-3 mt-2 border-top">
              <span className="text-muted small">
                Hiển thị <strong>{(currentPage - 1) * PAGE_SIZE + 1}</strong>–<strong>{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong> / <strong>{filtered.length}</strong> sinh viên
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0 gap-1">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button className="page-link rounded-2 border-0 bg-light" onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === '...' ? (
                        <li key={`ellipsis-${idx}`} className="page-item disabled">
                          <span className="page-link border-0 bg-transparent">…</span>
                        </li>
                      ) : (
                        <li key={p} className={`page-item ${currentPage === p ? 'active' : ''}`}>
                          <button
                            className={`page-link rounded-2 border-0 ${currentPage === p ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                            onClick={() => setCurrentPage(p)}
                          >{p}</button>
                        </li>
                      )
                    )
                  }
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link rounded-2 border-0 bg-light" onClick={() => setCurrentPage(p => p + 1)}>›</button>
                  </li>
                </ul>
              </nav>
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
                  <h5 className="modal-title fw-bold text-dark">{editMode ? 'Chỉnh sửa Hồ Sơ Sinh viên' : 'Đăng ký Sinh viên mới'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">MSSV <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" value={formData.maSv} onChange={e => setFormData({...formData, maSv: e.target.value})} required disabled={editMode} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Họ và Tên lót <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" value={formData.hoLot} onChange={e => setFormData({...formData, hoLot: e.target.value})} required />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Tên Sinh viên <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" value={formData.tenSv} onChange={e => setFormData({...formData, tenSv: e.target.value})} required />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Lớp Sinh hoạt <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" placeholder="VD: D10CQCN01" value={formData.lop} onChange={e => setFormData({...formData, lop: e.target.value})} required />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Tài khoản truy cập <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0" value={formData.taiKhoan} onChange={e => setFormData({...formData, taiKhoan: e.target.value})} required disabled={editMode} />
                      </div>
                      {!editMode && (
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-bold text-muted">Mật khẩu cấp phát <span className="text-danger">*</span></label>
                          <input type="password" autoComplete="new-password" className="form-control bg-light border-0" value={formData.matKhau} onChange={e => setFormData({...formData, matKhau: e.target.value})} required />
                        </div>
                      )}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Số điện thoại</label>
                        <input type="text" className="form-control bg-light border-0" value={formData.soDienThoai} onChange={e => setFormData({...formData, soDienThoai: e.target.value})} />
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-bold text-muted">Email sinh viên</label>
                        <input type="email" className="form-control bg-light border-0" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
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
export default StudentManagement;
