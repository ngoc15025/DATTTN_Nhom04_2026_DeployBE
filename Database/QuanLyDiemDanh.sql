CREATE DATABASE [QuanLyDiemDanh_DATTTN];
GO
USE [QuanLyDiemDanh_DATTTN];
GO

-- =============================================
-- 1. NHÓM BẢNG NGƯỜI DÙNG
-- =============================================
CREATE TABLE [dbo].[QuanTriVien] (
    [MaQTV] VARCHAR(20) PRIMARY KEY,
    [TaiKhoan] VARCHAR(50) NOT NULL UNIQUE,
    [MatKhau] VARCHAR(255) NOT NULL, -- Bắt buộc Hash
    [HoTen] NVARCHAR(100) NOT NULL
);

CREATE TABLE [dbo].[GiangVien] (
    [MaGV] VARCHAR(20) PRIMARY KEY,
    [TaiKhoan] VARCHAR(50) NOT NULL UNIQUE,
    [MatKhau] VARCHAR(255) NOT NULL, -- Bắt buộc Hash
    [HoLot] NVARCHAR(50) NOT NULL,
    [TenGV] NVARCHAR(50) NOT NULL,
    [Email] VARCHAR(100) NULL,
    [SoDienThoai] VARCHAR(15) NULL,
    [TrangThai] INT DEFAULT 1 -- 1: Hoạt động, 0: Bị khóa
);

CREATE TABLE [dbo].[SinhVien] (
    [MaSV] VARCHAR(20) PRIMARY KEY,
    [TaiKhoan] VARCHAR(50) NOT NULL UNIQUE,
    [MatKhau] VARCHAR(255) NOT NULL, -- Bắt buộc Hash
    [HoLot] NVARCHAR(50) NOT NULL,
    [TenSV] NVARCHAR(50) NOT NULL,
    [Lop] VARCHAR(50) NOT NULL, -- Lớp sinh hoạt (VD: D10CQCN)
    [Email] VARCHAR(100) NULL,
    [SoDienThoai] VARCHAR(15) NULL,
    [PasskeyCredentialId] VARBINARY(900) NULL,  -- FIDO2 Credential ID (max 1023 bytes theo spec, thực tế < 100 bytes)
    [PasskeyPublicKey] VARBINARY(MAX) NULL,
    [PasskeySignCount] BIGINT NULL,
    [PasskeyUserHandle] VARBINARY(MAX) NULL,
    [DeviceUUID] NVARCHAR(100) NULL,        -- Định danh thiết bị vật lý (1 máy = 1 SV)
    [AnhDaiDien] NVARCHAR(MAX) NULL
);

-- =============================================
-- 2. NHÓM BẢNG NGHIỆP VỤ CỐT LÕI
-- =============================================
CREATE TABLE [dbo].[MonHoc] (
    [MaMon] VARCHAR(20) PRIMARY KEY,
    [TenMon] NVARCHAR(150) NOT NULL
);

-- Vá lỗi: Đưa cấu hình Auto-Scheduling vào bảng Lớp Học
CREATE TABLE [dbo].[LopHoc] (
    [MaLop] VARCHAR(20) PRIMARY KEY,
    [TenLop] NVARCHAR(150) NOT NULL,
    [MaMon] VARCHAR(20) NOT NULL,
    [MaGV] VARCHAR(20) NOT NULL,
    [NgayBatDau] DATE NOT NULL,
    [NgayKetThuc] DATE NOT NULL,
    [GioBatDau] TIME NOT NULL,
    [GioKetThuc] TIME NOT NULL,
    [SoBuoiHoc] INT NOT NULL,
    CONSTRAINT FK_LopHoc_MonHoc FOREIGN KEY ([MaMon]) REFERENCES [MonHoc]([MaMon]),
    CONSTRAINT FK_LopHoc_GiangVien FOREIGN KEY ([MaGV]) REFERENCES [GiangVien]([MaGV])
);

CREATE TABLE [dbo].[ChiTietLopHoc] (
    [MaLop] VARCHAR(20) NOT NULL,
    [MaSV] VARCHAR(20) NOT NULL,
    PRIMARY KEY ([MaLop], [MaSV]),
    CONSTRAINT FK_CTLH_LopHoc FOREIGN KEY ([MaLop]) REFERENCES [LopHoc]([MaLop]),
    CONSTRAINT FK_CTLH_SinhVien FOREIGN KEY ([MaSV]) REFERENCES [SinhVien]([MaSV])
);

-- Vá lỗi: Lượt bỏ cấu hình, bổ sung cơ chế Xử lý ngoại lệ lịch học
CREATE TABLE [dbo].[BuoiHoc] (
    [MaBuoiHoc] INT IDENTITY(1,1) PRIMARY KEY, -- Tự động tăng
    [MaLop] VARCHAR(20) NOT NULL,
    [NgayHoc] DATE NOT NULL,
    [GioBatDau] TIME NOT NULL,
    [GioKetThuc] TIME NOT NULL,
    [LoaiBuoiHoc] INT DEFAULT 0, -- 0: Auto sinh, 1: Học bù, 2: Báo nghỉ
    [TrangThaiBH] INT DEFAULT 0, -- 0: Chưa điểm danh, 1: Đang mở QR, 2: Đã chốt sổ
    [GhiChu] NVARCHAR(500) NULL,
    [ToaDoGoc_Lat] FLOAT NULL, -- Lưu GPS lúc mở phiên
    [ToaDoGoc_Long] FLOAT NULL,
    CONSTRAINT FK_BuoiHoc_LopHoc FOREIGN KEY ([MaLop]) REFERENCES [LopHoc]([MaLop])
);

CREATE TABLE [dbo].[DiemDanh] (
    [MaDiemDanh] INT IDENTITY(1,1) PRIMARY KEY,
    [MaBuoiHoc] INT NOT NULL,
    [MaSV] VARCHAR(20) NOT NULL,
    [TrangThai] INT NOT NULL, -- 1: Có mặt, 2: Đi trễ, 3: Vắng có phép, 4: Vắng không phép
    [ThoiGianQuet] DATETIME NULL,
    [GhiChu] NVARCHAR(500) NULL,
    [NguoiCapNhat] VARCHAR(20) NULL, -- Lưu MaGV nếu sửa tay
    [MaThietBi_Log] VARCHAR(255) NULL, -- Lưu lại Token lúc quét để hậu kiểm
    [ToaDoSV_Lat] FLOAT NULL,
    [ToaDoSV_Long] FLOAT NULL,
    CONSTRAINT FK_DiemDanh_BuoiHoc FOREIGN KEY ([MaBuoiHoc]) REFERENCES [BuoiHoc]([MaBuoiHoc]),
    CONSTRAINT FK_DiemDanh_SinhVien FOREIGN KEY ([MaSV]) REFERENCES [SinhVien]([MaSV]),
    CONSTRAINT UQ_DiemDanh_1Lan UNIQUE ([MaBuoiHoc], [MaSV]) -- Ràng buộc: 1 Buổi SV chỉ quét 1 lần
);

-- =============================================
-- 4. BẢNG PHẢN HỒI / KHIẾU NẠI ĐIỂM DANH
-- =============================================
CREATE TABLE [dbo].[PhanHoi] (
    [MaPhanHoi]   INT IDENTITY(1,1) PRIMARY KEY,
    [MaDiemDanh]  INT NOT NULL,                    -- Ràng buộc: gắn với 1 bản ghi điểm danh cụ thể
    [NoiDung]     NVARCHAR(1000) NOT NULL,          -- Nội dung khiếu nại của sinh viên
    [MinhChung]   NVARCHAR(MAX) NULL,               -- Ảnh minh chứng dạng Base64
    [ThoiGianGui] DATETIME DEFAULT GETDATE(),       -- Thời điểm gửi
    [PhanHoiGv]   NVARCHAR(1000) NULL,              -- Ghi chú / phản hồi của giảng viên
    [TrangThai]   INT DEFAULT 0,                    -- 0: Chờ xử lý, 1: Đã duyệt, 2: Từ chối
    CONSTRAINT FK_PhanHoi_DiemDanh FOREIGN KEY ([MaDiemDanh]) REFERENCES [DiemDanh]([MaDiemDanh])
);
GO

-- =============================================
-- INDEXES — Tối ưu hóa tốc độ truy vấn
-- =============================================

-- [SinhVien] Tìm nhanh theo DeviceUUID khi kiểm tra "1 máy - 1 SV"
-- Dùng bởi: WebAuthnController -> MakeCredentialOptions (Chốt chặn 2)
CREATE NONCLUSTERED INDEX [IX_SinhVien_DeviceUUID]
    ON [dbo].[SinhVien] ([DeviceUUID])
    WHERE [DeviceUUID] IS NOT NULL;
GO

-- [SinhVien] Tìm nhanh theo PasskeyCredentialId khi xác thực sinh trắc học
-- Dùng bởi: WebAuthnController -> MakeAssertionResult (mỗi lần điểm danh)
CREATE NONCLUSTERED INDEX [IX_SinhVien_PasskeyCredentialId]
    ON [dbo].[SinhVien] ([PasskeyCredentialId])
    WHERE [PasskeyCredentialId] IS NOT NULL;
GO

-- [DiemDanh] Tìm nhanh lịch sử điểm danh theo sinh viên
-- Dùng bởi: DiemDanhController -> GET /diemdanh/student/{maSv} (Student Dashboard)
CREATE NONCLUSTERED INDEX [IX_DiemDanh_MaSV]
    ON [dbo].[DiemDanh] ([MaSV])
    INCLUDE ([TrangThai], [ThoiGianQuet]);
GO

-- [DiemDanh] Tìm nhanh theo buổi học (cho trang điểm danh real-time của GV)
-- Dùng bởi: DiemDanhController -> GET /diemdanh/buoi/{maBuoiHoc}
CREATE NONCLUSTERED INDEX [IX_DiemDanh_MaBuoiHoc]
    ON [dbo].[DiemDanh] ([MaBuoiHoc])
    INCLUDE ([MaSV], [TrangThai], [ThoiGianQuet]);
GO

-- [BuoiHoc] Tìm nhanh buổi học theo lớp và ngày học (Auto-scheduling & QR validation)
CREATE NONCLUSTERED INDEX [IX_BuoiHoc_MaLop_NgayHoc]
    ON [dbo].[BuoiHoc] ([MaLop], [NgayHoc])
    INCLUDE ([TrangThaiBH], [GioBatDau], [GioKetThuc]);
GO

-- [LopHoc] Tìm nhanh lớp theo giảng viên — WHERE trong query khiếu nại
-- Dùng bởi: PhanHoiController -> GetByLecturer (JOIN path: PhanHoi→DiemDanh→BuoiHoc→LopHoc WHERE MaGV)
CREATE NONCLUSTERED INDEX [IX_LopHoc_MaGV]
    ON [dbo].[LopHoc] ([MaGV])
    INCLUDE ([MaLop], [TenLop], [MaMon]);
GO

-- [PhanHoi] Tìm nhanh phản hồi theo bản ghi điểm danh — cột JOIN chính
-- Dùng bởi: PhanHoiController -> Create (kiểm tra trùng) và GetByStudent/GetByLecturer
CREATE NONCLUSTERED INDEX [IX_PhanHoi_MaDiemDanh]
    ON [dbo].[PhanHoi] ([MaDiemDanh])
    INCLUDE ([TrangThai], [ThoiGianGui]);
GO

-- [PhanHoi] Tìm nhanh phản hồi chưa xử lý (TrangThai=0) — query phổ biến nhất
CREATE NONCLUSTERED INDEX [IX_PhanHoi_TrangThai]
    ON [dbo].[PhanHoi] ([TrangThai])
    WHERE [TrangThai] = 0;
GO
