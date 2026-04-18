using System;

namespace DiemDanhLopHoc.Models;

public class PhanHoi
{
    public int MaPhanHoi { get; set; }

    public int MaDiemDanh { get; set; }

    public string NoiDung { get; set; } = null!;

    public string? MinhChung { get; set; }

    public DateTime? ThoiGianGui { get; set; }

    public string? PhanHoiGv { get; set; }

    /// <summary>0: Chờ xử lý | 1: Đã duyệt | 2: Từ chối</summary>
    public int TrangThai { get; set; } = 0;

    // Navigation
    public virtual DiemDanh MaDiemDanhNavigation { get; set; } = null!;
}
