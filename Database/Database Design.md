1\. Xây dựng Website

 	-Quản lý Giảng viên

 	-Quản lý Sinh viên

&#x09;-Quản lý Môn học

 	-Quản lý Lớp học (Trong một môn học có thể có nhiều Lớp học khác nhau, có thể trùng thời gian nhưng khác giảng viên)

&#x09;-Quản lý buổi học và điểm danh từng buổi học

 	-Điểm danh bằng mã QR và anti-cheat

&#x09;-Sơ bộ (Trong môn học có nhiều Lớp học, trong Lớp học có nhiều buổi học, trong buổi học có một lần điểm danh)

&#x09;-Lớp học khi khởi tạo, giảng viên sẽ nhập ngày bắt đầu, giờ bắt đầu, giờ kết thúc, nhập số buổi học), khi hoàn thành tạo, hệ thống tự tạo buổi học dựa vào số buổi học, mỗi buổi học cách nhau 1 tuần.

2\. Thiết kế CSDL

2.1 Lựa chọn CSDL và HQT

\-Loại CSDL: Quan hệ, vì:

+Tính toàn vẹn dữ liệu: Quản lý lớp học, sinh viên cần sự chặt chẽ. Các ràng buộc (Constraints) của SQL giúp tránh sai lệch số liệu.

+Truy vấn phức tạp: Việc thống kê, của từng sinh viên, giảng viên, lớp học yêu cầu các lệnh Join (kết nối nhiều bảng) mà SQL xử lý cực tốt.

+Bịa ra hợp lý: 

&#x09;Hệ thống quản lý lớp học và điểm danh yêu cầu tính toàn vẹn dữ liệu (Data Integrity) cực kỳ khắt khe. Các ràng buộc (Constraints) của SQL như Primary Key, Foreign Key giúp tránh sai lệch số liệu  (ví dụ: không thể điểm danh cho một sinh viên không tồn tại trong lớp). Ngoài ra, việc thống kê chuyên cần yêu cầu các lệnh Join (kết nối nhiều bảng: SinhVien - BuoiHoc - DiemDanh) mà SQL xử lý cực kỳ tối ưu và tốc độ

(Cảnh báo nếu chọn loại csdl khác sẽ dẫn đến...)

\-Hệ quản trị CSDL: SQL Server (Nêu vài lý do) + (Cảnh báo nếu như chọn loại khác)

2.2 Thiết kế CSDL cho Website điểm danh

Quan niệm => Vật lý

  1. Xác định thực thể.

  2. Xác định thuộc tính cho từng thực thể.

  3. Xác định quan hệ giữa các thực thể.

  4. Xác định bảng số cho quan hệ

  5. Xác định khóa chính





1\. Nhóm Bảng Người Dùng (Users)

Để quản lý 3 đối tượng sử dụng rõ ràng, chúng ta thiết kế các bảng sau:

Bảng QuanTriVien (Admin)

•	MaQTV (PK): Mã quản trị viên.

•	TaiKhoan: Tên đăng nhập.

•	MatKhau: Mật khẩu (đã mã hóa hash).

•	HoTen: Họ và tên.

Bảng GiangVien (Giảng viên)

•	MaGV (PK): Mã giảng viên.

•	TaiKhoan: Tên đăng nhập.

•	MatKhau: Mật khẩu.

&#x20;   	HoLot: Họ và tên lót giảng viên

•	HoTen: Tên giảng viên.

•	Email: Email liên hệ.

•	SoDienThoai: Số điện thoại.

•	TrangThai: Hoạt động / Khóa (phục vụ chức năng Admin mở/khóa tài khoản).

Bảng SinhVien (Sinh viên)

•	MaSV (PK): Mã sinh viên.

•	TaiKhoan: Tên đăng nhập.

•	MatKhau: Mật khẩu.

* &#x20;    HoLot: Họ và tên lót sinh viên

•	TenSV: Tên sinh viên.

•	Lop: lớp

•	Email: Email sinh viên.

•	SoDienThoai: Số điện thoại.

•	MaThietBi: Chuỗi mã định danh phần cứng thiết bị (Mã thiết bị mặc định).

•	AnhDaiDien: Ảnh đại diện (Kiểu VARCHAR/NVARCHAR - đường dẫn ảnh) có thể null.



2\. Nhóm Bảng Nghiệp Vụ Cốt Lõi (Core Business)

Bảng LopHoc (Lớp học)

•	MaLop (PK): Mã lớp học.

•	TenLop: Tên lớp.

•	MaMon: Mã môn học.

•	MaGV (FK): Mã giảng viên phụ trách (Liên kết với bảng GiangVien).

Bảng MonHoc (Môn học)

* MaMon: Mã môn học
* TenMon: Tên môn học

Bảng ChiTietLopHoc (Danh sách sinh viên trong lớp)

(Bảng trung gian vì 1 lớp có nhiều sinh viên, và 1 sinh viên học nhiều lớp) 

•	MaLop (PK, FK): Liên kết bảng LopHoc.

•	MaSV (PK, FK): Liên kết bảng SinhVien.

Bảng BuoiHoc (Phiên điểm danh)

•	MaBuoiHoc (PK): Mã buổi học.

•	MaLop (FK): Mã lớp học (Liên kết với bảng LopHoc).

•	NgayHoc: Ngày diễn ra buổi học.

•	GioBatDau: Giờ bắt đầu.

•	GioKetThuc: Giờ kết thúc.

•	SoBuoi: Số buổi học.

•	TrangThaiBH: Trạng thái buổi học(Giá trị:Chưa điểm danh, Đã điểm danh, Không điểm danh).

•	GhiChu: Nội dung hoặc ghi chú buổi học.

•	ToaDoGoc\_Lat: Vĩ độ GPS của máy giảng viên (Phục vụ Anti-Cheat).

•	ToaDoGoc\_Long: Kinh độ GPS của máy giảng viên.



Bảng DiemDanh (Chi tiết kết quả điểm danh)

•	MaDiemDanh (PK): Mã ID bản ghi điểm danh.

•	MaBuoiHoc (FK): Liên kết bảng BuoiHoc.

•	MaSV (FK): Liên kết bảng SinhVien.

•	TrangThai: Trạng thái điểm danh (Giá trị: Có mặt, Đi trễ, Vắng có phép, Vắng không phép).

•	ThoiGianQuet: Thời gian sinh viên thực hiện quét mã / Thời gian cập nhật.

•	GhiChu: Ghi chú (VD: "Đã nộp giấy khám bệnh").

•	NguoiCapNhat: Lưu mã người chỉnh sửa cuối cùng (Giảng viên hoặc Hệ thống tự động) để truy vết.

•	MaThietBi: Chuỗi mã định danh phần cứng thiết bị (Phục vụ Anti-Cheat).

•	ToaDoSV\_Lat: Vĩ độ GPS của máy sinh viên lúc quét.

•	ToaDoSV\_Long: Kinh độ GPS của máy sinh viên lúc quét.

3\. Mối Quan Hệ Giữa Các Thực Thể (Relationships)

•	GiangVien (1) - (N) LopHoc: Một giảng viên có thể phụ trách nhiều lớp, nhưng mỗi lớp chỉ do một giảng viên phụ trách chính.

•	SinhVien (N) - (M) LopHoc: Mối quan hệ nhiều - nhiều, được giải quyết thông qua bảng trung gian ChiTietLopHoc.

•	LopHoc (1) - (N) BuoiHoc: Một lớp học sẽ có nhiều buổi học xuyên suốt học kỳ.

•	BuoiHoc (1) - (N) DiemDanh: Trong một buổi học sẽ có nhiều bản ghi điểm danh (tương ứng với số lượng sinh viên trong lớp).

•	SinhVien (1) - (N) DiemDanh: Một sinh viên sẽ có nhiều bản ghi điểm danh gắn với các buổi học khác nhau. (Đồng thời ràng buộc nghiệp vụ: 1 Sinh viên chỉ có tối đa 1 bản ghi DiemDanh trong 1 BuoiHoc).







