# 🎓 Hệ thống Quản lý Điểm danh Sinh viên chống gian lận (DATTTN - Nhóm 04 - 2026)

[![.NET](https://img.shields.io/badge/.NET-8.0%20%7C%209.0-512BD4?logo=dotnet&logoColor=white)](#)
[![SQL Server](https://img.shields.io/badge/SQL_Server-CC2927?logo=microsoft-sql-server&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](#)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?logo=swagger&logoColor=black)](#)

Một giải pháp toàn diện giúp tự động hóa và minh bạch hóa quy trình điểm danh tại giảng đường. Hệ thống sử dụng công nghệ quét mã QR động kết hợp với định vị GPS và nhận diện thiết bị (Device ID) để ngăn chặn tuyệt đối các hành vi gian lận (điểm danh hộ, điểm danh từ xa).

---

## 🌟 Tính năng nổi bật

### 👨‍🏫 Dành cho Giảng viên
* **Quản lý Lịch học Tự động (Auto-Scheduling):** Thiết lập tham số (ngày bắt đầu, số buổi) để hệ thống tự động sinh ra toàn bộ lịch học của học kỳ.
* **Mở phiên Điểm danh (Dynamic QR):** Trình chiếu mã QR động lên màn hình lớp học (tự động làm mới mỗi 30 giây).
* **Theo dõi Real-time:** Nhận thông báo và cập nhật trạng thái điểm danh của sinh viên ngay lập tức thông qua WebSockets (SignalR) mà không cần tải lại trang.
* **Xử lý Ngoại lệ:** Dễ dàng báo nghỉ, xếp lịch học bù, hoặc can thiệp điểm danh thủ công cho các trường hợp đặc biệt.
* **Import Dữ liệu:** Hỗ trợ nhập danh sách sinh viên hàng loạt bằng file Excel.
* **Thống kê & Báo cáo:** Xem biểu đồ chuyên cần trực quan của từng lớp.

### 👨‍🎓 Dành cho Sinh viên
* **Điểm danh Nhanh chóng:** Quét mã QR trên màn hình của giảng viên thông qua ứng dụng di động.
* **Tra cứu Lịch sử:** Xem lại chi tiết lịch trình và trạng thái đi học của bản thân qua từng tuần.
* **Khiếu nại Trực tuyến:** Gửi yêu cầu phản hồi trực tiếp đến giảng viên nếu phát hiện sai sót dữ liệu.

### 🛡️ Cơ chế Chống gian lận (Anti-Cheat 3 Lớp)
1. **Lớp 1 - Mã QR Động:** QR Code chứa mã thông báo (Token) có thời gian sống ngắn, vô hiệu hóa việc sinh viên chụp ảnh gửi cho bạn bè.
2. **Lớp 2 - Xác thực Tọa độ (GPS):** So sánh khoảng cách (Haversine formula) giữa thiết bị của sinh viên và tọa độ phòng học.
3. **Lớp 3 - Định danh Thiết bị (Device ID):** Khóa tài khoản sinh viên với một thiết bị di động duy nhất (Trusted Device), ngăn chặn việc dùng một điện thoại quét cho nhiều người.

---

## 🛠️ Công nghệ sử dụng

* **Backend:** C# / ASP.NET Core Web API (.NET 8/9)
* **Database:** Microsoft SQL Server (Entity Framework Core)
* **Real-time Communication:** SignalR
* **Authentication:** JSON Web Tokens (JWT)
* **Deployment:** Docker / Render / IIS (SmarterASP)
* **Frontend/Mobile:** *(Cập nhật thêm công nghệ FE của nhóm vào đây, VD: ReactJS / React Native)*

---


