namespace DiemDanhLopHoc.DTOs
{
    /// <summary>Sinh viên gửi khiếu nại điểm danh</summary>
    public class TaoPhanHoiDto
    {
        public int MaDiemDanh { get; set; }
        public string NoiDung { get; set; } = null!;
        public string? MinhChung { get; set; } // Base64 image
    }

    /// <summary>Giảng viên duyệt / từ chối khiếu nại</summary>
    public class GiaiQuyetPhanHoiDto
    {
        /// <summary>1 = Duyệt, 2 = Từ chối</summary>
        public int TrangThai { get; set; }
        public string? PhanHoiGv { get; set; }
    }

    /// <summary>DTO trả về danh sách phản hồi (dùng chung cho cả SV và GV)</summary>
    public class PhanHoiDto
    {
        public int MaPhanHoi { get; set; }
        public int MaDiemDanh { get; set; }

        // Thông tin sinh viên
        public string? MaSv { get; set; }
        public string? TenSinhVien { get; set; }

        // Thông tin buổi học
        public string? TenLop { get; set; }
        public string? TenMon { get; set; }
        public DateTime? NgayHoc { get; set; }

        // Trạng thái điểm danh gốc
        public int TrangThaiDiemDanh { get; set; }

        // Nội dung khiếu nại
        public string NoiDung { get; set; } = null!;
        public string? MinhChung { get; set; }
        public DateTime? ThoiGianGui { get; set; }
        public string? PhanHoiGv { get; set; }

        /// <summary>0: Chờ | 1: Duyệt | 2: Từ chối</summary>
        public int TrangThai { get; set; }
    }
}
