using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiemDanhLopHoc.Controllers
{
    // Controller này phụ trách các API quản lý Sinh viên theo đúng tài liệu nhóm:
    // - GET /api/sinhvien
    // - POST /api/sinhvien
    // Đồng thời giữ thêm PUT, DELETE đang có để tận dụng controller hiện tại.
    [Route("api/sinhvien")]
    [ApiController]
    public class SinhVienController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SinhVienController(AppDbContext context)
        {
            _context = context;
        }

        // DTO dùng để trả dữ liệu Sinh viên ra cho FE.
        // Mục tiêu: chỉ trả thông tin cần thiết, tuyệt đối không lộ MatKhau.
        public class SinhVienDto
        {
            public string MaSv { get; set; } = null!;
            public string TaiKhoan { get; set; } = null!;
            public string HoTen { get; set; } = null!;
            public DateTime? NgaySinh { get; set; }
            public string? Email { get; set; }
            public string? SoDienThoai { get; set; }
            public string? AnhDaiDien { get; set; }
        }

        // DTO dùng khi tạo mới Sinh viên.
        // Theo tài liệu hiện tại, API chỉ cần 4 trường cơ bản.
        public class TaoSinhVienDto
        {
            public string MaSv { get; set; } = null!;
            public string TaiKhoan { get; set; } = null!;
            public string MatKhau { get; set; } = null!;
            public string HoTen { get; set; } = null!;
        }

        // DTO dùng khi cập nhật thông tin Sinh viên.
        // Chỉ cho sửa các trường hồ sơ cơ bản, không sửa MaSv/TaiKhoan/MatKhau tại đây.
        public class CapNhatSinhVienDto
        {
            public string HoTen { get; set; } = null!;
            public string? Email { get; set; }
            public string? SoDienThoai { get; set; }
        }

        // API lấy danh sách toàn bộ Sinh viên.
        // Dùng Select để map sang DTO, tránh trả thẳng entity gây lộ MatKhau và lỗi vòng lặp navigation.
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.SinhViens
                .Select(sv => new SinhVienDto
                {
                    MaSv = sv.MaSv,
                    TaiKhoan = sv.TaiKhoan,
                    HoTen = sv.HoTen,
                    NgaySinh = sv.NgaySinh,
                    Email = sv.Email,
                    SoDienThoai = sv.SoDienThoai,
                    AnhDaiDien = sv.AnhDaiDien
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                message = "Lấy danh sách sinh viên thành công.",
                data = danhSach
            });
        }

        // API thêm mới Sinh viên.
        // Có validate cơ bản:
        // - không cho trùng MaSv
        // - không cho trùng TaiKhoan
        // - không nhận dữ liệu rỗng
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaoSinhVienDto request)
        {
            if (string.IsNullOrWhiteSpace(request.MaSv) ||
                string.IsNullOrWhiteSpace(request.TaiKhoan) ||
                string.IsNullOrWhiteSpace(request.MatKhau) ||
                string.IsNullOrWhiteSpace(request.HoTen))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Vui lòng nhập đầy đủ MaSv, TaiKhoan, MatKhau và HoTen.",
                    data = (object?)null
                });
            }

            var trungMa = await _context.SinhViens.AnyAsync(sv => sv.MaSv == request.MaSv);
            if (trungMa)
            {
                return Conflict(new
                {
                    success = false,
                    message = "Mã sinh viên đã tồn tại trong hệ thống.",
                    data = (object?)null
                });
            }

            var trungTaiKhoan = await _context.SinhViens.AnyAsync(sv => sv.TaiKhoan == request.TaiKhoan);
            if (trungTaiKhoan)
            {
                return Conflict(new
                {
                    success = false,
                    message = "Tài khoản đã được sử dụng.",
                    data = (object?)null
                });
            }

            var sinhVienMoi = new SinhVien
            {
                MaSv = request.MaSv,
                TaiKhoan = request.TaiKhoan,
                MatKhau = request.MatKhau,
                HoTen = request.HoTen
            };

            _context.SinhViens.Add(sinhVienMoi);
            await _context.SaveChangesAsync();

            var ketQua = new SinhVienDto
            {
                MaSv = sinhVienMoi.MaSv,
                TaiKhoan = sinhVienMoi.TaiKhoan,
                HoTen = sinhVienMoi.HoTen,
                NgaySinh = sinhVienMoi.NgaySinh,
                Email = sinhVienMoi.Email,
                SoDienThoai = sinhVienMoi.SoDienThoai,
                AnhDaiDien = sinhVienMoi.AnhDaiDien
            };

            return StatusCode(StatusCodes.Status201Created, new
            {
                success = true,
                message = "Thêm sinh viên thành công.",
                data = ketQua
            });
        }

        // API cập nhật thông tin Sinh viên.
        // Giữ lại để tận dụng controller hiện có, dù chưa nằm trong 10 API được giao trước mắt.
        [HttpPut("{maSv}")]
        public async Task<IActionResult> Update(string maSv, [FromBody] CapNhatSinhVienDto request)
        {
            if (string.IsNullOrWhiteSpace(request.HoTen))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Họ tên không được để trống.",
                    data = (object?)null
                });
            }

            var sinhVien = await _context.SinhViens.FindAsync(maSv);
            if (sinhVien == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = $"Không tìm thấy sinh viên có mã '{maSv}'.",
                    data = (object?)null
                });
            }

            sinhVien.HoTen = request.HoTen;
            sinhVien.Email = request.Email;
            sinhVien.SoDienThoai = request.SoDienThoai;

            await _context.SaveChangesAsync();

            var ketQua = new SinhVienDto
            {
                MaSv = sinhVien.MaSv,
                TaiKhoan = sinhVien.TaiKhoan,
                HoTen = sinhVien.HoTen,
                NgaySinh = sinhVien.NgaySinh,
                Email = sinhVien.Email,
                SoDienThoai = sinhVien.SoDienThoai,
                AnhDaiDien = sinhVien.AnhDaiDien
            };

            return Ok(new
            {
                success = true,
                message = "Cập nhật sinh viên thành công.",
                data = ketQua
            });
        }

        // API xóa Sinh viên.
        // Có bắt lỗi khóa ngoại để tránh crash khi sinh viên đang nằm trong lớp hoặc có dữ liệu điểm danh.
        [HttpDelete("{maSv}")]
        public async Task<IActionResult> Delete(string maSv)
        {
            var sinhVien = await _context.SinhViens.FindAsync(maSv);
            if (sinhVien == null)
            {
                return NotFound(new
                {
                    success = false,
                    message = $"Không tìm thấy sinh viên có mã '{maSv}'.",
                    data = (object?)null
                });
            }

            try
            {
                _context.SinhViens.Remove(sinhVien);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = $"Đã xóa sinh viên '{sinhVien.HoTen}' ({maSv}) thành công.",
                    data = (object?)null
                });
            }
            catch (DbUpdateException)
            {
                return Conflict(new
                {
                    success = false,
                    message = $"Không thể xóa sinh viên '{maSv}' vì đang có dữ liệu liên quan.",
                    data = (object?)null
                });
            }
        }
    }
}