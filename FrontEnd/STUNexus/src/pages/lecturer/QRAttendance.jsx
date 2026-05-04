import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { FaSync, FaArrowLeft, FaStopCircle } from "react-icons/fa";
import axiosClient from "../../utils/axiosClient";

const QRAttendance = () => {
  const { classId } = useParams();
  const buoiHocId = classId;
  const navigate = useNavigate();
  const location = useLocation();
  const maLop = location.state?.maLop;

  const [token, setToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(true);

  const hasShownGpsWarning = useRef(false);

  useEffect(() => {
    const updateSessionStatus = async (lat = null, lng = null) => {
      try {
        await axiosClient.put(`/buoihoc/${buoiHocId}/status`, {
          trangThaiBh: isActive ? 1 : 2,
          lat: lat,
          long: lng,
        });
      } catch (err) {
        console.error("Lỗi cập nhật trạng thái buổi học:", err);
      }
    };

    if (isActive) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateSessionStatus(
              position.coords.latitude,
              position.coords.longitude,
            );
          },
          (err) => {
            console.warn("Không lấy được GPS giảng viên:", err);

            updateSessionStatus();

            if (!hasShownGpsWarning.current) {
              hasShownGpsWarning.current = true;

              const message =
                err.code === 1
                  ? "Bạn đã từ chối quyền vị trí. Sinh viên có thể điểm danh từ xa!"
                  : "Không lấy được vị trí hiện tại. Có thể do GPS chậm, mạng yếu hoặc timeout.";

              alert(`Cảnh báo: ${message}`);
            }
          },
          { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
        );
      } else {
        updateSessionStatus();
      }
    } else {
      updateSessionStatus(); // Chốt sổ, không cần GPS
    }

    if (!isActive) return;

    let localTimer;
    const fetchToken = async () => {
      try {
        const res = await axiosClient.get(`/buoihoc/${buoiHocId}/qr-token`);
        if (res.data && res.data.success) {
          setToken(res.data.token);
          setTimeLeft(30);
        }
      } catch (err) {
        console.error("Lỗi lấy mã điểm danh", err);
      }
    };

    // Lấy lần đầu khi mở
    fetchToken();

    // Bắt đầu đếm ngược nội bộ
    localTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          fetchToken(); // Lấy mã mới từ Server
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(localTimer);
  }, [isActive, buoiHocId]);

  const qrUrl = `${window.location.protocol}//${window.location.host}/student/checkin/${buoiHocId}?token=${token}`;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-light rounded-circle shadow-sm"
            style={{ width: "40px", height: "40px" }}
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
          </button>
          <h3 className="m-0 fw-bold text-dark">Mã QR - Lớp {maLop || buoiHocId}</h3>
        </div>
        <button
          className={`btn ${isActive ? "btn-danger" : "btn-success"} d-flex align-items-center gap-2 px-4 shadow-sm fw-bold`}
          onClick={() => setIsActive(!isActive)}
          style={{ borderRadius: "8px" }}
        >
          {isActive ? (
            <>
              <FaStopCircle /> Dừng Điểm Danh
            </>
          ) : (
            <>
              <FaSync /> Tiếp tục
            </>
          )}
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div
            className="card glass-panel border-0 shadow-sm text-center py-5 px-3"
            style={{ borderRadius: "16px" }}
          >
            <h4 className="fw-bold mb-4 text-primary">
              Quét mã QR để điểm danh
            </h4>
            <div
              className="qr-container bg-white p-4 rounded-4 shadow-sm d-inline-block mx-auto mb-4 border"
              style={{ width: "fit-content" }}
            >
              {isActive ? (
                <QRCodeSVG value={qrUrl} size={280} level={"H"} />
              ) : (
                <div
                  style={{
                    width: 280,
                    height: 280,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f8f9fa",
                  }}
                  className="text-muted rounded"
                >
                  <h5 className="mb-0 fw-bold">Đã dừng thao tác</h5>
                </div>
              )}
            </div>
            {isActive && (
              <div
                className="bg-light p-3 rounded-3 text-dark mx-auto"
                style={{ maxWidth: "400px" }}
              >
                <p className="mb-1 fw-medium">
                  Mã QR sẽ tự làm mới sau{" "}
                  <span className="text-danger fs-5 fw-bold mx-1">
                    {timeLeft}
                  </span>{" "}
                  giây.
                </p>
              </div>
            )}
            {!isActive && (
              <p className="text-danger fw-bold fs-5">
                Buổi điểm danh đã kết thúc.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRAttendance;
