using System;
using System.Collections.Generic;

namespace DiemDanhLopHoc.Models;

public partial class BuoiHoc
{
    public int MaBuoiHoc { get; set; }

    public string MaLop { get; set; } = null!;

    public DateOnly NgayHoc { get; set; }

    public TimeOnly GioBatDau { get; set; }

    public TimeOnly GioKetThuc { get; set; }

    public int? LoaiBuoiHoc { get; set; }

    public int? TrangThaiBh { get; set; }

    public string? GhiChu { get; set; }

    public double? ToaDoGocLat { get; set; }

    public double? ToaDoGocLong { get; set; }

    public virtual ICollection<DiemDanh> DiemDanhs { get; set; } = new List<DiemDanh>();

    public virtual LopHoc MaLopNavigation { get; set; } = null!;
}
