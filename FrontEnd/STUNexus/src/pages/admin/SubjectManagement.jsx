import React, { useState, useEffect, useContext } from 'react';
import { FaPlus, FaSearch, FaLayerGroup, FaEdit, FaTrash } from 'react-icons/fa';
import axiosClient from '../../utils/axiosClient';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const SubjectManagement = () => {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ maMon: '', tenMon: '' });

  const fetchSubjects = async () => {
    try {
      const gvParam = user?.role === 'lecturer' ? `?maGv=${user.MaGV || user.MaId}` : '';
      const res = await axiosClient.get(`/monhocs${gvParam}`);
      setSubjects(res.data || []);
    } catch (err) {
      console.error('Lỗi tải môn học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axiosClient.put(`/MonHocs/${formData.maMon}`, formData);
      } else {
        await axiosClient.post('/MonHocs', formData);
      }
      setShowModal(false);
      fetchSubjects(); // Reload từ DB thật
    } catch (err) {
      alert(err.response?.data?.Message || err.response?.data?.message || 'Lỗi xử lý dữ liệu!');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cảnh báo: Xoá học phần này có thể cắt đứt liên kết tới danh sách Các Lớp đang mở của môn này. Xác nhận xoá?')) {
      try {
        await axiosClient.delete(`/MonHocs/${id}`);
        fetchSubjects();
      } catch (err) {
        alert(err.response?.data?.Message || 'Không thể xoá! Môn học đang được sử dụng.');
      }
    }
  };

  const openAdd = () => {
    setFormData({ maMon: '', tenMon: '' });
    setEditMode(false);
    setShowModal(true);
  };

  const openEdit = (mon) => {
    setFormData({ maMon: mon.maMon, tenMon: mon.tenMon });
    setEditMode(true);
    setShowModal(true);
  };

  const filtered = subjects.filter(s => 
    (s.tenMon || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.maMon || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <h3 className="m-0 fw-bold text-dark">Quản lý Môn học</h3>
        <button onClick={openAdd} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" style={{borderRadius: '8px', padding: '10px 20px'}}>
          <FaPlus /> Thêm Môn Học Mới
        </button>
      </div>

      <div className="card glass-panel border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row mb-4">
            <div className="col-md-6 col-lg-4">
              <div className="input-group overflow-hidden shadow-sm" style={{borderRadius: '8px'}}>
                <span className="input-group-text bg-white border-0 text-muted"><FaSearch /></span>
                <input type="text" className="form-control border-0 bg-white" placeholder="Tìm kiếm bộ môn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div><p className="mt-2 text-muted">Đang tải dữ liệu từ máy chủ...</p></div>
          ) : (
          <div className="table-responsive">
            <table className="table table-custom table-hover w-100 align-middle">
              <thead><tr><th style={{width: '20%'}}>Mã Môn</th><th style={{width: '50%'}}>Tên Môn Học Phần</th><th className="text-end" style={{width: '30%'}}>Hành Động</th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.maMon}>
                    <td className="fw-semibold text-primary">{item.maMon}</td>
                    <td className="fw-medium text-dark">{item.tenMon}</td>
                    <td className="text-end">
                      <button onClick={() => navigate(`/lecturer/subjects/${item.maMon}/classes`)} className="btn btn-sm btn-primary me-2 px-3 fw-bold shadow-sm" title="Quản lý Ca / Lớp học">
                        <FaLayerGroup className="me-1" /> Mở Lớp Học
                      </button>
                      <button onClick={() => openEdit(item)} className="btn btn-sm btn-light border me-2 text-primary hover-primary"><FaEdit /></button>
                      <button onClick={() => handleDelete(item.maMon)} className="btn btn-sm btn-light border text-danger hover-danger"><FaTrash /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-muted">Không tìm thấy môn học nào phù hợp. Bấm "Thêm Môn Học Mới".</td></tr>}
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
                  <h5 className="modal-title fw-bold text-dark">{editMode ? 'Chỉnh sửa Môn Học' : 'Thêm Mới Môn Học'}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">Mã Học Phần <span className="text-danger">*</span></label>
                      <input type="text" className="form-control bg-light border-0" value={formData.maMon} onChange={e => setFormData({...formData, maMon: e.target.value})} required disabled={editMode} placeholder="VD: THCB01" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold text-muted">Tên Môn Học <span className="text-danger">*</span></label>
                      <input type="text" className="form-control bg-light border-0" value={formData.tenMon} onChange={e => setFormData({...formData, tenMon: e.target.value})} required placeholder="Toán Cao Cấp 1" />
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
export default SubjectManagement;
