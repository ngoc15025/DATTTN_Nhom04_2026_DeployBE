namespace DiemDanhLopHoc.DTOs
{
  
    public class TaoLopHocDto
    {
        public string MaLop { get; set; } = null!;
        public string TenLop { get; set; } = null!;
        public string MaMon { get; set; } = null!;
        public string MaGv { get; set; } = null!;
        public DateOnly NgayBatDau { get; set; }
        public DateOnly NgayKetThuc { get; set; }
        public TimeOnly GioBatDau { get; set; }
        public TimeOnly GioKetThuc { get; set; }
        public int SoBuoiHoc { get; set; }
    }


    // DTO trả về danh sách lớp học.
    // Mục tiêu: trả đúng dữ liệu FE cần, gồm mã lớp, tên lớp, mã môn, tên môn, mã GV, tên GV.
    public class LopHocDto
    {
        public string MaLop { get; set; } = null!;
        public string TenLop { get; set; } = null!;
        public string? MaMon { get; set; }
        public string? TenMon { get; set; }
        public string? MaGv { get; set; }
        public string? TenGiangVien { get; set; }
    }

    // DTO nhận dữ liệu khi tạo mới lớp học.
    // Theo tài liệu hiện tại, tạo lớp cần MaLop, TenLop, MaMon, MaGV.
    public class TaoLopHocRequest
    {
        public string MaLop { get; set; } = null!;
        public string TenLop { get; set; } = null!;
        public string? MaMon { get; set; }
        public string? MaGv { get; set; }
    }

    // DTO nhận dữ liệu khi thêm 1 sinh viên vào lớp.
    public class ThemSinhVienRequest
    {
        public string MaSv { get; set; } = null!;
    }
}
