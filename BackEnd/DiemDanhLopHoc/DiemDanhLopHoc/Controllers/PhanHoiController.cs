using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.DTOs;
using DiemDanhLopHoc.Models;
using DiemDanhLopHoc.Utils;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/phanhoi")]
    [ApiController]
    public class PhanHoiController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PhanHoiController(AppDbContext context)
        {
            _context = context;
        }

        // POST /api/phanhoi - Sinh viên gửi khiếu nại
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaoPhanHoiDto request)
        {
            if (string.IsNullOrWhiteSpace(request.NoiDung))
                return BadRequest(new { success = false, message = "Nội dung khiếu nại không được để trống." });

            var diemDanh = await _context.DiemDanhs.FindAsync(request.MaDiemDanh);
            if (diemDanh == null)
                return NotFound(new { success = false, message = "Không tìm thấy bản ghi điểm danh." });

            // Kiểm tra đã gửi phản hồi chưa (tránh spam)
            var daCo = await _context.PhanHois
                .AnyAsync(p => p.MaDiemDanh == request.MaDiemDanh && p.TrangThai == 0);
            if (daCo)
                return Conflict(new { success = false, message = "Bạn đã gửi một khiếu nại đang chờ xử lý cho buổi học này." });

            var phanHoi = new PhanHoi
            {
                MaDiemDanh = request.MaDiemDanh,
                NoiDung = request.NoiDung,
                MinhChung = request.MinhChung,
                ThoiGianGui = TimeUtils.GetVietnamTime(),
                TrangThai = 0
            };

            _context.PhanHois.Add(phanHoi);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { success = true, message = "Đã gửi khiếu nại thành công. Giảng viên sẽ xem xét sớm nhất có thể." });
        }

        // GET /api/phanhoi/student/{maSv} - Sinh viên xem lịch sử khiếu nại của mình
        [HttpGet("student/{maSv}")]
        public async Task<IActionResult> GetByStudent(string maSv)
        {
            var danhSach = await _context.PhanHois
                .Include(p => p.MaDiemDanhNavigation)
                    .ThenInclude(d => d.MaBuoiHocNavigation)
                        .ThenInclude(b => b.MaLopNavigation)
                            .ThenInclude(l => l.MaMonNavigation)
                .Where(p => p.MaDiemDanhNavigation.MaSv == maSv)
                .OrderByDescending(p => p.ThoiGianGui)
                .Select(p => new PhanHoiDto
                {
                    MaPhanHoi = p.MaPhanHoi,
                    MaDiemDanh = p.MaDiemDanh,
                    MaSv = p.MaDiemDanhNavigation.MaSv,
                    TenLop = p.MaDiemDanhNavigation.MaBuoiHocNavigation.MaLopNavigation.TenLop,
                    TenMon = p.MaDiemDanhNavigation.MaBuoiHocNavigation.MaLopNavigation.MaMonNavigation != null
                        ? p.MaDiemDanhNavigation.MaBuoiHocNavigation.MaLopNavigation.MaMonNavigation.TenMon : null,
                    NgayHoc = p.MaDiemDanhNavigation.MaBuoiHocNavigation.NgayHoc.ToDateTime(TimeOnly.MinValue),
                    TrangThaiDiemDanh = p.MaDiemDanhNavigation.TrangThai,
                    NoiDung = p.NoiDung,
                    MinhChung = p.MinhChung,
                    ThoiGianGui = p.ThoiGianGui,
                    PhanHoiGv = p.PhanHoiGv,
                    TrangThai = p.TrangThai
                })
                .ToListAsync();

            return Ok(new { success = true, data = danhSach });
        }

        // GET /api/phanhoi/lecturer/{maGv} - Giang vien xem tat ca khieu nai cua lop minh phu trach
        [HttpGet("lecturer/{maGv}")]
        public async Task<IActionResult> GetByLecturer(string maGv)
        {
            // Dung LINQ join thay vi Include 4 tang — SQL gon hon, khong load du lieu thua
            var danhSach = await (
                from ph in _context.PhanHois
                join dd in _context.DiemDanhs on ph.MaDiemDanh equals dd.MaDiemDanh
                join bh in _context.BuoiHocs on dd.MaBuoiHoc equals bh.MaBuoiHoc
                join lh in _context.LopHocs on bh.MaLop equals lh.MaLop
                join sv in _context.SinhViens on dd.MaSv equals sv.MaSv into svJoin
                from sv in svJoin.DefaultIfEmpty()
                join mh in _context.MonHocs on lh.MaMon equals mh.MaMon into mhJoin
                from mh in mhJoin.DefaultIfEmpty()
                where lh.MaGv == maGv
                orderby ph.ThoiGianGui descending
                select new PhanHoiDto
                {
                    MaPhanHoi         = ph.MaPhanHoi,
                    MaDiemDanh        = ph.MaDiemDanh,
                    MaSv              = dd.MaSv,
                    TenSinhVien       = sv != null ? sv.HoLot + " " + sv.TenSv : null,
                    TenLop            = lh.TenLop,
                    TenMon            = mh != null ? mh.TenMon : null,
                    NgayHoc           = bh.NgayHoc.ToDateTime(TimeOnly.MinValue),
                    TrangThaiDiemDanh = dd.TrangThai,
                    NoiDung           = ph.NoiDung,
                    MinhChung         = ph.MinhChung,
                    ThoiGianGui       = ph.ThoiGianGui,
                    PhanHoiGv         = ph.PhanHoiGv,
                    TrangThai         = ph.TrangThai
                }
            ).ToListAsync();

            return Ok(new { success = true, data = danhSach });
        }

        // PUT /api/phanhoi/{id}/resolve - Giảng viên duyệt hoặc từ chối
        [HttpPut("{id}/resolve")]
        public async Task<IActionResult> Resolve(int id, [FromBody] GiaiQuyetPhanHoiDto request)
        {
            if (request.TrangThai != 1 && request.TrangThai != 2)
                return BadRequest(new { success = false, message = "Trạng thái không hợp lệ. (1 = Duyệt, 2 = Từ chối)" });

            var phanHoi = await _context.PhanHois
                .Include(p => p.MaDiemDanhNavigation)
                .FirstOrDefaultAsync(p => p.MaPhanHoi == id);

            if (phanHoi == null)
                return NotFound(new { success = false, message = "Không tìm thấy phản hồi." });

            if (phanHoi.TrangThai != 0)
                return Conflict(new { success = false, message = "Phản hồi này đã được xử lý rồi." });

            phanHoi.TrangThai = request.TrangThai;
            phanHoi.PhanHoiGv = request.PhanHoiGv;

            // Nếu được duyệt -> tự động cập nhật trạng thái điểm danh sang "Có mặt" (1)
            if (request.TrangThai == 1)
            {
                phanHoi.MaDiemDanhNavigation.TrangThai = 1;
                phanHoi.MaDiemDanhNavigation.GhiChu = "Đã được giảng viên xác nhận qua khiếu nại.";
                phanHoi.MaDiemDanhNavigation.NguoiCapNhat = "SYSTEM_APPEAL";
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = request.TrangThai == 1
                    ? "Đã duyệt khiếu nại và cập nhật trạng thái điểm danh sang Có mặt."
                    : "Đã từ chối khiếu nại."
            });
        }
    }
}
