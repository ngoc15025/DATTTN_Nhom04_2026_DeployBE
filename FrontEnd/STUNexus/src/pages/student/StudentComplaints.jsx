import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axiosClient from '../../utils/axiosClient';
import { FaCheckCircle, FaPaperPlane, FaImage, FaClock, FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

const STATUS_LABELS = {
  1: { label: 'Có mặt', cls: 'success' },
  2: { label: 'Đi trễ', cls: 'warning' },
  3: { label: 'Vắng có phép', cls: 'info' },
  4: { label: 'Vắng không phép', cls: 'danger' },
  5: { label: 'Lỗi xác thực', cls: 'dark' },
};

const APPEAL_STATUS = {
  0: { label: 'Đang chờ xử lý', cls: 'secondary', icon: <FaClock /> },
  1: { label: 'Đã duyệt', cls: 'success', icon: <FaThumbsUp /> },
  2: { label: 'Từ chối', cls: 'danger', icon: <FaThumbsDown /> },
};

const StudentComplaints = () => {
  const { user } = useContext(AuthContext);
  const fileRef = useRef(null);

  const [tab, setTab] = useState('new');        // 'new' | 'history'
  const [records, setRecords] = useState([]);   // Lịch sử điểm danh cho dropdown
  const [history, setHistory] = useState([]);   // Lịch sử phản hồi đã gửi
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ maDiemDanh: '', noiDung: '', minhChung: null });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const maSv = user?.MaSV || user?.MaId;

  // Tải lịch sử điểm danh để đưa vào dropdown
  useEffect(() => {
    const load = async () => {
      if (!maSv) return;
      try {
        const [recRes, histRes] = await Promise.all([
          axiosClient.get(`/diemdanh/student/${maSv}`),
          axiosClient.get(`/phanhoi/student/${maSv}`)
        ]);

        const phanHoiList = histRes.data?.data || [];

        // Tập hợp các MaDiemDanh đã được GV duyệt (trangThai=1) hoặc đang chờ (trangThai=0)
        // → Ẩn khỏi dropdown để tránh gửi trùng và tránh rối
        const dauDaXuLy = new Set(
          phanHoiList
            .filter(p => p.trangThai === 0 || p.trangThai === 1)
            .map(p => p.maDiemDanh)
        );

        // Chỉ hiện: buổi bị vắng/lỗi (trangThai >= 3) VÀ chưa gửi phản hồi / chưa được duyệt
        const filterable = (recRes.data || []).filter(
          r => r.trangThai >= 3 && !dauDaXuLy.has(r.maDiemDanh)
        );

        setRecords(filterable);
        setHistory(phanHoiList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [maSv]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Ảnh minh chứng tối đa 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, minhChung: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.maDiemDanh) return setMessage({ text: 'Vui lòng chọn buổi học bị sai.', type: 'danger' });
    if (!form.noiDung.trim()) return setMessage({ text: 'Vui lòng nhập nội dung khiếu nại.', type: 'danger' });

    setSubmitting(true);
    try {
      await axiosClient.post('/phanhoi', {
        maDiemDanh: parseInt(form.maDiemDanh),
        noiDung: form.noiDung,
        minhChung: form.minhChung
      });
      setMessage({ text: 'Gửi phản hồi thành công! Giảng viên sẽ xem xét sớm nhất có thể.', type: 'success' });
      setForm({ maDiemDanh: '', noiDung: '', minhChung: null });
      if (fileRef.current) fileRef.current.value = '';
      // Tải lại lịch sử
      const histRes = await axiosClient.get(`/phanhoi/student/${maSv}`);
      setHistory(histRes.data?.data || []);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Gửi thất bại. Vui lòng thử lại.';
      setMessage({ text: errMsg, type: 'danger' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" /><span className="ms-3 text-muted">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="pb-4 pt-2">
      <h5 className="fw-bold text-dark mb-1 px-2">Phản Hồi Điểm Danh</h5>
      <p className="text-muted small mb-4 px-2">Gửi khiếu nại khi điểm danh bị ghi sai và theo dõi kết quả xử lý.</p>

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 px-2">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>
            <FaPaperPlane className="me-1" /> Gửi Phản Hồi Mới
          </button>
        </li>
        <li className="nav-item ms-2">
          <button className={`nav-link ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <FaCheckCircle className="me-1" /> Lịch Sử Khiếu Nại ({history.length})
          </button>
        </li>
      </ul>

      {message.text && (
        <div className={`alert alert-${message.type} border-0 shadow-sm rounded-3 py-2 small fw-medium mx-2 mb-3`}>
          {message.text}
        </div>
      )}

      {tab === 'new' && (
        <div className="card bg-white border-0 shadow-sm rounded-4 p-4">
          <form onSubmit={handleSubmit} className="text-start">
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted">Buổi học bị ghi sai điểm danh *</label>
              <select
                className="form-select bg-light border-0 py-3 rounded-3"
                required
                value={form.maDiemDanh}
                onChange={e => setForm(f => ({ ...f, maDiemDanh: e.target.value }))}
              >
                <option value="">-- Chọn buổi học --</option>
                {records.map(r => (
                  <option key={r.maDiemDanh} value={r.maDiemDanh}>
                    {r.tenMon || r.tenLop || 'Buổi học'} — {formatDate(r.ngayHoc)} — {STATUS_LABELS[r.trangThai]?.label}
                  </option>
                ))}
              </select>
              {records.length === 0 && (
                <p className="text-muted small mt-1">Không có buổi học nào cần khiếu nại — các buổi đã gửi phản hồi hoặc đã được xác nhận sẽ không hiển thị ở đây.</p>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold text-muted">Nội dung khiếu nại *</label>
              <textarea
                className="form-control bg-light border-0 p-3 rounded-3"
                rows="4"
                placeholder="VD: Dạ thưa thầy, em có mặt ở lớp nhưng do lỗi GPS mạng 4G chập chờn nên máy báo vắng..."
                required
                value={form.noiDung}
                onChange={e => setForm(f => ({ ...f, noiDung: e.target.value }))}
              />
            </div>

            <div className="mb-5">
              <label className="form-label small fw-bold text-muted">File minh chứng <span className="fw-normal">(Nếu có)</span></label>
              <input
                type="file" accept="image/*"
                className="form-control bg-light border-0 py-2 rounded-3"
                ref={fileRef}
                onChange={handleFileChange}
              />
              <p className="text-muted mt-2" style={{ fontSize: '0.68rem' }}>
                Hỗ trợ ảnh chụp màn hình lỗi, ảnh chụp tại lớp. Tối đa 3MB.
              </p>
              {form.minhChung && (
                <div className="mt-2">
                  <img src={form.minhChung} alt="Minh chứng" className="img-thumbnail rounded-3" style={{ maxHeight: '150px' }} />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary w-100 rounded-pill fw-bold py-3 shadow-sm d-flex align-items-center justify-content-center gap-2"
            >
              {submitting
                ? <><span className="spinner-border spinner-border-sm" /> Đang gửi...</>
                : <><FaPaperPlane /> Gửi Hệ Thống</>
              }
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="text-center text-muted py-5">
              <FaImage className="fs-1 mb-3 opacity-25" />
              <p>Bạn chưa gửi khiếu nại nào.</p>
            </div>
          ) : (
            history.map(h => {
              const status = APPEAL_STATUS[h.trangThai] || APPEAL_STATUS[0];
              return (
                <div key={h.maPhanHoi} className="card border-0 shadow-sm rounded-4 p-4 mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="fw-bold text-dark">{h.tenMon || 'Môn học'}</span>
                      <span className="text-muted small ms-2">— {formatDate(h.ngayHoc)}</span>
                    </div>
                    <span className={`badge bg-${status.cls} rounded-pill px-3 d-flex align-items-center gap-1`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <p className="text-muted small mb-2"><strong>Nội dung:</strong> {h.noiDung}</p>
                  {h.phanHoiGv && (
                    <p className="text-dark small mb-2 p-2 bg-light rounded-3">
                      <strong>Phản hồi từ giảng viên:</strong> {h.phanHoiGv}
                    </p>
                  )}
                  {h.minhChung && (
                    <img src={h.minhChung} alt="Minh chứng" className="img-thumbnail rounded-3 mt-1" style={{ maxHeight: '120px' }} />
                  )}
                  <p className="text-muted" style={{ fontSize: '0.7rem' }}>Gửi lúc: {new Date(h.thoiGianGui).toLocaleString('vi-VN')}</p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default StudentComplaints;
