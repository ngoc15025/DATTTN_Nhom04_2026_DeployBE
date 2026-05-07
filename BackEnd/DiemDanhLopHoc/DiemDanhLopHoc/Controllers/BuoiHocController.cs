using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using DiemDanhLopHoc.DTOs;
using DiemDanhLopHoc.Utils;
using Microsoft.AspNetCore.Authorization;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Lecturer")]
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
                trangThaiBh = buoiHoc.TrangThaiBh, // 0: Chưa điểm danh, 1: Đang mở QR, 2: Đã chốt sổ
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

        // 3. L\u1ea5y danh s\u00e1ch bu\u1ed5i h\u1ecdc h\u00f4m nay c\u1ee7a m\u1ed9t gi\u1ea3ng vi\u00ean
        [HttpGet("today/{maGv}")]
        public async Task<IActionResult> GetTodayByLecturer(string maGv)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);

            var danhSach = await _context.BuoiHocs
                .Include(b => b.MaLopNavigation)
                    .ThenInclude(l => l.MaMonNavigation)
                .Include(b => b.MaLopNavigation.MaGvNavigation)
                .Where(b => b.NgayHoc == today && b.MaLopNavigation.MaGv == maGv)
                .OrderBy(b => b.GioBatDau)
                .Select(b => new
                {
                    maBuoiHoc = b.MaBuoiHoc,
                    maLop = b.MaLop,
                    tenLop = b.MaLopNavigation.TenLop,
                    tenMon = b.MaLopNavigation.MaMonNavigation != null ? b.MaLopNavigation.MaMonNavigation.TenMon : "N/A",
                    ngayHoc = b.NgayHoc,
                    gioBatDau = b.GioBatDau,
                    gioKetThuc = b.GioKetThuc,
                    trangThaiBh = b.TrangThaiBh, // 0: Ch\u01b0a \u0111i\u1ec3m danh, 1: \u0110\u00e3 \u0111i\u1ec3m danh
                    loaiBuoiHoc = b.LoaiBuoiHoc,
                    ghiChu = b.GhiChu
                })
                .ToListAsync();

            return Ok(new { success = true, data = danhSach });
        }

        // 4. Cập nhật trạng thái buổi học (Mở QR, Chốt sổ)
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusDto request)
        {
            var buoiHoc = await _context.BuoiHocs.FindAsync(id);
            if (buoiHoc == null) return NotFound(new { message = "Không tìm thấy buổi học." });

            buoiHoc.TrangThaiBh = request.TrangThaiBh;
            
            // Nếu Mở QR, lưu Tọa độ Gốc của phòng học để xác thực Sinh viên
            if (request.TrangThaiBh == 1 && request.Lat.HasValue && request.Long.HasValue)
            {
                buoiHoc.ToaDoGocLat = request.Lat;
                buoiHoc.ToaDoGocLong = request.Long;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đã cập nhật trạng thái buổi học!" });
        }

        // 5. Báo nghỉ (Cập nhật LoaiBuoiHoc = 2)
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> ReportAbsence(int id)
        {
            var buoiHoc = await _context.BuoiHocs.FindAsync(id);
            if (buoiHoc == null) return NotFound(new { message = "Không tìm thấy buổi học." });

            buoiHoc.LoaiBuoiHoc = 2; // 2: Báo nghỉ
            buoiHoc.TrangThaiBh = 0; // Đưa về trạng thái chưa điểm danh
            
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Đã cập nhật trạng thái báo nghỉ cho buổi học này!" });
        }

        // 6. Xóa buổi học
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var buoiHoc = await _context.BuoiHocs.FindAsync(id);
            if (buoiHoc == null) return NotFound(new { message = "Không tìm thấy buổi học." });

            _context.BuoiHocs.Remove(buoiHoc);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đã xóa buổi học!" });
        }

        // 7. Lấy QR Token Động (Cập nhật sau mỗi 30s)
        [HttpGet("{id}/qr-token")]
        public IActionResult GetQrToken(int id)
        {
            // Kiểm tra nếu là buổi báo nghỉ thì không cho lấy Token
            var buoiHoc = _context.BuoiHocs.Find(id);
            if (buoiHoc != null && buoiHoc.LoaiBuoiHoc == 2)
            {
                return BadRequest(new { success = false, message = "Buổi học này đã báo nghỉ, không thể lấy mã QR." });
            }

            var token = QrUtils.GenerateQrToken(id);
            return Ok(new { success = true, token = token });
        }
    }
}
