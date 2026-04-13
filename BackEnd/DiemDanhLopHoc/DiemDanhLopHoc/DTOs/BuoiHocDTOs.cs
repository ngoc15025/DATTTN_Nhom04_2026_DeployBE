namespace DiemDanhLopHoc.DTOs
{
    public class BuoiHocDto
    {
        public int MaBuoiHoc { get; set; }
        public string MaLop { get; set; } = null!;
        public DateOnly NgayHoc { get; set; }
        public TimeOnly GioBatDau { get; set; }
        public TimeOnly GioKetThuc { get; set; }
        public int? LoaiBuoiHoc { get; set; }
        public int? TrangThaiBh { get; set; }
        public string? GhiChu { get; set; }
    }

    public class TaoBuoiHocDto
    {
        public string MaLop { get; set; } = null!;
        public DateOnly NgayHoc { get; set; }
        public TimeOnly GioBatDau { get; set; }
        public TimeOnly GioKetThuc { get; set; }
        public string? GhiChu { get; set; }
    }

    public class UpdateStatusDto
    {
        public int TrangThaiBh { get; set; } // 0: CĐD, 1: Mở QR, 2: Chốt sổ
        public double? Lat { get; set; }
        public double? Long { get; set; }
    }
}
