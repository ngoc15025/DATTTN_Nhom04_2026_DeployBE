using DiemDanhLopHoc.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DiemDanhLopHoc.Models
{
    [Table("ChiTietLopHoc")]
    public class ChiTietLopHoc
    {
        [Column(TypeName = "varchar(20)")]
        public string MaLop { get; set; }

        [ForeignKey("MaLop")]
        public LopHoc LopHoc { get; set; }

        [Column(TypeName = "varchar(20)")]
        public string MaSv { get; set; }

        [ForeignKey("MaSv")]
        public SinhVien SinhVien { get; set; }
    }
}