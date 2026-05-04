import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axiosClient from '../../utils/axiosClient';
import {
  FaInbox, FaCheckCircle, FaTimesCircle, FaClock,
  FaImage, FaThumbsUp, FaThumbsDown, FaExclamationCircle
} from 'react-icons/fa';

const APPEAL_STATUS = {
  0: { label: 'Chờ xử lý', cls: 'warning text-dark' },
  1: { label: 'Đã duyệt', cls: 'success' },
  2: { label: 'Từ chối', cls: 'danger' },
};

const DD_STATUS = {
  1: 'Có mặt', 2: 'Đi trễ', 3: 'Vắng có phép', 4: 'Vắng không phép', 5: 'Lỗi xác thực'
};

const LecturerAppeals = () => {
  const { user } = useContext(AuthContext);
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');  // 'all' | 'pending' | 'resolved'
  const [resolving, setResolving] = useState(null);
  const [resolveForm, setResolveForm] = useState({ phanHoiGv: '' });
  const [processing, setProcessing] = useState(false); // Trạng thái đang xử lý nút Xác nhận

  // Modal minh chứng
  const [previewImg, setPreviewImg] = useState(null);

  const maGv = user?.MaGV || user?.MaId;

  const loadAppeals = async () => {
    if (!maGv) return;
    try {
      const res = await axiosClient.get(`/phanhoi/lecturer/${maGv}`);
      setAppeals(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppeals(); }, [maGv]);

  const handleResolve = async (id, trangThai) => {
    setProcessing(true);
    try {
      const res = await axiosClient.put(`/phanhoi/${id}/resolve`, {
        trangThai,
        phanHoiGv: resolveForm.phanHoiGv
      });
      // ✅ Optimistic update: cập nhật state ngay không cần gọi lại API
      setAppeals(prev => prev.map(a =>
        a.maPhanHoi === id
          ? { ...a, trangThai, phanHoiGv: resolveForm.phanHoiGv }
          : a
      ));
      setResolving(null);
      setResolveForm({ phanHoiGv: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Xử lý thất bại.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : 'N/A';
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('vi-VN') : 'N/A';

  const filtered = appeals.filter(a => {
    if (filter === 'pending') return a.trangThai === 0;
    if (filter === 'resolved') return a.trangThai !== 0;
    return true;
  });

  const pendingCount = appeals.filter(a => a.trangThai === 0).length;

  if (loading) {
    // Skeleton loading — giữ bố cục, không bị trắng trang
    return (
      <div className="pb-4 pt-2">
        <div className="d-flex align-items-center justify-content-between mb-1 px-2 mb-3">
          <div className="bg-secondary bg-opacity-10 rounded" style={{height: '24px', width: '240px'}} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="card border-0 shadow-sm rounded-4 p-4 mb-3">
            <div className="d-flex justify-content-between mb-3">
              <div className="bg-secondary bg-opacity-10 rounded" style={{height: '18px', width: '160px'}} />
              <div className="bg-secondary bg-opacity-10 rounded-pill" style={{height: '22px', width: '80px'}} />
            </div>
            <div className="bg-secondary bg-opacity-10 rounded-3 mb-3" style={{height: '64px'}} />
            <div className="bg-secondary bg-opacity-10 rounded mb-2" style={{height: '14px', width: '80%'}} />
            <div className="bg-secondary bg-opacity-10 rounded" style={{height: '14px', width: '40%'}} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pb-4 pt-2">
      <div className="d-flex align-items-center justify-content-between mb-1 px-2">
        <h5 className="fw-bold text-dark mb-0">Xử Lý Khiếu Nại Điểm Danh</h5>
        {pendingCount > 0 && (
          <span className="badge bg-danger rounded-pill px-3 py-2 fs-6">
            {pendingCount} chờ xử lý
          </span>
        )}
      </div>
      <p className="text-muted small mb-4 px-2">Danh sách các phản hồi từ sinh viên về điểm danh trong các lớp bạn phụ trách.</p>

      {/* Bộ lọc */}
      <div className="d-flex gap-2 mb-4 px-2 flex-wrap">
        {[['all', 'Tất cả'], ['pending', 'Chờ xử lý'], ['resolved', 'Đã xử lý']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`btn btn-sm rounded-pill px-3 ${filter === val ? 'btn-primary' : 'btn-outline-secondary'}`}
          >
            {label}
            {val === 'pending' && pendingCount > 0 && (
              <span className="badge bg-white text-danger ms-1 rounded-pill">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-muted py-5">
          <FaInbox className="fs-1 mb-3 opacity-25" />
          <p>Không có khiếu nại nào{filter !== 'all' ? ' trong mục này' : ''}.</p>
        </div>
      ) : (
        filtered.map(a => {
          const st = APPEAL_STATUS[a.trangThai] || APPEAL_STATUS[0];
          const isExpanded = resolving === a.maPhanHoi;
          return (
            <div key={a.maPhanHoi} className="card border-0 shadow-sm rounded-4 p-4 mb-3">
              {/* Header */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <span className="fw-bold text-dark fs-6">{a.tenSinhVien || a.maSv}</span>
                  <span className="text-muted small ms-2">({a.maSv})</span>
                </div>
                <span className={`badge bg-${st.cls} rounded-pill px-3 py-2`}>{st.label}</span>
              </div>

              {/* Thông tin buổi học */}
              <div className="d-flex flex-wrap gap-3 mb-3 p-3 bg-light rounded-3">
                <div><span className="text-muted small">Môn học</span><div className="fw-semibold">{a.tenMon || '—'}</div></div>
                <div><span className="text-muted small">Lớp</span><div className="fw-semibold">{a.tenLop || '—'}</div></div>
                <div><span className="text-muted small">Ngày học</span><div className="fw-semibold">{formatDate(a.ngayHoc)}</div></div>
                <div>
                  <span className="text-muted small">Trạng thái gốc</span>
                  <div>
                    <span className={`badge bg-${a.trangThaiDiemDanh >= 3 ? 'danger' : 'success'} rounded-pill`}>
                      {DD_STATUS[a.trangThaiDiemDanh] || 'Không rõ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nội dung */}
              <p className="mb-2 small"><strong>Nội dung khiếu nại:</strong> {a.noiDung}</p>
              <p className="text-muted mb-2" style={{ fontSize: '0.72rem' }}>
                <FaClock className="me-1" />Gửi lúc: {formatDateTime(a.thoiGianGui)}
              </p>

              {/* Minh chứng */}
              {a.minhChung && (
                <button
                  onClick={() => setPreviewImg(a.minhChung)}
                  className="btn btn-sm btn-outline-primary rounded-pill mb-3 d-inline-flex align-items-center gap-1"
                >
                  <FaImage /> Xem minh chứng
                </button>
              )}

              {/* Phản hồi của GV (nếu đã xử lý) */}
              {a.phanHoiGv && (
                <p className="bg-primary bg-opacity-10 text-primary p-2 rounded-3 small mb-3">
                  <strong>Ghi chú của bạn:</strong> {a.phanHoiGv}
                </p>
              )}

              {/* Nút hành động - chỉ hiện khi đang chờ */}
              {a.trangThai === 0 && (
                <>
                  {!isExpanded ? (
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => { setResolving(a.maPhanHoi); setResolveForm({ phanHoiGv: '' }); }}
                        className="btn btn-sm btn-success rounded-pill d-flex align-items-center gap-1 px-3"
                      >
                        <FaThumbsUp /> Duyệt Khiếu Nại
                      </button>
                      <button
                        onClick={() => { setResolving(`reject_${a.maPhanHoi}`); setResolveForm({ phanHoiGv: '' }); }}
                        className="btn btn-sm btn-outline-danger rounded-pill d-flex align-items-center gap-1 px-3"
                      >
                        <FaThumbsDown /> Từ Chối
                      </button>
                    </div>
                  ) : (
                    <div className="border rounded-3 p-3 bg-light">
                      <p className="fw-semibold small mb-2">
                        {resolving === a.maPhanHoi ? (
                          <><FaThumbsUp className="text-success me-1" />Xác nhận duyệt khiếu nại — trạng thái sẽ tự đổi sang "Có mặt"</>
                        ) : (
                          <><FaThumbsDown className="text-danger me-1" />Từ chối khiếu nại</>
                        )}
                      </p>
                      <textarea
                        className="form-control form-control-sm border-0 bg-white rounded-3 mb-2"
                        rows={2}
                        placeholder="Ghi chú ngắn cho sinh viên (không bắt buộc)..."
                        value={resolveForm.phanHoiGv}
                        onChange={e => setResolveForm({ phanHoiGv: e.target.value })}
                      />
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => handleResolve(a.maPhanHoi, resolving === a.maPhanHoi ? 1 : 2)}
                          disabled={processing}
                          className={`btn btn-sm rounded-pill d-flex align-items-center gap-2 ${resolving === a.maPhanHoi ? 'btn-success' : 'btn-danger'}`}
                        >
                          {processing ? (
                            <><div className="spinner-border spinner-border-sm" role="status" style={{width:'12px',height:'12px'}} /> Đang xử lý...</>
                          ) : 'Xác nhận'}
                        </button>
                        <button onClick={() => setResolving(null)} className="btn btn-sm btn-light rounded-pill">
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })
      )}

      {/* Modal xem ảnh minh chứng */}
      {previewImg && (
        <div
          className="modal d-flex align-items-center justify-content-center"
          style={{ display: 'flex !important', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999 }}
          onClick={() => setPreviewImg(null)}
        >
          <div className="p-2" onClick={e => e.stopPropagation()}>
            <img src={previewImg} alt="Minh chứng" className="rounded-3 shadow" style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }} />
            <div className="text-center mt-2">
              <button onClick={() => setPreviewImg(null)} className="btn btn-sm btn-light rounded-pill">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerAppeals;
