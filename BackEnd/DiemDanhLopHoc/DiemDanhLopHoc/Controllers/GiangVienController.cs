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
                    HoTen = gv.HoTen,
                    Email = gv.Email,
                    SoDienThoai = gv.SoDienThoai,
                    TrangThai = gv.TrangThai
                })
                .ToListAsync();

            return Ok(danhSach);
        }

        // 2. Thêm mới (POST) 
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] GiangVien request)
        {
            var giangVienMoi = new GiangVien
            {
                MaGv = request.MaGv,
                TaiKhoan = request.TaiKhoan,
                MatKhau = request.MatKhau,
                HoTen = request.HoTen,
                TrangThai = true
            };

            _context.GiangViens.Add(giangVienMoi);
            await _context.SaveChangesAsync();

            return Ok("Thêm giảng viên thành công !");
        }
    }
}
