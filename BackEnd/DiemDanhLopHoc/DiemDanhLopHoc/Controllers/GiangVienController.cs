using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using DiemDanhLopHoc.DTOs;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/giangvien")]
    [ApiController]
    public class GiangVienController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GiangVienController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Lấy danh sách (GET) để kiểm tra
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var danhSach = await _context.GiangViens
                .Select(gv => new GiangVienResponseDto
                {
                    MaGv = gv.MaGv,
                    TaiKhoan = gv.TaiKhoan,
                    HoLot = gv.HoLot,
                    TenGv = gv.TenGv,
                    Email = gv.Email,
                    SoDienThoai = gv.SoDienThoai,
                    TrangThai = gv.TrangThai
                })
                .ToListAsync();

            return Ok(danhSach); 
        }

        // 2. Thêm mới (POST) 
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] TaoGiangVienDto request) 
        {
            var giangVienMoi = new GiangVien
            {
                MaGv = request.MaGv,
                TaiKhoan = request.TaiKhoan,
                MatKhau = request.MatKhau,
                HoLot = request.HoLot,
                TenGv = request.TenGv,
                TrangThai = 1 // 1 là Hoạt động
            };

            _context.GiangViens.Add(giangVienMoi);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Thêm giảng viên thành công!" });
        }

        [HttpPost("{maSv}/reset-device")]
        public async Task<IActionResult> ResetDevice(string maSv)
        {
            var sv = await _context.SinhViens.FindAsync(maSv);
            if (sv == null) return NotFound(new { success = false, message = "Không tìm thấy SV" });

            sv.MaThietBi = null; // Xóa mã thiết bị cũ
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đã reset thiết bị. Sinh viên có thể đăng ký máy mới!" });
        }
    }
}