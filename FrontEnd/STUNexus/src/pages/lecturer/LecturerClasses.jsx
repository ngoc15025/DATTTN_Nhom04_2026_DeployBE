import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import { FaChalkboard, FaArrowRight } from 'react-icons/fa';

const LecturerClasses = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;
    
    const fetchMyClasses = async () => {
      try {
        // Lấy tất cả lớp học rồi lọc theo MaGV của user hiện tại
        const res = await axiosClient.get('/lophoc');
        const allClasses = res.data?.data || [];
        const myClasses = allClasses.filter(c => c.maGv === (user.MaGV || user.MaId));
        setClasses(myClasses);
      } catch (err) {
        console.error('Lỗi tải danh sách lớp:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyClasses();
  }, [user]);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container-fluid">
      <h3 className="mb-4 mt-2 fw-bold text-dark">Lớp Học Phụ Trách</h3>
      <div className="row g-4">
        {classes.length > 0 ? classes.map(c => (
          <div className="col-12 col-md-6 col-xl-4" key={c.maLop}>
            <div className="card glass-panel border-0 border-start border-primary border-4 shadow-sm h-100" style={{borderRadius: '12px'}}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="bg-primary bg-opacity-10 text-primary rounded d-flex align-items-center justify-content-center" style={{width: '50px', height: '50px'}}>
                    <FaChalkboard className="fs-4" />
                  </div>
                  <span className="badge bg-light text-secondary border px-3 py-2 rounded-pill shadow-sm">{c.maLop}</span>
                </div>
                <h5 className="fw-bold text-dark text-truncate mb-1" title={c.tenLop}>{c.tenLop}</h5>
                <p className="text-muted fw-medium mb-4">{c.tenMon || 'Môn học phần'}</p>
                <button 
                  onClick={() => navigate(`/lecturer/sessions/${c.maLop}`)} 
                  className="btn btn-primary w-100 d-flex justify-content-center align-items-center gap-2 py-2 fw-bold shadow-sm rounded-pill">
                  Vào Lớp Học <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-12">
            <p className="text-muted">Không có lớp học nào được phân công.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LecturerClasses;
