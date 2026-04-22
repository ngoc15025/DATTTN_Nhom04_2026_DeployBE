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
        public async Task<IActionResult> GetAll([FromQuery] string? maGv)
        {
            var query = _context.LopHocs.AsQueryable();

            if (!string.IsNullOrEmpty(maGv))
            {
                query = query.Where(l => l.MaGv == maGv);
            }

            var danhSach = await query
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
                    SoBuoiHoc = request.SoBuoiHoc,
                    BuoiHocs = new List<BuoiHoc>()
                };

                // 2. Thuật toán tự đẻ Buổi học thông qua Navigation Property 
                // Cách này đảm bảo EF Core chèn LopHoc TRƯỚC, BuoiHoc SAU, tránh lỗi Foreign Key
                for (int i = 0; i < request.SoBuoiHoc; i++)
                {
                    var buoiHocMoi = new BuoiHoc
                    {
                        NgayHoc = request.NgayBatDau.AddDays(i * 7),
                        GioBatDau = request.GioBatDau,
                        GioKetThuc = request.GioKetThuc,
                        LoaiBuoiHoc = 0,
                        TrangThaiBh = 0
                    };
                    lopHocMoi.BuoiHocs.Add(buoiHocMoi);
                }

                _context.LopHocs.Add(lopHocMoi);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = $"Đã tạo lớp và tự động lập lịch {request.SoBuoiHoc} buổi học!" });
            }
            catch (Exception ex)
            {
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
                    AnhDaiDien = s.AnhDaiDien,
                    HasPasskey = s.PasskeyCredentialId != null
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách sinh viên của lớp thành công.",
                data = danhSachSinhVien
            });
        }

        [HttpPost("{maLop}/add-new-student")]
        public async Task<IActionResult> AddNewStudent(string maLop, [FromBody] TaoSinhVienDto request)
        {
            var lopHoc = await _context.LopHocs
                .Include(l => l.MaSvs)
                .FirstOrDefaultAsync(l => l.MaLop == maLop);

            if (lopHoc == null) return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

            var isAlreadyInSameSubject = await _context.LopHocs
                .AnyAsync(l => l.MaMon == lopHoc.MaMon && l.MaLop != lopHoc.MaLop && l.MaSvs.Any(s => s.MaSv == request.MaSv));
            
            if (isAlreadyInSameSubject)
            {
                return Conflict(new { success = false, message = $"Sinh viên {request.MaSv} đã tham gia một ca học khác của môn học này." });
            }

            var sinhVien = await _context.SinhViens.FirstOrDefaultAsync(s => s.MaSv == request.MaSv);
            
            // Nếu chưa có sinh viên trên hệ thống, tiến hành tạo mới
            if (sinhVien == null)
            {
                if (await _context.SinhViens.AnyAsync(sv => sv.TaiKhoan == request.TaiKhoan))
                    return Conflict(new { success = false, message = "Tài khoản đã tồn tại." });

                sinhVien = new SinhVien
                {
                    MaSv = request.MaSv,
                    TaiKhoan = request.TaiKhoan,
                    MatKhau = request.MatKhau,
                    HoLot = request.HoLot,
                    TenSv = request.TenSv,
                    Lop = request.Lop,
                    Email = request.Email,
                    SoDienThoai = request.SoDienThoai
                };
                _context.SinhViens.Add(sinhVien);
            }

            var daCoTrongLop = lopHoc.MaSvs.Any(s => s.MaSv == request.MaSv);
            if (!daCoTrongLop)
            {
                lopHoc.MaSvs.Add(sinhVien);
            }

            await _context.SaveChangesAsync();

            return StatusCode(StatusCodes.Status201Created, new
            {
                success = true,
                message = daCoTrongLop ? "Sinh viên đã có trong lớp (không thêm trùng)." : "Thêm sinh viên vào lớp thành công."
            });
        }

        [HttpPost("{maLop}/import-students")]
        public async Task<IActionResult> ImportStudents(string maLop, [FromBody] List<TaoSinhVienDto> requests)
        {
            var lopHoc = await _context.LopHocs
                .Include(l => l.MaSvs)
                .FirstOrDefaultAsync(l => l.MaLop == maLop);

            if (lopHoc == null) return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

            int addedToClassCount = 0;
            int newStudentCount = 0;
            
            // Xử lý từng sinh viên
            foreach (var req in requests)
            {
                var isAlreadyInSameSubject = await _context.LopHocs
                    .AnyAsync(l => l.MaMon == lopHoc.MaMon && l.MaLop != lopHoc.MaLop && l.MaSvs.Any(s => s.MaSv == req.MaSv));
                
                if (isAlreadyInSameSubject) 
                {
                     continue; // Bỏ qua nếu đã học lớp khác cùng môn
                }

                var sinhVien = await _context.SinhViens.FirstOrDefaultAsync(s => s.MaSv == req.MaSv);
                
                if (sinhVien == null)
                {
                    // Check duplicate TaiKhoan avoiding crash
                    if (!await _context.SinhViens.AnyAsync(sv => sv.TaiKhoan == req.TaiKhoan))
                    {
                        sinhVien = new SinhVien
                        {
                            MaSv = req.MaSv,
                            TaiKhoan = req.TaiKhoan,
                            MatKhau = req.MatKhau,
                            HoLot = req.HoLot,
                            TenSv = req.TenSv,
                            Lop = req.Lop,
                            Email = req.Email,
                            SoDienThoai = req.SoDienThoai
                        };
                        _context.SinhViens.Add(sinhVien);
                        newStudentCount++;
                    }
                    else
                    {
                       continue; // Bỏ qua nếu tài khoản bị trùng (có thể log lại)
                    }
                }

                // Nếu sinh viên hợp lệ (cũ hoặc mới tạo), gán vào lớp
                if (sinhVien != null && !lopHoc.MaSvs.Any(s => s.MaSv == req.MaSv))
                {
                    lopHoc.MaSvs.Add(sinhVien);
                    addedToClassCount++;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new 
            { 
                success = true, 
                message = $"Đã thêm thành công {addedToClassCount} sinh viên vào lớp. (Tạo mới: {newStudentCount})" 
            });
        }
        [HttpDelete("{maLop}/remove-student/{maSv}")]
        public async Task<IActionResult> RemoveStudent(string maLop, string maSv)
        {
            var lopHoc = await _context.LopHocs
                .Include(l => l.MaSvs)
                .Include(l => l.BuoiHocs)
                .FirstOrDefaultAsync(l => l.MaLop == maLop);

            if (lopHoc == null) return NotFound(new { success = false, message = "Không tìm thấy lớp học." });

            var sinhVien = lopHoc.MaSvs.FirstOrDefault(s => s.MaSv == maSv);
            if (sinhVien == null) return NotFound(new { success = false, message = "Sinh viên không có trong lớp này." });

            try
            {
                // Xóa dữ liệu điểm danh của sinh viên này trong các buổi học của lớp
                var buoiHocIds = lopHoc.BuoiHocs.Select(b => b.MaBuoiHoc).ToList();
                var diemDanhsToRemove = await _context.DiemDanhs
                    .Where(d => d.MaSv == maSv && buoiHocIds.Contains(d.MaBuoiHoc))
                    .ToListAsync();
                
                if (diemDanhsToRemove.Any())
                {
                    _context.DiemDanhs.RemoveRange(diemDanhsToRemove);
                }

                // Gỡ sinh viên khỏi lớp
                lopHoc.MaSvs.Remove(sinhVien);
                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = $"Đã xóa sinh viên {maSv} khỏi lớp và dọn dẹp dữ liệu điểm danh." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi xóa sinh viên: " + ex.Message });
            }
        }

        [HttpDelete("{maLop}")]
        public async Task<IActionResult> Delete(string maLop)
        {
            var lopHoc = await _context.LopHocs
                .Include(l => l.MaSvs)
                .Include(l => l.BuoiHocs)
                    .ThenInclude(b => b.DiemDanhs)
                .FirstOrDefaultAsync(l => l.MaLop == maLop);

            if (lopHoc == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy lớp học." });
            }

            try
            {
                // 1. Xóa tất cả dữ liệu điểm danh trong các buổi học của lớp này
                foreach (var buoiHoc in lopHoc.BuoiHocs)
                {
                    _context.DiemDanhs.RemoveRange(buoiHoc.DiemDanhs);
                }

                // 2. Xóa tất cả buổi học của lớp này
                _context.BuoiHocs.RemoveRange(lopHoc.BuoiHocs);

                // 3. Xóa các liên kết đa-đa với sinh viên (bảng ChiTietLopHoc)
                lopHoc.MaSvs.Clear();

                // 4. Xóa lớp học
                _context.LopHocs.Remove(lopHoc);

                await _context.SaveChangesAsync();

                return Ok(new { success = true, message = $"Đã xóa vĩnh viễn lớp {maLop} và toàn bộ dữ liệu lịch học/điểm danh liên đới." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xóa lớp: " + ex.Message });
            }
        }
        
    }
}