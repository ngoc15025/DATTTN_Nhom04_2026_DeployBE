using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            try
            {
                var today = DateTime.Today;

                // 1. Đồ lường các chỉ số cơ bản
                var totalStudents = await _context.SinhViens.CountAsync();
                var totalLecturers = await _context.GiangViens.CountAsync();
                var totalClasses = await _context.LopHocs.CountAsync();

                // 2. Điểm danh trong ngày hôm nay
                var todayAttendanceCount = await _context.DiemDanhs
                    .Where(d => d.ThoiGianQuet.HasValue && d.ThoiGianQuet.Value.Date == today)
                    .CountAsync();

                // 3. Lấy 10 hoạt động gần nhất
                var recentActivities = await _context.DiemDanhs
                    .Include(d => d.MaSvNavigation)
                    .Include(d => d.MaBuoiHocNavigation)
                        .ThenInclude(b => b.MaLopNavigation)
                            .ThenInclude(l => l.MaMonNavigation)
                    .OrderByDescending(d => d.ThoiGianQuet)
                    .Take(10)
                    .Select(d => new RecentActivityDto
                    {
                        StudentName = d.MaSvNavigation.HoLot + " " + d.MaSvNavigation.TenSv,
                        StudentId = d.MaSv,
                        SubjectName = d.MaBuoiHocNavigation.MaLopNavigation.MaMonNavigation.TenMon,
                        ClassId = d.MaBuoiHocNavigation.MaLop,
                        Status = d.TrangThai,
                        Time = d.ThoiGianQuet,
                        Note = d.GhiChu
                    })
                    .ToListAsync();

                var stats = new AdminDashboardStatsDto
                {
                    TotalStudents = totalStudents,
                    TotalLecturers = totalLecturers,
                    TotalClasses = totalClasses,
                    TodayAttendance = todayAttendanceCount,
                    RecentActivities = recentActivities
                };

                return Ok(new { success = true, data = stats });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi lấy thống kê admin: " + ex.Message });
            }
        }
    }
}
