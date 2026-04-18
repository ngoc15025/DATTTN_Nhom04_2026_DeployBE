using System;
using System.Collections.Generic;

namespace DiemDanhLopHoc.Models;

public partial class DiemDanh
{
    public int MaDiemDanh { get; set; }

    public int MaBuoiHoc { get; set; }

    public string MaSv { get; set; } = null!;

    public int TrangThai { get; set; }

    public DateTime? ThoiGianQuet { get; set; }

    public string? GhiChu { get; set; }

    public string? NguoiCapNhat { get; set; }

    public string? MaThietBiLog { get; set; }

    public double? ToaDoSvLat { get; set; }

    public double? ToaDoSvLong { get; set; }

    public virtual BuoiHoc MaBuoiHocNavigation { get; set; } = null!;

    public virtual SinhVien MaSvNavigation { get; set; } = null!;

    public virtual ICollection<PhanHoi> PhanHois { get; set; } = new List<PhanHoi>();
}
