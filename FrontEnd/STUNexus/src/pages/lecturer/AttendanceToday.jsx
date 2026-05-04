import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarDay,
  FaQrcode,
  FaClipboardList,
  FaSync,
  FaChalkboard,
  FaClock,
  FaCheckCircle,
  FaHourglassHalf,
} from "react-icons/fa";
import axiosClient from "../../utils/axiosClient";
import { AuthContext } from "../../context/AuthContext";

const AttendanceToday = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const maGv = user?.MaGV || user?.MaId;

  const todayLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString(
    "vi-VN",
    {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );

  const fetchSessions = async () => {
    if (!maGv) return;
    setLoading(true);
    try {
      // Lấy tất cả buổi học của GV hôm nay với cache-buster
      const res = await axiosClient.get(`/buoihoc/today/${maGv}?t=${Date.now()}`);
      let data = res.data?.data || [];

      // Nếu người dùng chọn ngày khác hôm nay, lọc qua tất cả lớp của GV
      if (selectedDate !== new Date().toISOString().split("T")[0]) {
        // Lấy tất cả lớp của GV rồi lọc buổi theo ngày đã chọn
        const lopRes = await axiosClient.get(`/lophoc?t=${Date.now()}`);
        const allClasses = (lopRes.data?.data || []).filter(
          (c) => c.maGv === maGv,
        );
        const sessionPromises = allClasses.map((c) =>
          axiosClient.get(`/buoihoc/class/${c.maLop}?t=${Date.now()}`),
        );
        const results = await Promise.all(sessionPromises);
        const allSessions = results.flatMap((r) => r.data || []);
        data = allSessions
          .filter((s) => {
            const ngay =
              typeof s.ngayHoc === "string" ? s.ngayHoc.split("T")[0] : "";
            return ngay === selectedDate;
          })
          .map((s) => ({
            ...s,
            tenLop:
              allClasses.find((c) => c.maLop === s.maLop)?.tenLop || s.maLop,
            tenMon: allClasses.find((c) => c.maLop === s.maLop)?.tenMon || "",
          }));
      }

      setSessions(data);
    } catch (err) {
      console.error("Lỗi tải lịch hôm nay:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [maGv, selectedDate]);

  const getStatusBadge = (trangThai) => {
    if (trangThai === 2)
      return (
        <span
          className="badge d-flex align-items-center gap-1 px-3 py-2"
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            borderRadius: "20px",
            fontSize: "0.78rem",
          }}
        >
          <FaCheckCircle /> Đã điểm danh
        </span>
      );
    if (trangThai === 1)
      return (
        <span
          className="badge d-flex align-items-center gap-1 px-3 py-2"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            borderRadius: "20px",
            fontSize: "0.78rem",
          }}
        >
          <FaSync className="fa-spin" /> Đang mở QR
        </span>
      );
    return (
      <span
        className="badge d-flex align-items-center gap-1 px-3 py-2"
        style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          borderRadius: "20px",
          fontSize: "0.78rem",
        }}
      >
        <FaHourglassHalf /> Chưa điểm danh
      </span>
    );
  };

  const formatTime = (t) => {
    if (!t) return "--:--";
    return String(t).substring(0, 5);
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 mt-2 flex-wrap gap-3">
        <div>
          <h3 className="m-0 fw-bold text-dark d-flex align-items-center gap-2">
            <FaCalendarDay className="text-primary" /> Điểm Danh Hôm Nay
          </h3>
          <p className="text-muted small mt-1 mb-0">
            {todayLabel} &mdash; Xin chào, <strong>{user?.HoTen}</strong>
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <input
            type="date"
            className="form-control border-0 shadow-sm"
            style={{
              borderRadius: "8px",
              maxWidth: "180px",
              background: "#f8f9fa",
            }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2 shadow-sm"
            style={{ borderRadius: "8px", padding: "8px 18px" }}
            onClick={fetchSessions}
          >
            <FaSync /> Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div
            className="card border-0 shadow-sm h-100"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            }}
          >
            <div className="card-body p-3 text-white">
              <div className="fs-2 fw-bold">{sessions.length}</div>
              <div className="small opacity-75">Tổng buổi học</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card border-0 shadow-sm h-100"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #10b981, #059669)",
            }}
          >
            <div className="card-body p-3 text-white">
              <div className="fs-2 fw-bold">
                {sessions.filter((s) => s.trangThaiBh === 1 || s.trangThaiBh === 2).length}
              </div>
              <div className="small opacity-75">Đã / Đang điểm danh</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card border-0 shadow-sm h-100"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
            }}
          >
            <div className="card-body p-3 text-white">
              <div className="fs-2 fw-bold">
                {sessions.filter((s) => !s.trangThaiBh || s.trangThaiBh === 0).length}
              </div>
              <div className="small opacity-75">Chưa điểm danh</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div
            className="card border-0 shadow-sm h-100"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
            }}
          >
            <div className="card-body p-3 text-white">
              <div className="fs-2 fw-bold">
                {new Set(sessions.map((s) => s.maLop)).size}
              </div>
              <div className="small opacity-75">Lớp học</div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Cards */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Đang tải lịch điểm danh...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div
          className="card border-0 shadow-sm text-center py-5"
          style={{ borderRadius: "16px" }}
        >
          <div className="py-4">
            <FaCalendarDay
              className="text-muted"
              style={{ fontSize: "3rem", opacity: 0.3 }}
            />
            <h5 className="text-muted fw-bold mt-3">Không có buổi học nào</h5>
            <p className="text-muted small">
              Ngày {todayLabel} không có lịch dạy.
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {sessions.map((session) => (
            <div className="col-12 col-md-6 col-xl-4" key={session.maBuoiHoc}>
              <div
                className="card border-0 shadow-sm h-100 position-relative overflow-hidden"
                style={{
                  borderRadius: "16px",
                  borderLeft:
                    session.trangThaiBh === 2
                      ? "4px solid #10b981"
                      : session.trangThaiBh === 1
                      ? "4px solid #3b82f6"
                      : "4px solid #f59e0b",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 25px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                <div className="card-body p-4">
                  {/* Badge trạng thái */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    {getStatusBadge(session.trangThaiBh)}
                    {session.loaiBuoiHoc === 1 && (
                      <span
                        className="badge bg-warning text-dark px-2 py-1 rounded-pill shadow-sm"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Học bù
                      </span>
                    )}
                  </div>

                  {/* Tên môn */}
                  <h5
                    className="fw-bold text-dark mb-1"
                    style={{ lineHeight: 1.3 }}
                  >
                    {session.tenMon || session.tenLop}
                  </h5>
                  <p className="text-muted small mb-3">
                    <FaChalkboard className="me-1" />
                    {session.tenLop} &bull;{" "}
                    <span className="font-monospace">{session.maLop}</span>
                  </p>

                  {/* Giờ học */}
                  <div className="d-flex align-items-center gap-2 mb-4 p-2 bg-light rounded-3">
                    <FaClock className="text-primary" />
                    <span className="fw-semibold text-dark">
                      {formatTime(session.gioBatDau)}
                    </span>
                    <span className="text-muted">→</span>
                    <span className="fw-semibold text-dark">
                      {formatTime(session.gioKetThuc)}
                    </span>
                  </div>

                  {/* Nút điểm danh */}
                  <div className="d-flex gap-2">
                    {session.trangThaiBh === 2 ? (
                      <button
                        className="btn btn-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-semibold py-2 rounded-pill shadow-sm"
                        disabled
                      >
                        <FaQrcode /> Đã kết thúc
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-2 fw-semibold py-2 rounded-pill shadow-sm"
                        onClick={() =>
                          navigate(
                            `/lecturer/qr-attendance/${session.maBuoiHoc}`,
                            {
                              state: { maLop: session.maLop },
                            },
                          )
                        }
                      >
                        <FaQrcode /> Điểm danh QR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceToday;
