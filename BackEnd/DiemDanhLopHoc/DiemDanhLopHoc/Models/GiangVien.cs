using System;
using System.Collections.Generic;

namespace DiemDanhLopHoc.Models;

public partial class GiangVien
{
    public string MaGv { get; set; } = null!;

    public string TaiKhoan { get; set; } = null!;

    public string MatKhau { get; set; } = null!;

    public string HoLot { get; set; } = null!;

    public string TenGv { get; set; } = null!;

    public string? Email { get; set; }

    public string? SoDienThoai { get; set; }

    public int? TrangThai { get; set; }

    public virtual ICollection<LopHoc> LopHocs { get; set; } = new List<LopHoc>();
}
