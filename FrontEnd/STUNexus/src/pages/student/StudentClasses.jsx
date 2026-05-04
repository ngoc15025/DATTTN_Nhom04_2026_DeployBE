import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axiosClient from '../../utils/axiosClient';
import { FaBook, FaUserTie, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';

const StudentClasses = () => {
    const { user } = useContext(AuthContext);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;

        // Lấy mã SV — thử cả MaSV lẫn MaId phòng trường hợp mapping
        const maSv = user.MaSV || user.MaId;
        if (!maSv) {
            setError('Không xác định được mã sinh viên từ phiên đăng nhập.');
            setLoading(false);
            return;
        }

        const fetchClasses = async () => {
            try {
                console.log('Fetching classes for maSv:', maSv);
                const res = await axiosClient.get(`/sinhvien/${maSv}/classes`);
                console.log('API response:', res.data);
                setClasses(res.data.data || []);
            } catch (err) {
                console.error('Lỗi tải danh sách lớp học:', err);
                const msg = err.response?.data?.message || `Lỗi ${err.response?.status || ''}: Không thể tải danh sách lớp.`;
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, [user]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted small">Đang tải danh sách lớp học...</p>
            </div>
        );
    }

    return (
        <div className="pb-4 pt-2">
            <h5 className="fw-bold text-dark mb-1 px-2">Lớp Học Của Tôi</h5>
            <p className="text-muted small px-2 mb-4">
                MSSV: <span className="font-monospace fw-bold text-primary">{user?.MaSV || user?.MaId}</span>
            </p>

            {error && (
                <div className="alert border-0 rounded-4 p-3 d-flex align-items-center gap-3 mb-3"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                    <FaExclamationTriangle />
                    <span className="small fw-semibold">{error}</span>
                </div>
            )}

            <div className="d-flex flex-column gap-3">
                {classes.map((cls, index) => (
                    <div key={index} className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                        <div className="card-body p-0">
                            <div className="d-flex align-items-stretch">
                                <div className="bg-primary bg-opacity-10 d-flex align-items-center justify-content-center px-4" style={{minWidth: '70px'}}>
                                    <FaBook className="text-primary fs-4" />
                                </div>
                                <div className="p-3 flex-grow-1">
                                    <h6 className="fw-bold text-dark mb-1">{cls.tenMon || cls.TenMon}</h6>
                                    <p className="text-muted small mb-2">
                                        {cls.tenLop || cls.TenLop} &bull;{' '}
                                        <span className="font-monospace fw-bold text-primary">{cls.maLop || cls.MaLop}</span>
                                    </p>
                                    <div className="d-flex align-items-center gap-2 text-muted" style={{fontSize: '0.75rem'}}>
                                        <FaUserTie className="small" />
                                        <span>Giảng viên: {cls.tenGiangVien || cls.TenGiangVien}</span>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center pe-3">
                                    <FaChevronRight className="text-secondary opacity-50" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {classes.length === 0 && !error && (
                    <div className="text-center p-5 bg-white rounded-4 shadow-sm">
                        <FaBook className="text-secondary opacity-25 mb-3" style={{fontSize: '3rem'}} />
                        <p className="text-muted small mb-0">Bạn chưa được thêm vào lớp học nào trong học kỳ này.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentClasses;
