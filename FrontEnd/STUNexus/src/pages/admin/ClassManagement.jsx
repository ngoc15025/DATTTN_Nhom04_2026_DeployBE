import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlus, FaArrowRight, FaArrowLeft, FaUsers, FaTrash } from 'react-icons/fa';
import axiosClient from '../../utils/axiosClient';
import { AuthContext } from '../../context/AuthContext';

const ClassManagement = () => {
  const { monId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [classes, setClasses] = useState([]);
  const [subjectInfo, setSubjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    maLop: '',
    tenLop: '',
    maGv: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    gioBatDau: '',
    gioKetThuc: '',
    soBuoiHoc: 15
  });
  const [lecturers, setLecturers] = useState([]);

  const fetchData = async () => {
    try {
      // Lấy thông tin môn học
      const monRes = await axiosClient.get(`/monhocs/${monId}`);
      setSubjectInfo(monRes.data);

      // Lấy danh sách lớp học -> filter theo mã môn
      const gvParam = user?.role === 'lecturer' ? `?maGv=${user.MaGV || user.MaId}` : '';
      const lopRes = await axiosClient.get(`/lophoc${gvParam}`);
      const allClasses = lopRes.data?.data || lopRes.data || [];
      setClasses(allClasses.filter(c => c.maMon === monId));

      // Lấy danh sách giảng viên để chọn
      const gvRes = await axiosClient.get('/giangvien');
      setLecturers(gvRes.data || []);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [monId]);

  // Tínnh ngày kết thúc: ngày bắt đầu + (số buổi - 1) tuần (mỗi tuần 1 buổi)
  const calcEndDate = (startDateStr, sessions) => {
    if (!startDateStr || !sessions || sessions < 1) return '';
    const start = new Date(startDateStr);
    start.setDate(start.getDate() + (sessions - 1) * 7);
    return start.toISOString().split('T')[0];
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/lophoc', {
        ...formData,
        gioBatDau: formData.gioBatDau.length === 5 ? formData.gioBatDau + ':00' : formData.gioBatDau,
        gioKetThuc: formData.gioKetThuc.length === 5 ? formData.gioKetThuc + ':00' : formData.gioKetThuc,
        maMon: monId,
        maGv: formData.maGv || user?.MaGV || user?.MaId
      });
      alert('Tạo lớp học và lập lịch thành công!');
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo lớp học! Vui lòng kiểm tra lại thông tin.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cảnh báo: Xoá lớp học này sẽ xoá vĩnh viễn toàn bộ dữ liệu lịch học, điểm danh, và danh sách sinh viên trực thuộc. Bạn có chắc chắn muốn xóa?')) {
      try {
        const res = await axiosClient.delete(`/lophoc/${id}`);
        alert(res.data?.message || 'Xóa lớp học thành công.');
        fetchData(); // Refresh list
      } catch (err) {
        alert(err.response?.data?.message || 'Có lỗi xảy ra khi xóa lớp học.');
      }
    }
  };

  const openAdd = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 4);

    setFormData({
      maLop: `LPT_${Date.now().toString().slice(-5)}`,
      tenLop: `${subjectInfo?.tenMon || 'Lớp'} - `,
      maGv: user?.role === 'lecturer' ? user.MaGV : '',
      ngayBatDau: today,
      ngayKetThuc: calcEndDate(today, 15), // Tự tính: 15 buổi = 14 tuần sau ngày bắt đầu
      gioBatDau: '07:00',
      gioKetThuc: '09:30',
      soBuoiHoc: 15
    });
    setShowModal(true);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-light rounded-circle shadow-sm" style={{ width: '40px', height: '40px' }} onClick={() => navigate('/lecturer/subjects')}><FaArrowLeft /></button>
          <h3 className="m-0 fw-bold text-dark">Quản lý Lớp học - <span className="text-primary">{subjectInfo?.tenMon || monId}</span></h3>
        </div>
        <button onClick={openAdd} className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" style={{ borderRadius: '8px' }}>
          <FaPlus /> Mở Lớp Học Phần Mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div><p className="mt-2 text-muted">Đang tải...</p></div>
      ) : (
        <div className="row g-4">
          {classes.length > 0 ? classes.map(c => (
            <div className="col-12 col-md-6 col-xl-4" key={c.maLop}>
              <div className="card glass-panel border-0 shadow-sm h-100 position-relative overflow-hidden" style={{ borderRadius: '12px' }}>
                <button onClick={() => handleDelete(c.maLop)} className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle shadow d-flex justify-content-center align-items-center" style={{ zIndex: 10, width: '30px', height: '30px', padding: 0 }} title="Xóa Lớp"><FaTrash /></button>
                <div className="card-body p-4 d-flex flex-column pt-5">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-3">
                      <FaUsers className="fs-3" />
                    </div>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 rounded-pill">Đang mở</span>
                  </div>
                  <h5 className="fw-bold mb-1 text-dark pe-4">{c.tenLop}</h5>
                  <p className="text-muted small mb-1">Mã Lớp: {c.maLop}</p>
                  {c.tenGiangVien && <p className="text-muted small mb-4">GV: {c.tenGiangVien}</p>}

                  <div className="mt-auto d-flex flex-column gap-2">
                    <button onClick={() => navigate(`/lecturer/class-students/${c.maLop}`)} className="btn btn-outline-primary w-100 d-flex justify-content-center align-items-center gap-2 fw-semibold py-2 rounded-pill shadow-sm">
                      Danh sách Sinh viên <FaUsers />
                    </button>
                    <button onClick={() => navigate(`/lecturer/sessions/${c.maLop}`)} className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2 fw-semibold py-2 rounded-pill shadow-sm">
                      Quản lý Điểm danh <FaArrowRight />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm border-0">
              <h5 className="text-muted fw-bold mb-2">Chưa có lớp nào mở</h5>
              <p className="text-muted">Môn học này chưa có lớp học phần nào được khởi tạo.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <>
          <div className="modal-backdrop fade show" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header bg-light border-0 rounded-top-4">
                  <h5 className="modal-title fw-bold text-dark">Lập Lớp Học Phần Mới</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">Mã Lớp Học <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0 py-2" value={formData.maLop} onChange={e => setFormData({ ...formData, maLop: e.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">Tên Danh Nghĩa Lớp <span className="text-danger">*</span></label>
                        <input type="text" className="form-control bg-light border-0 py-2" value={formData.tenLop} onChange={e => setFormData({ ...formData, tenLop: e.target.value })} required placeholder="VD: Lớp Ca 1 - Thứ 2" />
                      </div>

                      {user?.role === 'admin' && (
                        <div className="col-12">
                          <label className="form-label small fw-bold text-muted">Giảng viên phụ trách <span className="text-danger">*</span></label>
                          <select className="form-select bg-light border-0 py-2" value={formData.maGv} onChange={e => setFormData({ ...formData, maGv: e.target.value })} required>
                            <option value="">-- Chọn Giảng Viên --</option>
                            {lecturers.map(gv => (
                              <option key={gv.maGv} value={gv.maGv}>{gv.hoLot} {gv.tenGv} ({gv.maGv})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">Ngày bắt đầu <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control bg-light border-0 py-2"
                          value={formData.ngayBatDau}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          onChange={e => {
                            const newStart = e.target.value;
                            setFormData(f => ({
                              ...f,
                              ngayBatDau: newStart,
                              ngayKetThuc: calcEndDate(newStart, f.soBuoiHoc)
                            }));
                          }}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">
                          Ngày Kết thúc (Dự kiến)

                        </label>
                        <input
                          type="date"
                          className="form-control bg-light border-0 py-2 text-muted"
                          value={formData.ngayKetThuc}
                          readOnly
                          style={{ cursor: 'default', backgroundColor: '#f0f4ff' }}
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted">Giờ vào học <span className="text-danger">*</span></label>
                        <input type="time" className="form-control bg-light border-0 py-2" value={formData.gioBatDau} onChange={e => setFormData({ ...formData, gioBatDau: e.target.value })} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted">Giờ Tan học <span className="text-danger">*</span></label>
                        <input type="time" className="form-control bg-light border-0 py-2" value={formData.gioKetThuc} onChange={e => setFormData({ ...formData, gioKetThuc: e.target.value })} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label small fw-bold text-muted">Số buổi học <span className="text-danger">*</span></label>
                        <input
                          type="number"
                          className="form-control bg-light border-0 py-2"
                          value={formData.soBuoiHoc}
                          required
                          min="1"
                          onChange={e => {
                            const sessions = parseInt(e.target.value) || 1;
                            setFormData(f => ({
                              ...f,
                              soBuoiHoc: sessions,
                              ngayKetThuc: calcEndDate(f.ngayBatDau, sessions)
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-0 bg-light rounded-bottom-4">
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Khởi Tạo Lớp</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
export default ClassManagement;
