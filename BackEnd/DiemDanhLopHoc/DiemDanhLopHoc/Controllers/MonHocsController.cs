using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.DTOs;
using DiemDanhLopHoc.Models; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Lecturer")]
    public class MonHocsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MonHocsController(AppDbContext context)
        {
            _context = context;
        }

    

        // --- 2. API Lấy danh sách Môn học (GET) ---
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? maGv)
        {
            // Môn học là danh mục dùng chung → luôn trả về toàn bộ để Giảng viên thêm/sửa.
            // Việc lọc theo giảng viên đã được thực hiện ở API danh sách Lớp học riêng.
            var danhSach = await _context.MonHocs
                .OrderBy(m => m.MaMon)
                .Select(m => new MonHocDto { MaMon = m.MaMon, TenMon = m.TenMon })
                .ToListAsync();

            return Ok(danhSach);
        }

        // --- 3. API Lấy chi tiết 1 Môn học (GET by ID) ---
        [HttpGet("{maMon}")]
        public async Task<IActionResult> GetById(string maMon)
        {
            var monHoc = await _context.MonHocs
                .Where(m => m.MaMon == maMon)
                .Select(m => new MonHocDto { MaMon = m.MaMon, TenMon = m.TenMon })
                .FirstOrDefaultAsync();

            if (monHoc == null) return NotFound(new { Message = "Không tìm thấy môn học!" });

            return Ok(monHoc);
        }

        // --- 4. API Thêm Môn học mới (POST) ---
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MonHocDto request)
        {
            // Check trùng mã
            var daTonTai = await _context.MonHocs.AnyAsync(m => m.MaMon == request.MaMon);
            if (daTonTai) return BadRequest(new { Message = "Mã môn học đã tồn tại trong hệ thống!" });

            var monHocMoi = new MonHoc
            {
                MaMon = request.MaMon,
                TenMon = request.TenMon
            };

            _context.MonHocs.Add(monHocMoi);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Thêm môn học thành công!", Data = request });
        }

        // --- 5. API Cập nhật Môn học (PUT) ---
        [HttpPut("{maMon}")]
        public async Task<IActionResult> Update(string maMon, [FromBody] MonHocDto request)
        {
            var monHoc = await _context.MonHocs.FirstOrDefaultAsync(m => m.MaMon == maMon);
            if (monHoc == null) return NotFound(new { Message = "Không tìm thấy môn học để cập nhật!" });

            // Cập nhật tên môn (Mã môn thường không cho phép sửa)
            monHoc.TenMon = request.TenMon;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật thành công!" });
        }

        // --- 6. API Xóa Môn học (DELETE) ---
        [HttpDelete("{maMon}")]
        public async Task<IActionResult> Delete(string maMon)
        {
            var monHoc = await _context.MonHocs.FirstOrDefaultAsync(m => m.MaMon == maMon);
            if (monHoc == null) return NotFound(new { Message = "Không tìm thấy môn học để xóa!" });

            // Lưu ý: Nếu môn học đã được gắn vào Lớp Học (có dữ liệu khóa ngoại), SQL sẽ chặn không cho xóa.
            // Phải try-catch chỗ này để báo lỗi đẹp cho FE.
            try
            {
                _context.MonHocs.Remove(monHoc);
                await _context.SaveChangesAsync();
                return Ok(new { Message = "Xóa môn học thành công!" });
            }
            catch (Exception)
            {
                return BadRequest(new { Message = "Không thể xóa! Môn học này đang được sử dụng trong các Lớp học." });
            }
        }
    }
}