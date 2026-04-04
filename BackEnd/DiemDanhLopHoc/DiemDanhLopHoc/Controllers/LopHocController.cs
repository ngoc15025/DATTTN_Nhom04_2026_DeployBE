using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.DTOs;
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
                  // Đã fix: Ghép HoLot và TenGv
                  TenGiangVien = l.MaGvNavigation != null ? (l.MaGvNavigation.HoLot + " " + l.MaGvNavigation.TenGv) : null
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
        public async Task<IActionResult> Create([FromBody] TaoLopHocDto request) // Dùng DTO thay vì LopHoc
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Chuyển đổi dữ liệu từ DTO sang Model gốc
                var lopHocMoi = new LopHoc
                {
                    MaLop = request.MaLop,
                    TenLop = request.TenLop,
                    MaMon = request.MaMon,
                    MaGv = request.MaGv,
                    NgayBatDau = request.NgayBatDau,
                    NgayKetThuc = request.NgayKetThuc,
                    GioBatDau = request.GioBatDau,
                    GioKetThuc = request.GioKetThuc,
                    SoBuoiHoc = request.SoBuoiHoc
                };

                _context.LopHocs.Add(lopHocMoi);

                // 2. Thuật toán tự đẻ Buổi học (Auto-Scheduling)
                for (int i = 0; i < request.SoBuoiHoc; i++)
                {
                    var buoiHocMoi = new BuoiHoc
                    {
                        MaLop = request.MaLop,
                        NgayHoc = request.NgayBatDau.AddDays(i * 7),
                        GioBatDau = request.GioBatDau,
                        GioKetThuc = request.GioKetThuc,
                        LoaiBuoiHoc = 0,
                        TrangThaiBh = 0
                    };
                    _context.BuoiHocs.Add(buoiHocMoi);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { success = true, message = $"Đã tạo lớp và tự động lập lịch {request.SoBuoiHoc} buổi học!" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { success = false, message = ex.Message });
            }
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
                    HoTen = s.HoLot + " " + s.TenSv,
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