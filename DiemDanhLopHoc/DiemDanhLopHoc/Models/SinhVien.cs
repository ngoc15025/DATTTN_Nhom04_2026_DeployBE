using System;
using System.Collections.Generic;

namespace DiemDanhLopHoc.Models
{
    public partial class SinhVien
    {
        public SinhVien()
        {
            DiemDanhs = new HashSet<DiemDanh>();
            MaLops = new HashSet<LopHoc>();
        }

        public string MaSv { get; set; } = null!;
        public string TaiKhoan { get; set; } = null!;
        public string MatKhau { get; set; } = null!;
        public string HoTen { get; set; } = null!;
        public DateTime? NgaySinh { get; set; }
        public string? Email { get; set; }
        public string? SoDienThoai { get; set; }
        public string? AnhDaiDien { get; set; }

        public virtual ICollection<DiemDanh> DiemDanhs { get; set; }

        public virtual ICollection<LopHoc> MaLops { get; set; }

        public ICollection<ChiTietLopHoc> ChiTietLopHocs { get; set; }
    }
}
