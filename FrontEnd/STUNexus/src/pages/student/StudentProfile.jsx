import React, { useState, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axiosClient from '../../utils/axiosClient';
import { FaCamera, FaSave, FaKey, FaShieldAlt } from 'react-icons/fa';

// Kết nối trực tiếp tới Backend API

const StudentProfile = () => {
  const { user, updateUserSession, registerPasskey } = useContext(AuthContext);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    Email: '',
    SoDienThoai: '',
    Lop: ''          // Thêm Lop để dùng khi cập nhật ảnh
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.MaSV) return;
      try {
        const res = await axiosClient.get(`/sinhvien/${user.MaSV}`);
        if (res.data.success) {
           setFormData({
             Email: res.data.data.email || '',
             SoDienThoai: res.data.data.soDienThoai || '',
             Lop: res.data.data.lop || user.Lop || ''
           });
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin sinh viên:", err);
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

  const handleAvatarSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate nhanh ở FE (Kích thước 5MB khớp với BE)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh quá lớn (tối đa 5MB).');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      setMessage({ text: 'Đang tải ảnh lên...', type: 'info' });
      
      const res = await axiosClient.post(`/sinhvien/${user.MaSV}/upload-avatar`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const newUrl = res.data.anhDaiDienUrl;
        updateUserSession({ AnhDaiDien: newUrl });
        setMessage({ text: 'Cập nhật ảnh đại diện thành công!', type: 'success' });
      }
    } catch (err) {
      console.error("Lỗi upload ảnh:", err);
      const errMsg = err.response?.data?.message || 'Không thể cập nhật ảnh đại diện.';
      setMessage({ text: errMsg, type: 'danger' });
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const parts = user.HoTen.trim().split(' ');
      const tenSv = parts.pop();
      const hoLot = parts.join(' ');

      await axiosClient.put(`/sinhvien/${user.MaSV}`, {
        hoLot: hoLot,
        tenSv: tenSv,
        lop: user.Lop || '',
        email: formData.Email,
        soDienThoai: formData.SoDienThoai
      });

      updateUserSession({ Email: formData.Email, SoDienThoai: formData.SoDienThoai });
      setIsEditing(false);
      setMessage({ text: 'Cập nhật thông tin liên lạc thành công.', type: 'success' });
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
      setMessage({ text: 'Đổi mật khẩu thành công! Hãy lưu ý mật khẩu mới.', type: 'success' });
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Đổi mật khẩu thất bại.', type: 'danger' });
    }
    setTimeout(() => setMessage({text:'', type:''}), 4000);
  };

  return (
    <div className="pb-5">
      <h3 className="fw-bold text-dark mb-4">Hồ sơ cá nhân</h3>
      
      {message.text && (
        <div className={`alert alert-${message.type} border-0 shadow-sm py-2 rounded-3 fw-medium small mb-4 bg-${message.type} bg-opacity-10 text-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Box 1: Avatar và Thông tin cứng */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden text-center p-4">
        <div className="position-relative mx-auto mb-3" style={{width: '100px', height: '100px'}}>
          <div 
            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow" 
            style={{width: '100px', height: '100px', fontSize: '2.5rem', backgroundImage: user?.AnhDaiDien ? `url(${user.AnhDaiDien})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center'}}
          >
            {!user?.AnhDaiDien && user?.HoTen.charAt(0)}
          </div>
          <button 
            onClick={() => fileInputRef.current.click()}
            className="btn btn-primary rounded-circle position-absolute bottom-0 end-0 shadow d-flex align-items-center justify-content-center p-0" 
            style={{width: '32px', height: '32px', border: '2px solid white'}}
            title="Đổi ảnh đại diện"
          >
            <FaCamera className="small" />
          </button>
          <input type="file" accept="image/*" className="d-none" ref={fileInputRef} onChange={handleAvatarSelect} />
        </div>
        <h5 className="fw-bold mb-1 text-dark">{user?.HoTen}</h5>
        <div className="badge bg-secondary bg-opacity-10 text-secondary border rounded-pill px-3 py-1 mb-2">Sinh Viên</div>
        <p className="text-muted small mb-0">MSSV: <span className="fw-medium text-dark">{user?.MaSV}</span></p>
      </div>

      {/* Box 2: Thông tin liên lạc (Nhiệm vụ Sửa) */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white p-4">
        <h6 className="fw-bold text-dark mb-3">Thông tin liên hệ</h6>
        {loading ? (
           <div className="text-center py-3"><div className="spinner-border text-primary spinner-border-sm"></div></div>
        ) : (
          <form onSubmit={saveProfile}>
            <div className="mb-3">
              <label className="form-label small text-muted">Email sinh viên</label>
              <input type="email" className={`form-control ${isEditing ? 'bg-white border' : 'bg-light border-0'}`} readOnly={!isEditing} value={formData.Email} onChange={(e) => setFormData({...formData, Email: e.target.value})} placeholder="...@student.edu.vn" />
            </div>
            <div className="mb-4">
              <label className="form-label small text-muted">Số điện thoại di động</label>
              <input type="text" className={`form-control ${isEditing ? 'bg-white border' : 'bg-light border-0'}`} readOnly={!isEditing} value={formData.SoDienThoai} onChange={(e) => setFormData({...formData, SoDienThoai: e.target.value})} placeholder="09xx..." />
            </div>
            
            {!isEditing ? (
              <button type="button" onClick={() => setIsEditing(true)} className="btn btn-primary w-100 fw-bold rounded-pill shadow-sm">
                Chỉnh sửa thông tin
              </button>
            ) : (
               <div className="d-flex gap-2">
                 <button type="button" onClick={() => {setIsEditing(false); setFormData({Email: user?.Email||'', SoDienThoai: user?.SoDienThoai||''})}} className="btn btn-light w-50 fw-bold rounded-pill">
                   Hủy
                 </button>
                 <button type="submit" className="btn btn-primary w-50 fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2 shadow-sm">
                   <FaSave /> Lưu Thay Đổi
                 </button>
               </div>
            )}
          </form>
        )}
      </div>

      {/* Box 3: Đổi Mật Khẩu */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white p-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <FaShieldAlt className="text-danger fs-5"/>
          <h6 className="fw-bold text-dark mb-0">Bảo mật tài khoản</h6>
        </div>
        <form onSubmit={changePassword}>
          <div className="mb-3">
            <label className="form-label small text-muted">Mật khẩu hiện tại</label>
            <input type="password" required className="form-control bg-light border-0" value={passData.oldPass} onChange={(e) => setPassData({...passData, oldPass: e.target.value})} />
          </div>
          <div className="mb-3">
            <label className="form-label small text-muted">Mật khẩu mới</label>
            <input type="password" required className="form-control bg-light border-0" value={passData.newPass} onChange={(e) => setPassData({...passData, newPass: e.target.value})} />
          </div>
          <div className="mb-4">
            <label className="form-label small text-muted">Xác nhận mật khẩu mới</label>
            <input type="password" required className="form-control bg-light border-0" value={passData.confirmPass} onChange={(e) => setPassData({...passData, confirmPass: e.target.value})} />
          </div>
          <button type="submit" className="btn btn-outline-danger w-100 fw-bold rounded-pill gap-2 d-flex align-items-center justify-content-center">
            <FaKey /> Đổi Mật Khẩu
          </button>
        </form>
      </div>
      
      {/* Box 4: Quản lý Passkey (Sinh trắc học) */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white p-4">
        <div className="d-flex align-items-center gap-2 mb-3">
          <FaShieldAlt className="text-success fs-5"/>
          <h6 className="fw-bold text-dark mb-0">Xác thực Sinh trắc học (Passkeys)</h6>
        </div>
        <div className="alert alert-light border-0 small mb-4 py-3">
          Sử dụng vân tay, khuôn mặt (FaceID/TouchID) hoặc mã PIN thiết bị để điểm danh an toàn và chống gian lận.
        </div>
        
        <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded-4">
            <div className="d-flex flex-column">
                <span className="small text-muted">Trạng thái xác thực</span>
                <span className={`fw-bold ${user.hasPasskey ? 'text-success' : 'text-danger'}`}>
                    {user.hasPasskey ? '● Đã kích hoạt' : '○ Chưa thiết lập'}
                </span>
            </div>
            {user.hasPasskey && (
                <div className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill border border-success border-opacity-25">
                    Hợp lệ
                </div>
            )}
        </div>

        <button 
            type="button" 
            className={`btn ${user.hasPasskey ? 'btn-outline-primary' : 'btn-primary'} w-100 fw-bold rounded-pill py-2 shadow-sm d-flex align-items-center justify-content-center gap-2`}
            onClick={() => registerPasskey(user.MaSV)}
        >
            <FaShieldAlt /> {user.hasPasskey ? 'Cập nhật / Đăng ký lại Passkey' : 'Thiết lập Passkey ngay'}
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;
