import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosClient from '../utils/axiosClient';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef(null);
  const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 phút

  // Hàm giải mã Token JWT -> lấy ra thông tin user
  const decodeAndSetUser = (token, role) => {
    try {
      const decoded = jwtDecode(token);
      // Claims trong JWT của BE:
      // sub = TaiKhoan, http://...nameidentifier = MaGV/MaSV/MaQTV, http://...name = HoTen, http://...role = Role
      const userData = {
        TaiKhoan: decoded.sub,
        MaId: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        HoTen: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
        role: role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
      };
      
      // Map role về đúng chuẩn FE đang dùng
      if (userData.role === 'Admin') userData.role = 'admin';
      else if (userData.role === 'Lecturer') userData.role = 'lecturer';
      else if (userData.role === 'Student') userData.role = 'student';

      // Gán mã ID cụ thể theo role
      if (userData.role === 'admin') userData.MaQTV = userData.MaId;
      else if (userData.role === 'lecturer') userData.MaGV = userData.MaId;
      else if (userData.role === 'student') userData.MaSV = userData.MaId;

      setUser(userData);
      localStorage.setItem('stu_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.error('Giải mã Token thất bại:', err);
      return null;
    }
  };

  // Khôi phục session từ localStorage khi F5
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Kiểm tra Token hết hạn chưa
        if (decoded.exp * 1000 > Date.now()) {
          const stored = localStorage.getItem('stu_user');
          if (stored) {
            setUser(JSON.parse(stored));
          } else {
            decodeAndSetUser(token);
          }
        } else {
          // Token hết hạn -> dọn sạch
          localStorage.removeItem('token');
          localStorage.removeItem('stu_user');
        }
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('stu_user');
      }
    }
    setLoading(false);
  }, []);

  // Helper: Tạo hoặc lấy DeviceUUID vĩnh viễn từ localStorage (không bị xóa khi logout)
  const getOrCreateDeviceUUID = () => {
    let uuid = localStorage.getItem('device_uuid');
    if (!uuid) {
      uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem('device_uuid', uuid);
    }
    return uuid;
  };

  // Hàm Login: Gọi API thật từ Backend C#
  const login = async (username, password) => {
    try {
      const response = await axiosClient.post('/auth/login', {
        taiKhoan: username,
        matKhau: password
      });

      if (response.data && response.data.success) {
        const token = response.data.data.token;
        const role = response.data.data.role;

        // Cất Token vào két sắt localStorage
        localStorage.setItem('token', token);

          // Giải mã Token và set User session
          const userData = decodeAndSetUser(token, role);
  
          if (userData) {
            // Cập nhật thêm dữ liệu bổ sung từ response (như AnhDaiDien, hasPasskey)
            const extraData = { 
              hasPasskey: !!response.data.data.hasPasskey,
              AnhDaiDien: response.data.data.anhDaiDien
            };
            
            const merged = { ...userData, ...extraData };
            setUser(merged);
            localStorage.setItem('stu_user', JSON.stringify(merged));
  
            // Đăng ký Passkey cho sinh viên nếu chưa có
            if (userData.role === 'student' && userData.MaSV && !response.data.data.hasPasskey) {
              await registerPasskey(userData.MaSV);
            }
            return { success: true, role: userData.role };
          }
      }
      return { success: false, message: response.data?.message || 'Đăng nhập thất bại' };
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || 'Sai tài khoản hoặc mật khẩu!';
      return { success: false, message: msg };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('stu_user');
    localStorage.removeItem('token');
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  }, []);

  // Reset timer mỗi khi có tương tác
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      logout();
      // Chuyển hướng về trang đăng nhập
      window.location.href = '/login';
    }, INACTIVITY_LIMIT_MS);
  }, [logout, INACTIVITY_LIMIT_MS]);

  // Bắt đầu / Dừng theo dõi khi user thay đổi
  useEffect(() => {
    if (!user) {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      return;
    }
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer));
    resetInactivityTimer(); // khởi đầu timer ngay khi đăng nhập
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetInactivityTimer]);

  // Hàm đăng ký Passkey (Dùng chung cho Login, Profile, Checkin)
  const registerPasskey = async (maSv) => {
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      
      // Lấy DeviceUUID vĩnh viễn của trình duyệt này
      const deviceUuid = getOrCreateDeviceUUID();

      // 1. Xin server tạo Options đăng ký (Gửi kèm DeviceUUID để BE kiểm tra)
      const optRes = await axiosClient.get(`/webauthn/register-options?maSv=${maSv}&deviceUuid=${deviceUuid}`);
      
      // 2. Kích hoạt Popup của OS để quét Sinh trắc học
      const attResp = await startRegistration(optRes.data);
      
      // 3. Gửi key về server verify và lưu lại
      await axiosClient.post(`/webauthn/register-verify?maSv=${maSv}`, attResp);
      
      // Cập nhật session
      updateUserSession({ hasPasskey: true });
      
      alert("🔐 Thiết lập Khóa truy cập Sinh trắc học (Passkeys) thành công!");
      return true;
    } catch (err) {
      console.warn('[WebAuthn] Đăng ký Passkey thất bại hoặc bị hủy:', err.message);
      const errMsg = err.response?.data?.message || err.message;
      // Nếu backend chặn do đã đăng ký hoặc máy bị xí, hiển thị thông báo rõ ràng
      alert("❌ " + errMsg + 
            "\n\n💡 Mẹo: Bạn chỉ cần dùng vân tay/PIN của máy để xác nhận. Việc này hoàn toàn an toàn và KHÔNG ảnh hưởng đến tài khoản Google/Email.");
      return false;
    }
  };

  const updateUserSession = (newUserData) => {
    setUser(prevUser => {
      // Ưu tiên lấy dữ liệu từ state cũ (prevUser), nếu không có thì lấy từ localStorage
      const baseData = prevUser || JSON.parse(localStorage.getItem('stu_user') || '{}');
      const updated = { ...baseData, ...newUserData };
      
      // Lưu vào localStorage để đồng bộ
      localStorage.setItem('stu_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, registerPasskey, updateUserSession, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
