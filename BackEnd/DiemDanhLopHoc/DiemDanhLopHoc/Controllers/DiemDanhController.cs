using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using DiemDanhLopHoc.DTOs;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiemDanhController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DiemDanhController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Lấy thống kê và lịch sử điểm danh của sinh viên
        [HttpGet("student/{maSv}")]
        public async Task<IActionResult> GetStudentAttendance(string maSv)
        {
            var history = await _context.DiemDanhs
                .Where(d => d.MaSv == maSv)
                .Include(d => d.MaBuoiHocNavigation)
                    .ThenInclude(b => b.MaLopNavigation)
                        .ThenInclude(l => l.MaMonNavigation)
                .OrderByDescending(d => d.ThoiGianQuet)
                .Select(d => new DiemDanhDto
                {
                    MaDiemDanh = d.MaDiemDanh,
                    MaBuoiHoc = d.MaBuoiHoc,
                    MaSv = d.MaSv,
                    TrangThai = d.TrangThai,
                    ThoiGianQuet = d.ThoiGianQuet,
                    GhiChu = d.GhiChu,
                    TenMon = d.MaBuoiHocNavigation.MaLopNavigation.MaMonNavigation.TenMon,
                    NgayHoc = d.MaBuoiHocNavigation.NgayHoc
                })
                .ToListAsync();

            return Ok(history);
        }

        // 2. Chấm điểm danh (Dùng cho QR quét từ SV hoặc Giảng viên tích tay)
        [HttpPost("submit")]
        public async Task<IActionResult> Submit([FromBody] SubmitDiemDanhDto request)
        {
            // Kiểm tra xem đã điểm danh buổi này chưa
            var tonTai = await _context.DiemDanhs
                .AnyAsync(d => d.MaBuoiHoc == request.MaBuoiHoc && d.MaSv == request.MaSv);
            if (tonTai) return BadRequest(new { message = "Bạn đã điểm danh buổi học này rồi!" });

            var buoiHoc = await _context.BuoiHocs.FindAsync(request.MaBuoiHoc);
            if (buoiHoc == null) return NotFound(new { message = "Không tìm thấy buổi học." });

            var ketQua = new DiemDanh
            {
                MaBuoiHoc = request.MaBuoiHoc,
                MaSv = request.MaSv,
                TrangThai = 1, // Mặc định: Có mặt
                ThoiGianQuet = DateTime.Now,
                ToaDoSvLat = request.Lat,
                ToaDoSvLong = request.Long,
                MaThietBiLog = request.DeviceToken
            };

            _context.DiemDanhs.Add(ketQua);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Điểm danh thành công!" });
        }

        // 3. Lấy danh sách điểm danh của một buổi học (Dùng cho giảng viên xem sổ tay)
        [HttpGet("session/{maBuoiHoc}")]
        public async Task<IActionResult> GetSessionAttendance(int maBuoiHoc)
        {
            var data = await _context.DiemDanhs
                .Where(d => d.MaBuoiHoc == maBuoiHoc)
                .ToListAsync();
            return Ok(data);
        }

        // 4. Lưu/Cập nhật hàng loạt (Giảng viên chốt sổ tay)
        [HttpPost("bulk-update")]
        public async Task<IActionResult> BulkUpdate([FromBody] List<DiemDanhDto> requests)
        {
            foreach (var req in requests)
            {
                var record = await _context.DiemDanhs
                    .FirstOrDefaultAsync(d => d.MaBuoiHoc == req.MaBuoiHoc && d.MaSv == req.MaSv);

                if (record != null)
                {
                    record.TrangThai = req.TrangThai;
                    record.GhiChu = req.GhiChu;
                }
                else
                {
                    _context.DiemDanhs.Add(new DiemDanh
                    {
                        MaBuoiHoc = req.MaBuoiHoc,
                        MaSv = req.MaSv,
                        TrangThai = req.TrangThai,
                        GhiChu = req.GhiChu,
                        ThoiGianQuet = DateTime.Now
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Đã lưu bảng điểm danh!" });
        }

        // 5. Thống kê cho Giảng viên
        [HttpGet("lecturer-stats/{maGv}")]
        public async Task<IActionResult> GetLecturerStats(string maGv)
        {
            // Lấy danh sách lớp của GV
            var lopIds = await _context.LopHocs
                .Where(l => l.MaGv == maGv)
                .Select(l => l.MaLop)
                .ToListAsync();

            // Đếm SV unique
            var totalStudents = await _context.LopHocs
                .Where(l => l.MaGv == maGv)
                .SelectMany(l => l.MaSvs)
                .Select(s => s.MaSv)
                .Distinct()
                .CountAsync();

            // Tính tỷ lệ chuyên cần trung bình
            var attendances = await _context.DiemDanhs
                .Where(d => lopIds.Contains(d.MaBuoiHocNavigation.MaLop))
                .ToListAsync();

            var coMatCount = attendances.Count(a => a.TrangThai == 1);
            var totalCount = attendances.Count;
            var avgAttendance = totalCount == 0 ? 0 : (int)Math.Round((double)coMatCount * 100 / totalCount);

            // Cảnh báo SV vắng >= 3
            var warningCount = attendances
                .Where(a => a.TrangThai >= 2) // Trễ hoặc vắng
                .GroupBy(a => a.MaSv)
                .Count(g => g.Count() >= 3);

            return Ok(new
            {
                totalStudents,
                avgAttendance,
                warningStudents = warningCount
            });
        }
    }
}
