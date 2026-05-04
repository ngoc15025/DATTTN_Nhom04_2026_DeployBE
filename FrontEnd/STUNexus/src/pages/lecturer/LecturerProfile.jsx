import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axiosClient from '../../utils/axiosClient';
import { FaSave, FaKey, FaShieldAlt, FaUserTie } from 'react-icons/fa';

// Kết nối trực tiếp tới Backend API

const LecturerProfile = () => {
  const { user, updateUserSession } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    Email: '',
    SoDienThoai: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.MaGV) return;
      try {
        const res = await axiosClient.get(`/giangvien/${user.MaGV}`);
        if (res.data.success) {
           setFormData({
             Email: res.data.data.email || '',
             SoDienThoai: res.data.data.soDienThoai || ''
           });
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin giảng viên:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const [passData, setPassData] = useState({
    oldPass: '',
    newPass: '',
    confirmPass: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      // Tách tên từ HoTen hiện tại trong session (BE cần HoLot và TenGv riêng)
      const parts = user.HoTen.trim().split(' ');
      const tenGv = parts.pop();
      const hoLot = parts.join(' ');

      await axiosClient.put(`/giangvien/${user.MaGV}`, {
        hoLot: hoLot,
        tenGv: tenGv,
        email: formData.Email,
        soDienThoai: formData.SoDienThoai
      });
      
      updateUserSession({ Email: formData.Email, SoDienThoai: formData.SoDienThoai });
      setIsEditing(false);
      setMessage({ text: 'Cập nhật thông tin thành công.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Lỗi cập nhật hồ sơ.', type: 'danger' });
    }
    setTimeout(() => setMessage({text:'', type:''}), 3000);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if(passData.newPass !== passData.confirmPass) {
      setMessage({ text: 'Mật khẩu xác nhận không khớp!', type: 'danger' }); return;
    }
    if(passData.newPass.length < 5) {
      setMessage({ text: 'Mật khẩu mới phải từ 5 ký tự trở lên.', type: 'danger' }); return;
    }

    try {
      await axiosClient.post('/auth/change-password', {
        taiKhoan: user.TaiKhoan,
        oldPassword: passData.oldPass,
        newPassword: passData.newPass
      });
      
      setPassData({oldPass: '', newPass: '', confirmPass: ''});
      setMessage({ text: 'Đổi mật khẩu bảo mật thành công!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Đổi mật khẩu thất bại.', type: 'danger' });
    }
    setTimeout(() => setMessage({text:'', type:''}), 4000);
  };

  return (
    <div className="container-fluid pb-5">
      <div className="d-flex align-items-center gap-3 mb-4 mt-2">
        <h3 className="m-0 fw-bold text-dark">Hồ Sơ Cán Bộ Giảng Dạy</h3>
      </div>
      
      {message.text && (
        <div className={`alert alert-${message.type} border-0 shadow-sm py-3 rounded-3 fw-medium mb-4 bg-${message.type} bg-opacity-10 text-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="row g-4">
        {/* Cột trái: Thông tin Cá nhân */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white p-4">
            <div className="text-center mb-4">
              <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center shadow mx-auto mb-3" style={{width: '90px', height: '90px', fontSize: '2.5rem'}}>
                <FaUserTie />
              </div>
              <h5 className="fw-bold mb-1 text-dark">{user?.HoTen}</h5>
              <p className="text-muted small mb-0">Mã Cán Bộ: {user?.MaGV}</p>
            </div>
            <hr />
            {loading ? (
               <div className="text-center py-3"><div className="spinner-border text-primary spinner-border-sm"></div></div>
            ) : (
              <form onSubmit={saveProfile}>
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted">Email công vụ</label>
                  <input type="email" className={`form-control py-2 ${isEditing ? 'bg-white border' : 'bg-light border-0'}`} readOnly={!isEditing} value={formData.Email} onChange={(e) => setFormData({...formData, Email: e.target.value})} />
                </div>
                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted">Điện thoại liên lạc</label>
                  <input type="text" className={`form-control py-2 ${isEditing ? 'bg-white border' : 'bg-light border-0'}`} readOnly={!isEditing} value={formData.SoDienThoai} onChange={(e) => setFormData({...formData, SoDienThoai: e.target.value})} />
                </div>
                {!isEditing ? (
                  <button type="button" onClick={() => setIsEditing(true)} className="btn btn-primary w-100 fw-bold py-2 rounded-pill shadow-sm">
                    Chỉnh sửa thông tin
                  </button>
                ) : (
                   <div className="d-flex gap-2">
                     <button type="button" onClick={() => {setIsEditing(false); setFormData({Email: user?.Email||'', SoDienThoai: user?.SoDienThoai||''})}} className="btn btn-light w-50 fw-bold py-2 rounded-pill">
                       Hủy
                     </button>
                     <button type="submit" className="btn btn-primary w-50 fw-bold py-2 rounded-pill d-flex align-items-center justify-content-center gap-2 shadow-sm">
                       <FaSave /> Lưu Thay Đổi
                     </button>
                   </div>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Cột phải: Form đổi mật khẩu */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white p-4">
            <div className="d-flex align-items-center gap-2 mb-4">
              <FaShieldAlt className="text-danger fs-4"/>
              <h5 className="fw-bold text-dark mb-0">Đổi Mật Khẩu Đăng Nhập</h5>
            </div>
            <p className="small text-muted mb-4 pb-2 border-bottom">Để bảo vệ tài khoản quản lý lớp học, vui lòng sử dụng mật khẩu mạnh kết hợp chữ và số. Tránh dùng chung mật khẩu với các dịch vụ khác.</p>
            <form onSubmit={changePassword}>
              <div className="mb-3">
                <label className="form-label small fw-bold text-muted">Mật khẩu thẻ hiện tại <span className="text-danger">*</span></label>
                <input type="password" required className="form-control bg-light border-0 py-2" value={passData.oldPass} onChange={(e) => setPassData({...passData, oldPass: e.target.value})} />
              </div>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">Mật khẩu khai báo mới <span className="text-danger">*</span></label>
                  <input type="password" required className="form-control bg-light border-0 py-2" value={passData.newPass} onChange={(e) => setPassData({...passData, newPass: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted">Xác nhận lại mật khẩu mới <span className="text-danger">*</span></label>
                  <input type="password" required className="form-control bg-light border-0 py-2" value={passData.confirmPass} onChange={(e) => setPassData({...passData, confirmPass: e.target.value})} />
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-danger px-4 fw-bold py-2 rounded-pill gap-2 d-flex align-items-center shadow-sm">
                  <FaKey /> Cập Nhật Mật Khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerProfile;
