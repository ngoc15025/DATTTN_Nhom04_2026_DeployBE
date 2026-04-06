using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using DiemDanhLopHoc.DTOs;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BuoiHocController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BuoiHocController(AppDbContext context)
        {
            _context = context;
        }

        // 0. Lấy chi tiết buổi học
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var buoiHoc = await _context.BuoiHocs
                .Include(b => b.MaLopNavigation)
                .FirstOrDefaultAsync(b => b.MaBuoiHoc == id);
            
            if (buoiHoc == null) return NotFound();

            return Ok(new {
                maBuoiHoc = buoiHoc.MaBuoiHoc,
                maLop = buoiHoc.MaLop,
                tenLop = buoiHoc.MaLopNavigation.TenLop,
                ngayHoc = buoiHoc.NgayHoc,
                gioBatDau = buoiHoc.GioBatDau,
                gioKetThuc = buoiHoc.GioKetThuc,
                ghiChu = buoiHoc.GhiChu
            });
        }

        // 1. Lấy danh sách buổi học của một lớp
        [HttpGet("class/{maLop}")]
        public async Task<IActionResult> GetByClassId(string maLop)
        {
            var danhSach = await _context.BuoiHocs
                .Where(b => b.MaLop == maLop)
                .OrderBy(b => b.NgayHoc)
                .Select(b => new BuoiHocDto
                {
                    MaBuoiHoc = b.MaBuoiHoc,
                    MaLop = b.MaLop,
                    NgayHoc = b.NgayHoc,
                    GioBatDau = b.GioBatDau,
                    GioKetThuc = b.GioKetThuc,
                    LoaiBuoiHoc = b.LoaiBuoiHoc,
                    TrangThaiBh = b.TrangThaiBh,
                    GhiChu = b.GhiChu
                })
                .ToListAsync();

            return Ok(danhSach);
        }

        // 2. Thêm buổi học mới (Học bù, bổ sung)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaoBuoiHocDto request)
        {
            var buoiHocMoi = new BuoiHoc
            {
                MaLop = request.MaLop,
                NgayHoc = request.NgayHoc,
                GioBatDau = request.GioBatDau,
                GioKetThuc = request.GioKetThuc,
                GhiChu = request.GhiChu,
                LoaiBuoiHoc = 1, // 1: Học bù / Bổ sung
                TrangThaiBh = 0  // 0: Chưa điểm danh
            };

            _context.BuoiHocs.Add(buoiHocMoi);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Thêm buổi học thành công!", data = buoiHocMoi });
        }

        // 3. Xóa buổi học
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var buoiHoc = await _context.BuoiHocs.FindAsync(id);
            if (buoiHoc == null) return NotFound(new { message = "Không tìm thấy buổi học." });

            _context.BuoiHocs.Remove(buoiHoc);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đã xóa buổi học!" });
        }
    }
}
