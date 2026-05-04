import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setHasError(false);
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        if (result.role === 'admin') navigate('/admin/dashboard');
        else if (result.role === 'lecturer') navigate('/lecturer/dashboard');
        else if (result.role === 'student') navigate('/student/dashboard');
      } else {
        // Báo lỗi ngay lập tức, không delay
        setError(result.message || 'Sai tài khoản hoặc mật khẩu!');
        setHasError(true);
        setIsLoading(false);
      }
    } catch (err) {
      setError('Không thể kết nối tới máy chủ. Vui lòng kiểm tra Backend.');
      setHasError(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light" style={{backgroundImage: 'url("https://vtv1.mediacdn.vn/2019/10/24/photo-1-15719001150411784860161.jpg")', backgroundSize: 'cover', backgroundPosition: 'center'}}>
      <div className="card glass-panel border-0 shadow-lg" style={{width: '100%', maxWidth: '450px', borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.85)'}}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <img src="/logo.png" alt="STU Logo" style={{height: '60px', objectFit: 'contain'}} className="mb-3"/>
            <h4 className="fw-bold text-primary">Điểm Danh Hệ Thống</h4>
            <p className="text-muted small">Cổng thông tin STU Nexus</p>
          </div>
          
          {error && (
            <div className="alert alert-danger py-2 small fw-bold bg-danger bg-opacity-10 border-0 text-danger d-flex align-items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary small">Tài Khoản</label>
              <input
                type="text"
                className={`form-control py-2 bg-light border-0 ${hasError ? 'is-invalid border border-danger' : ''}`}
                style={{ backgroundImage: 'none' }} // Xóa icon ! của Bootstrap
                placeholder="Nhập mã số hoặc tên đăng nhập"
                value={username}
                onChange={e => { setUsername(e.target.value); setHasError(false); setError(''); }}
                required
                disabled={isLoading}
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-bold text-secondary small">Mật Khẩu</label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-control py-2 bg-light border-0 pe-5 ${hasError ? 'is-invalid border border-danger' : ''}`}
                  style={{ backgroundImage: 'none' }} // Xóa icon ! của Bootstrap
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setHasError(false); setError(''); }}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted pe-3 p-0"
                  style={{zIndex: 5, border: 'none', background: 'none'}}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-100 fw-bold py-3 shadow-sm rounded-pill mt-2" disabled={isLoading}>
              {isLoading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  Đang xác thực...
                </span>
              ) : 'Đăng Nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
