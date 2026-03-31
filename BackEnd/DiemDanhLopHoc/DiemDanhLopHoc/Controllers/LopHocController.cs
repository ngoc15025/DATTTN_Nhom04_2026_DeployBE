using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiemDanhLopHoc.Controllers
{
    // Controller này phụ trách các API quản lý Lớp học theo đúng tài liệu nhóm:
    // - GET /api/lophoc
    // - POST /api/lophoc
    // - POST /api/lophoc/{maLop}/add-student
    // - GET /api/lophoc/{maLop}/students
    // Hiện tại project đang dùng many-to-many implicit giữa LopHoc và SinhVien,
    // nên việc thêm/xem sinh viên của lớp sẽ thao tác qua navigation collection MaSvs.
    [Route("api/lophoc")]
    [ApiController]
    public class LopHocController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LopHocController(AppDbContext context)
        {
            _context = context;
        }

        // DTO trả về danh sách lớp học.
        // Mục tiêu: trả đúng dữ liệu FE cần, gồm mã lớp, tên lớp, mã môn, tên môn, mã GV, tên GV.
        public class LopHocDto
        {
            public string MaLop { get; set; } = null!;
            public string TenLop { get; set; } = null!;
            public string? MaMon { get; set; }
            public string? TenMon { get; set; }
            public string? MaGv { get; set; }
            public string? TenGiangVien { get; set; }
        }

        // DTO nhận dữ liệu khi tạo mới lớp học.
        // Theo tài liệu hiện tại, tạo lớp cần MaLop, TenLop, MaMon, MaGV.
        public class TaoLopHocRequest
        {
            public string MaLop { get; set; } = null!;
            public string TenLop { get; set; } = null!;
            public string? MaMon { get; set; }
            public string? MaGv { get; set; }
        }

        // DTO nhận dữ liệu khi thêm 1 sinh viên vào lớp.
        public class ThemSinhVienRequest
        {
            public string MaSv { get; set; } = null!;
        }

        // DTO trả về danh sách sinh viên thuộc 1 lớp.
        // Chỉ trả dữ liệu cần thiết, không để lộ MatKhau.
        public class SinhVienTrongLopDto
        {
            public string MaSv { get; set; } = null!;
            public string TaiKhoan { get; set; } = null!;
            public string HoTen { get; set; } = null!;
            public DateTime? NgaySinh { get; set; }
            public string? Email { get; set; }
            public string? SoDienThoai { get; set; }
            public string? AnhDaiDien { get; set; }
        }

        // API lấy danh sách lớp học.
        // Dùng Include để lấy luôn dữ liệu môn học và giảng viên theo yêu cầu tài liệu,
        // sau đó Select sang DTO để tránh trả thẳng entity và tránh vòng lặp JSON.
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.LopHocs
                .Include(l => l.MaMonNavigation)
                .Include(l => l.MaGvNavigation)
                .Select(l => new LopHocDto
                {
                    MaLop = l.MaLop,
                    TenLop = l.TenLop,
                    MaMon = l.MaMon,
                    TenMon = l.MaMonNavigation != null ? l.MaMonNavigation.TenMon : null,
                    MaGv = l.MaGv,
                    TenGiangVien = l.MaGvNavigation != null ? l.MaGvNavigation.HoTen : null
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách lớp học thành công.",
                data = danhSach
            });
        }

        // API tạo mới lớp học.
        // Validate các điều kiện cơ bản:
        // - không để trống các trường bắt buộc
        // - không trùng MaLop
        // - MaMon phải tồn tại
        // - MaGv phải tồn tại
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaoLopHocRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.MaLop) ||
                string.IsNullOrWhiteSpace(request.TenLop) ||
                string.IsNullOrWhiteSpace(request.MaMon) ||
                string.IsNullOrWhiteSpace(request.MaGv))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Vui lòng nhập đầy đủ MaLop, TenLop, MaMon và MaGv.",
                    data = (object?)null
                });
            }

            var daTonTai = await _context.LopHocs.AnyAsync(l => l.MaLop == request.MaLop);
            if (daTonTai)
            {
                return Conflict(new
                {
                    success = false,
                    message = "Mã lớp học đã tồn tại trong hệ thống.",
                    data = (object?)null
                });
            }

            var monHocTonTai = await _context.MonHocs.AnyAsync(m => m.MaMon == request.MaMon);
            if (!monHocTonTai)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Mã môn học không tồn tại.",
                    data = (object?)null
                });
            }

            var giangVienTonTai = await _context.GiangViens.AnyAsync(g => g.MaGv == request.MaGv);
            if (!giangVienTonTai)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Mã giảng viên không tồn tại.",
                    data = (object?)null
                });
            }

            var lopHocMoi = new LopHoc
            {
                MaLop = request.MaLop,
                TenLop = request.TenLop,
                MaMon = request.MaMon,
                MaGv = request.MaGv
            };

            _context.LopHocs.Add(lopHocMoi);
            await _context.SaveChangesAsync();

            var ketQua = new LopHocDto
            {
                MaLop = lopHocMoi.MaLop,
                TenLop = lopHocMoi.TenLop,
                MaMon = lopHocMoi.MaMon,
                TenMon = await _context.MonHocs
                    .Where(m => m.MaMon == lopHocMoi.MaMon)
                    .Select(m => m.TenMon)
                    .FirstOrDefaultAsync(),
                MaGv = lopHocMoi.MaGv,
                TenGiangVien = await _context.GiangViens
                    .Where(g => g.MaGv == lopHocMoi.MaGv)
                    .Select(g => g.HoTen)
                    .FirstOrDefaultAsync()
            };

            return StatusCode(StatusCodes.Status201Created, new
            {
                success = true,
                message = "Tạo lớp học thành công.",
                data = ketQua
            });
        }

        // API thêm 1 sinh viên vào lớp học.
        // Vì project đang dùng many-to-many implicit, EF Core sẽ tự thêm bản ghi vào bảng ChiTietLopHoc
        // khi thêm SinhVien vào collection MaSvs của LopHoc.
        [HttpPost("{maLop}/add-student")]
        public async Task<IActionResult> AddStudent(string maLop, [FromBody] ThemSinhVienRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.MaSv))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "MaSv không được để trống.",
                    data = (object?)null
                });
            }

            var lopHoc = await _context.LopHocs
                .Include(l => l.MaSvs)
                .FirstOrDefaultAsync(l => l.MaLop == maLop);

            if (lopHoc == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Không tìm thấy lớp học.",
                    data = (object?)null
                });
            }

            var sinhVien = await _context.SinhViens
                .FirstOrDefaultAsync(s => s.MaSv == request.MaSv);

            if (sinhVien == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Không tìm thấy sinh viên.",
                    data = (object?)null
                });
            }

            var daCoTrongLop = lopHoc.MaSvs.Any(s => s.MaSv == request.MaSv);
            if (daCoTrongLop)
            {
                return Conflict(new
                {
                    success = false,
                    message = "Sinh viên đã có trong lớp học này.",
                    data = (object?)null
                });
            }

            lopHoc.MaSvs.Add(sinhVien);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Thêm sinh viên vào lớp thành công.",
                data = new
                {
                    maLop = lopHoc.MaLop,
                    maSv = sinhVien.MaSv
                }
            });
        }

        // API lấy danh sách sinh viên của một lớp học.
        // Truy vấn qua quan hệ nhiều-nhiều hiện có để lấy đúng danh sách Sinh viên thuộc lớp.
        [HttpGet("{maLop}/students")]
        public async Task<IActionResult> GetStudents(string maLop)
        {
            var lopTonTai = await _context.LopHocs.AnyAsync(l => l.MaLop == maLop);
            if (!lopTonTai)
            {
                return NotFound(new
                {
                    success = false,
                    message = "Không tìm thấy lớp học.",
                    data = (object?)null
                });
            }

            var danhSachSinhVien = await _context.LopHocs
                .Where(l => l.MaLop == maLop)
                .SelectMany(l => l.MaSvs)
                .Select(s => new SinhVienTrongLopDto
                {
                    MaSv = s.MaSv,
                    TaiKhoan = s.TaiKhoan,
                    HoTen = s.HoTen,
                    NgaySinh = s.NgaySinh,
                    Email = s.Email,
                    SoDienThoai = s.SoDienThoai,
                    AnhDaiDien = s.AnhDaiDien
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách sinh viên của lớp thành công.",
                data = danhSachSinhVien
            });
        }
    }
}