using System;
using System.Collections.Generic;

namespace DiemDanhLopHoc.Models;

public partial class LopHoc
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

    public virtual ICollection<BuoiHoc> BuoiHocs { get; set; } = new List<BuoiHoc>();

    public virtual GiangVien MaGvNavigation { get; set; } = null!;

    public virtual MonHoc MaMonNavigation { get; set; } = null!;

    public virtual ICollection<SinhVien> MaSvs { get; set; } = new List<SinhVien>();
}
