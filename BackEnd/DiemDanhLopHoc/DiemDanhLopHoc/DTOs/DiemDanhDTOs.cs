namespace DiemDanhLopHoc.DTOs
{
    public class DiemDanhDto
    {
        public int MaDiemDanh { get; set; }
        public int MaBuoiHoc { get; set; }
        public string MaSv { get; set; } = null!;
        public int TrangThai { get; set; } 
        // 1: Có mặt, 2: Đi trễ, 3: Vắng có phép, 4: Vắng không phép, 5: Gian lận thiết bị
        public DateTime? ThoiGianQuet { get; set; }
        public string? GhiChu { get; set; }
        public string? TenMon { get; set; }
        public DateOnly? NgayHoc { get; set; }
        public string? MaThietBiLog { get; set; } // Trả về chữ ký số để FE nhận biết máy chính chủ
    }

    public class SubmitDiemDanhDto
    {
        public int MaBuoiHoc { get; set; }
        public string MaSv { get; set; } = null!;
        public double? Lat { get; set; }
        public double? Long { get; set; }
        // Chữ ký số ECDSA (thay thế DeviceToken cũ)
        public string? RawPayload { get; set; }   // Payload gốc FE đã ký
        public string? Signature { get; set; }    // Chữ ký Base64 (ECDSA P-256)
    }
}
