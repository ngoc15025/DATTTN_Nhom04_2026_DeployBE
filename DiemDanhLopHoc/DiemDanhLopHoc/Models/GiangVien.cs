using System;
using System.Collections.Generic;

namespace DiemDanhLopHoc.Models
{
    public partial class GiangVien
    {
        public GiangVien()
        {
            LopHocs = new HashSet<LopHoc>();
        }

        public string MaGv { get; set; } = null!;
        public string TaiKhoan { get; set; } = null!;
        public string MatKhau { get; set; } = null!;
        public string HoTen { get; set; } = null!;
        public string? Email { get; set; }
        public string? SoDienThoai { get; set; }
        public bool? TrangThai { get; set; }

        public virtual ICollection<LopHoc> LopHocs { get; set; }
    }
}
