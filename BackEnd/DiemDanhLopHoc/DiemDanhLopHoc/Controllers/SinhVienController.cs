using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SinhVienController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SinhVienController(AppDbContext context)
        {
            _context = context;
        }

        // --- 1. DTO trả về danh sách sinh viên (Ẩn MatKhau, chống lỗi vòng lặp Swagger) ---
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

        // --- 2. DTO nhận dữ liệu khi thêm sinh viên mới (POST) ---
        // Chỉ nhận đúng 4 trường bắt buộc, các trường còn lại có thể bổ sung sau
        public class TaoSinhVienDto
        {
            public string MaSv { get; set; } = null!;
            public string TaiKhoan { get; set; } = null!;
            public string MatKhau { get; set; } = null!;
            public string HoTen { get; set; } = null!;
        }

        // --- 3. API Lấy danh sách Sinh viên (GET /api/sinhvien) ---
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Dùng .Select() để map sang DTO, bỏ qua MatKhau và các navigation property
            // tránh lỗi vòng lặp JSON khi có quan hệ LopHoc <-> SinhVien
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

            return Ok(danhSach);
        }

        // --- 4. DTO nhận dữ liệu khi cập nhật sinh viên (PUT) ---
        // Chỉ cho phép sửa HoTen, Email, SoDienThoai — không sửa MaSv, MatKhau, TaiKhoan
        public class CapNhatSinhVienDto
        {
            public string HoTen { get; set; } = null!;
            public string? Email { get; set; }
            public string? SoDienThoai { get; set; }
        }

        // --- 5. API Thêm Sinh viên mới (POST /api/sinhvien) ---
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaoSinhVienDto request)
        {
            // Kiểm tra trùng Mã sinh viên
            var trungMa = await _context.SinhViens.AnyAsync(sv => sv.MaSv == request.MaSv);
            if (trungMa) return BadRequest(new { Message = "Mã sinh viên đã tồn tại trong hệ thống!" });

            // Kiểm tra trùng Tài khoản (có ràng buộc UNIQUE trên cột TaiKhoan trong DB)
            var trungTaiKhoan = await _context.SinhViens.AnyAsync(sv => sv.TaiKhoan == request.TaiKhoan);
            if (trungTaiKhoan) return BadRequest(new { Message = "Tài khoản đã được sử dụng!" });

            var sinhVienMoi = new SinhVien
            {
                MaSv = request.MaSv,
                TaiKhoan = request.TaiKhoan,
                MatKhau = request.MatKhau,
                HoTen = request.HoTen
            };

            _context.SinhViens.Add(sinhVienMoi);
            await _context.SaveChangesAsync();

            // Trả về DTO (không trả về entity gốc để tránh lộ MatKhau)
            var ketQua = new SinhVienDto
            {
                MaSv = sinhVienMoi.MaSv,
                TaiKhoan = sinhVienMoi.TaiKhoan,
                HoTen = sinhVienMoi.HoTen
            };

            return Ok(new { Message = "Thêm sinh viên thành công!", Data = ketQua });
        }

        // --- 6. API Cập nhật thông tin Sinh viên (PUT /api/sinhvien/{maSv}) ---
        // Chỉ cho sửa HoTen, Email, SoDienThoai — MaSv và MatKhau không được thay đổi
        [HttpPut("{maSv}")]
        public async Task<IActionResult> Update(string maSv, [FromBody] CapNhatSinhVienDto request)
        {
            // Tìm sinh viên theo mã
            var sinhVien = await _context.SinhViens.FindAsync(maSv);
            if (sinhVien == null)
                return NotFound(new { Message = $"Không tìm thấy sinh viên có mã '{maSv}'!" });

            // Cập nhật các trường được phép sửa
            sinhVien.HoTen = request.HoTen;
            sinhVien.Email = request.Email;
            sinhVien.SoDienThoai = request.SoDienThoai;

            await _context.SaveChangesAsync();

            // Trả về thông tin sau khi cập nhật (dùng DTO để ẩn MatKhau)
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

            return Ok(new { Message = "Cập nhật sinh viên thành công!", Data = ketQua });
        }

        // --- 7. API Xóa Sinh viên (DELETE /api/sinhvien/{maSv}) ---
        // Dùng try-catch để xử lý trường hợp sinh viên đang có dữ liệu liên quan (khóa ngoại)
        [HttpDelete("{maSv}")]
        public async Task<IActionResult> Delete(string maSv)
        {
            // Tìm sinh viên theo mã
            var sinhVien = await _context.SinhViens.FindAsync(maSv);
            if (sinhVien == null)
                return NotFound(new { Message = $"Không tìm thấy sinh viên có mã '{maSv}'!" });

            try
            {
                _context.SinhViens.Remove(sinhVien);
                await _context.SaveChangesAsync();

                return Ok(new { Message = $"Đã xóa sinh viên '{sinhVien.HoTen}' ({maSv}) thành công!" });
            }
            catch (DbUpdateException)
            {
                // Lỗi khóa ngoại: sinh viên đang có dữ liệu ở bảng ChiTietLopHoc hoặc DiemDanh
                return Conflict(new { Message = $"Không thể xóa sinh viên '{maSv}' vì đang có dữ liệu liên quan (điểm danh hoặc lớp học)!" });
            }
        }
    }
}
