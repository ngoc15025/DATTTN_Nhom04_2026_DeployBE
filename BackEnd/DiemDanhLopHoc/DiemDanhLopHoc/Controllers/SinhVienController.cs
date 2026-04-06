using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.DTOs;
using DiemDanhLopHoc.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/sinhvien")]
    [ApiController]
    public class SinhVienController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SinhVienController(AppDbContext context)
        {
            _context = context;
        }

        

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.SinhViens
                .Select(s => new SinhVienDto
                {
                    MaSv = s.MaSv,
                    TaiKhoan = s.TaiKhoan,
                    HoTen = s.HoLot + " " + s.TenSv, 
                    Lop = s.Lop,
                    Email = s.Email,
                    SoDienThoai = s.SoDienThoai,
                    AnhDaiDien = s.AnhDaiDien,
                    MaThietBi = s.MaThietBi
                })
                .ToListAsync();
            return Ok(new { success = true, data = danhSach });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaoSinhVienDto request)
        {
            if (string.IsNullOrWhiteSpace(request.MaSv) ||
                string.IsNullOrWhiteSpace(request.TaiKhoan) ||
                string.IsNullOrWhiteSpace(request.MatKhau) ||
                string.IsNullOrWhiteSpace(request.TenSv) ||
                string.IsNullOrWhiteSpace(request.Lop))
            {
                return BadRequest(new { success = false, message = "Vui lòng nhập đầy đủ thông tin bắt buộc." });
            }

            if (await _context.SinhViens.AnyAsync(sv => sv.MaSv == request.MaSv))
                return Conflict(new { success = false, message = "Mã sinh viên đã tồn tại." });

            if (await _context.SinhViens.AnyAsync(sv => sv.TaiKhoan == request.TaiKhoan))
                return Conflict(new { success = false, message = "Tài khoản đã tồn tại." });

            var sinhVienMoi = new SinhVien
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

            _context.SinhViens.Add(sinhVienMoi);
            await _context.SaveChangesAsync();

            return StatusCode(StatusCodes.Status201Created, new
            {
                success = true,
                message = "Thêm sinh viên thành công.",
                data = new SinhVienDto
                {
                    MaSv = sinhVienMoi.MaSv,
                    TaiKhoan = sinhVienMoi.TaiKhoan,
                    HoTen = sinhVienMoi.HoLot + " " + sinhVienMoi.TenSv,
                    Lop = sinhVienMoi.Lop
                }
            });
        }

        [HttpPost("import")]
        public async Task<IActionResult> ImportExcel([FromBody] List<TaoSinhVienDto> requests)
        {
            var newStudents = new List<SinhVien>();
            var errors = new List<string>();

            foreach (var req in requests)
            {
                if (await _context.SinhViens.AnyAsync(s => s.MaSv == req.MaSv))
                {
                    errors.Add($"MSSV {req.MaSv} đã tồn tại.");
                    continue;
                }

                if (await _context.SinhViens.AnyAsync(s => s.TaiKhoan == req.TaiKhoan))
                {
                    errors.Add($"Tài khoản {req.TaiKhoan} đã có người sử dụng.");
                    continue;
                }

                newStudents.Add(new SinhVien
                {
                    MaSv = req.MaSv,
                    TaiKhoan = req.TaiKhoan,
                    MatKhau = req.MatKhau,
                    HoLot = req.HoLot,
                    TenSv = req.TenSv,
                    Lop = req.Lop,
                    Email = req.Email,
                    SoDienThoai = req.SoDienThoai
                });
            }

            if (newStudents.Any())
            {
                _context.SinhViens.AddRange(newStudents);
                await _context.SaveChangesAsync();
            }

            return Ok(new 
            { 
                success = true, 
                message = $"Đã nhập thành công {newStudents.Count} sinh viên. " + (errors.Any() ? $"{errors.Count} lỗi xảy ra." : ""),
                imported = newStudents.Count, 
                errors = errors 
            });
        }

        [HttpPut("{maSv}")]
        public async Task<IActionResult> Update(string maSv, [FromBody] CapNhatSinhVienDto request)
        {
            var sinhVien = await _context.SinhViens.FindAsync(maSv);
            if (sinhVien == null) return NotFound(new { success = false, message = "Không tìm thấy sinh viên." });

            sinhVien.HoLot = request.HoLot;
            sinhVien.TenSv = request.TenSv;
            sinhVien.Lop = request.Lop;
            sinhVien.Email = request.Email;
            sinhVien.SoDienThoai = request.SoDienThoai;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Cập nhật sinh viên thành công." });
        }

        [HttpDelete("{maSv}")]
        public async Task<IActionResult> Delete(string maSv)
        {
            var sinhVien = await _context.SinhViens.FindAsync(maSv);
            if (sinhVien == null) return NotFound(new { success = false, message = "Không tìm thấy sinh viên." });

            try
            {
                _context.SinhViens.Remove(sinhVien);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = $"Đã xóa sinh viên {sinhVien.HoLot} {sinhVien.TenSv} thành công." });
            }
            catch (DbUpdateException)
            {
                return Conflict(new { success = false, message = "Không thể xóa vì sinh viên này đang liên kết với lớp học/điểm danh." });
            }
        }
    }
}