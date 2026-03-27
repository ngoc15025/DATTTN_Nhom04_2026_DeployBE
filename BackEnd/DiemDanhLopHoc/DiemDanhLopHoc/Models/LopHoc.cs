using System;
using System.Collections.Generic;

namespace DiemDanhLopHoc.Models
{
    public partial class LopHoc
    {
        public LopHoc()
        {
            BuoiHocs = new HashSet<BuoiHoc>();
            MaSvs = new HashSet<SinhVien>();
        }

        public string MaLop { get; set; } = null!;
        public string TenLop { get; set; } = null!;
        public string? MaMon { get; set; }
        public string? MaGv { get; set; }

        public virtual GiangVien? MaGvNavigation { get; set; }
        public virtual MonHoc? MaMonNavigation { get; set; }
        public virtual ICollection<BuoiHoc> BuoiHocs { get; set; }

        public virtual ICollection<SinhVien> MaSvs { get; set; }

   
    }
}
