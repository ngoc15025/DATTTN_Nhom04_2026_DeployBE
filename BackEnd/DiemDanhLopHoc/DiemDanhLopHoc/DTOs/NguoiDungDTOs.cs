namespace DiemDanhLopHoc.DTOs
{
    // DTO để trả về danh sách Giảng Viên (Giấu cột MatKhau)
    public class GiangVienResponseDto
    {
        public string MaGv { get; set; } = null!;
        public string TaiKhoan { get; set; } = null!;
        public string TenGv { get; set; } = null!;
        public string HoLot { get; set; } = null!;
        public string? Email { get; set; }
        public string? SoDienThoai { get; set; }
        public int? TrangThai { get; set; }
    }

    // DTO để trả về danh sách Sinh Viên (Giấu cột MatKhau)
    public class SinhVienResponseDto
    {
        public string MaSv { get; set; } = null!;
        public string TaiKhoan { get; set; } = null!;
        public string HoLot { get; set; } = null!;
        public string TenSv { get; set; } = null!;
        public string Lop { get; set; } = null!;
        public string? Email { get; set; }
        public string? MaThietBi { get; set; }
        public string? SoDienThoai { get; set; }
        public string? AnhDaiDien { get; set; }
    }

    public class TaoGiangVienDto
    {
        public string MaGv { get; set; } = null!;
        public string TaiKhoan { get; set; } = null!;
        public string MatKhau { get; set; } = null!;
        public string HoLot { get; set; } = null!;
        public string TenGv { get; set; } = null!;
    }

    // DTO trả về danh sách sinh viên thuộc 1 lớp.
    // Chỉ trả dữ liệu cần thiết, không để lộ MatKhau.
    public class SinhVienTrongLopDto
    {
        public string MaSv { get; set; } = null!;
        public string TaiKhoan { get; set; } = null!;
        public string HoTen { get; set; } = null!;
        public DateTime? NgaySinh { get; set; }
        public string? Email { get; set; }
        public string? SoDienThoai { get; set; }
        public string? AnhDaiDien { get; set; }
    }

    // DTO dùng để trả dữ liệu (Đã bổ sung Lop và MaThietBi, bỏ NgaySinh)
    public class SinhVienDto
    {
        public string MaSv { get; set; } = null!;
        public string TaiKhoan { get; set; } = null!;
        public string HoTen { get; set; } = null!; // Trả về FE chuỗi đã ghép
        public string Lop { get; set; } = null!;
        public string? Email { get; set; }
        public string? SoDienThoai { get; set; }
        public string? AnhDaiDien { get; set; }
        public string? MaThietBi { get; set; }
    }

    // DTO tạo mới (Tách HoLot, TenSv và thêm Lop bắt buộc)
    public class TaoSinhVienDto
    {
        public string MaSv { get; set; } = null!;
        public string TaiKhoan { get; set; } = null!;
        public string MatKhau { get; set; } = null!;
        public string HoLot { get; set; } = null!;
        public string TenSv { get; set; } = null!;
        public string Lop { get; set; } = null!;
    }

    // DTO cập nhật (Tách HoLot, TenSv)
    public class CapNhatSinhVienDto
    {
        public string HoLot { get; set; } = null!;
        public string TenSv { get; set; } = null!;
        public string Lop { get; set; } = null!;
        public string? Email { get; set; }
        public string? SoDienThoai { get; set; }
    }
}