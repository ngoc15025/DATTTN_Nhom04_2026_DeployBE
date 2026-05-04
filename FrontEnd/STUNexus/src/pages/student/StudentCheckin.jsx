import React, { useState, useEffect, useContext } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axiosClient from '../../utils/axiosClient';
import { AuthContext } from '../../context/AuthContext';
import { FaMapMarkerAlt, FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaQrcode } from 'react-icons/fa';

const StudentCheckin = () => {
  const { classId } = useParams(); // classId is MaBuoiHoc
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, registerPasskey } = useContext(AuthContext);
  
  const [status, setStatus] = useState('checking');
  const [message, setMessage] = useState('Đang chuẩn bị xác thực thiết bị...');
  const [gps, setGps] = useState(null);
  const [distance, setDistance] = useState(null);
  const [errorFlags, setErrorFlags] = useState({ isGpsFraud: false, isDeviceFraud: false });
  const [browserWarning, setBrowserWarning] = useState(null);

  // Kiểm tra trình duyệt khi tải trang
  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    
    if (!isIOS && isAndroid) {
      // Chỉ cảnh báo trên Android - các trình duyệt không tương thích
      const isCocCoc = ua.includes('coccoc') || ua.includes('CocCoc');
      const isInAppZaloFB = ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('ZaloApp') || ua.includes('Instagram');
      
      if (isCocCoc || isInAppZaloFB) {
        setBrowserWarning('Trình duyệt này có thể không hỗ trợ Passkey trên Android. Nếu gặp lỗi, vui lòng nhấn "⋮" góc trên phải → "Mở bằng Chrome" để thiết lập Passkey.');
      }
    }
  }, []);

  useEffect(() => {
    const performCheckin = async () => {
      try {
        const maSv = user?.MaSV || user?.MaId;
        if (!maSv) throw new Error('Không xác định được tài khoản sinh viên.');

        setMessage('Đang lấy tọa độ GPS...');
        if (!navigator.geolocation) throw new Error('Trình duyệt không hỗ trợ GPS.');

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setGps({ lat: latitude, lng: longitude });
            setMessage('Đang ký xác thực thiết bị...');

            try {
              // GIAI ĐOẠN 1: Gửi GPS + QR Token lên BE để đối chiếu và lấy Options
              setMessage('Đối chiếu thông tin và yêu cầu xác thực...');
              
              const optionsRes = await axiosClient.post('/webauthn/assertion-options', {
                 maSv: maSv,
                 maBuoiHoc: parseInt(classId),
                 lat: parseFloat(latitude.toFixed(6)),
                 long: parseFloat(longitude.toFixed(6)),
                 qrToken: token
              });

              // GIAI ĐOẠN 2: Hiển thị FaceID/Vân tay của trình duyệt
              setMessage('Vui lòng xác thực sinh trắc học...');
              const { startAuthentication } = await import('@simplewebauthn/browser');
              
              let assertionResp;
              try {
                  assertionResp = await startAuthentication(optionsRes.data);
              } catch (authErr) {
                  throw new Error('Bạn đã hủy hoặc xác thực Sinh trắc học thất bại!');
              }

              setMessage('Đang hoàn tất điểm danh...');

              // GIAI ĐOẠN 3: Gửi kết quả chữ ký lên xác minh
              const verifyRes = await axiosClient.post(`/webauthn/assertion-verify?maSv=${maSv}`, assertionResp);

              setStatus('success');
              setMessage('Điểm danh thành công!');
              if (verifyRes.data.distance !== undefined) setDistance(verifyRes.data.distance);
            } catch (err) {
              setStatus('error');
              setMessage(err.response?.data?.message || err.message || 'Điểm danh thất bại!');
              const data = err.response?.data || {};
              if (data.distance !== undefined) setDistance(data.distance);
              
              if (data.isGpsFraud !== undefined || data.isDeviceFraud !== undefined) {
                 setErrorFlags({ isGpsFraud: !!data.isGpsFraud, isDeviceFraud: !!data.isDeviceFraud });
              } else {
                 setErrorFlags({ isGpsFraud: true, isDeviceFraud: false });
              }
            }
          },
          () => {
            setStatus('error');
            setMessage('Không thể lấy vị trí. Vui lòng bật GPS cho trình duyệt!');
            setErrorFlags({ isGpsFraud: true, isDeviceFraud: false });
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'Xác thực thiết bị thất bại.');
        setErrorFlags({ isGpsFraud: false, isDeviceFraud: true });
      }
    };

    setTimeout(() => { performCheckin(); }, 800);
  }, [classId, token]);

  return (
    <div className="container-fluid d-flex align-items-center justify-content-center min-vh-100" style={{backgroundColor: '#eef2f7'}}>
      <div className="card glass-panel border-0 shadow-lg p-4 p-md-5" style={{maxWidth: '450px', width: '100%', borderRadius: '20px'}}>
        <div className="text-center mb-4">
          <div className="bg-primary text-white d-inline-block rounded-circle mb-3 p-3 shadow-sm">
            <FaQrcode style={{fontSize: '2rem'}} />
          </div>
          <h4 className="fw-bold text-dark mb-1">Check-in Lớp {classId}</h4>
          <p className="text-muted small">Token xác minh: <span className="text-primary font-monospace">{token?.substring(0,8)}</span></p>
        </div>

        {/* Cảnh báo trình duyệt không tương thích (chỉ hiện trên Android + Cốc Cốc / Zalo) */}
        {browserWarning && (
          <div className="alert alert-warning border-0 rounded-3 small py-2 px-3 mb-3 d-flex align-items-start gap-2">
            <span>⚠️</span>
            <span>{browserWarning}</span>
          </div>
        )}

        {status === 'checking' && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" style={{width: '3.5rem', height: '3.5rem'}} role="status"></div>
            <h6 className="fw-medium text-dark">{message}</h6>
            <p className="text-muted small px-3 mt-3">Hệ thống đang đối chiếu vị trí GPS của bạn với giảng viên để đảm bảo tính minh bạch.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-4">
            <FaCheckCircle className="text-success mb-3" style={{fontSize: '5rem'}} />
            <h4 className="fw-bold text-success mb-3">Thành công!</h4>
            <p className="text-muted fw-medium">{message}</p>
            
            <div className="bg-success bg-opacity-10 p-3 rounded-4 text-start mt-4 border border-success border-opacity-25">
              <div className="d-flex align-items-center">
                <div className="bg-white p-2 rounded-circle me-3 shadow-sm"><FaMapMarkerAlt className="text-success" /></div>
                <div>
                  <div className="small fw-bold text-dark">Khoảng cách xác thực</div>
                  <div className={`small fw-bold ${distance !== null && distance <= 30 ? 'text-success' : 'text-muted'}`}>
                    {distance !== null ? `${distance} mét` : 'Đã xác thực vị trí'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <FaExclamationTriangle className="text-danger mb-3" style={{fontSize: '5rem'}} />
            <h4 className="fw-bold text-danger mb-3">Thất bại</h4>
            <p className="text-danger fw-medium px-3">{message}</p>
            
            {errorFlags.isGpsFraud && (
              <div className="bg-danger bg-opacity-10 p-3 rounded-4 text-start mt-4 border border-danger border-opacity-25">
                <div className="d-flex align-items-center">
                  <div className="bg-white p-2 rounded-circle me-3 shadow-sm"><FaMapMarkerAlt className="text-danger" /></div>
                  <div>
                    <div className="small fw-bold text-dark">Lỗi xác thực không gian</div>
                    <div className="small fw-bold text-danger">
                      {distance !== null ? `Bạn đang cách điểm quét ${distance} mét` : (gps ? 'Vị trí không hợp lệ' : 'Bị từ chối GPS')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errorFlags.isDeviceFraud && (
              <div className="bg-danger bg-opacity-10 p-3 rounded-4 text-start mt-3 border border-danger border-opacity-25">
                <div className="d-flex align-items-center">
                  <div className="bg-white p-2 rounded-circle me-3 shadow-sm"><FaShieldAlt className="text-danger" /></div>
                  <div>
                    <div className="small fw-bold text-dark">Lỗi xác thực thiết bị</div>
                    <div className="small fw-bold text-danger">Thiết bị không hợp lệ / Sai chữ ký</div>
                  </div>
                </div>
              </div>
            )}
            
            {message === "Thiết bị chưa được đăng ký Passkey." ? (
              <button 
                className="btn btn-success mt-4 py-2 w-100 shadow-sm fw-bold rounded-pill d-flex align-items-center justify-content-center gap-2" 
                onClick={async () => {
                  const success = await registerPasskey(user?.MaSV || user?.MaId);
                  if (success) window.location.reload();
                }}
              >
                <FaShieldAlt /> Thiết lập Passkey ngay
              </button>
            ) : (
              <button className="btn btn-primary mt-4 py-2 w-100 shadow-sm fw-bold rounded-pill" onClick={() => window.location.reload()}>
                Thử Lại Trực Tiếp Tại Lớp
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCheckin;
