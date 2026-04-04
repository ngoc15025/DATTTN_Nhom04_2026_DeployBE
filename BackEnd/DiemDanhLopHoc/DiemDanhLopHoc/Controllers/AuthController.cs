using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

//============API Đăng nhập================
namespace DiemDanhLopHoc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (string.IsNullOrEmpty(request.TaiKhoan) || string.IsNullOrEmpty(request.MatKhau))
            {
                return BadRequest(new { success = false, message = "Vui lòng nhập đầy đủ tài khoản và mật khẩu." });
            }

            // 1. Gõ cửa nhà Admin (QuanTriVien)
            var admin = await _context.QuanTriViens
                .FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan && x.MatKhau == request.MatKhau);
            if (admin != null)
            {
                var token = GenerateJwtToken(admin.TaiKhoan, "Admin", admin.HoTen, admin.MaQtv);
                return Ok(new { success = true, message = "Đăng nhập thành công", data = new { token = token, role = "Admin", name = admin.HoTen } });
            }

            // 2. Gõ cửa nhà Giảng Viên
            var giangVien = await _context.GiangViens
                .FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan && x.MatKhau == request.MatKhau);
            if (giangVien != null)
            {
                var hoTenDayDu = $"{giangVien.HoLot} {giangVien.TenGv}";
                var token = GenerateJwtToken(giangVien.TaiKhoan, "Lecturer", hoTenDayDu, giangVien.MaGv);
                return Ok(new { success = true, data = new { token, role = "Lecturer", name = hoTenDayDu } });
            }

            // 3. Gõ cửa nhà Sinh Viên
            var sinhVien = await _context.SinhViens
                .FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan && x.MatKhau == request.MatKhau);
            if (sinhVien != null)
            {
                var hoTenDayDu = $"{sinhVien.HoLot} {sinhVien.TenSv}";
                var token = GenerateJwtToken(sinhVien.TaiKhoan, "Student", hoTenDayDu, sinhVien.MaSv);
                return Ok(new { success = true, data = new { token, role = "Student", name = hoTenDayDu } });
            }

            // 4. Tìm cả 3 bảng không ra ai
            return Unauthorized(new { success = false, message = "Tài khoản hoặc mật khẩu không chính xác!" });
        }

        // --- HÀM HỖ TRỢ ĐẺ TOKEN (Chỉ giữ lại 1 hàm chuẩn 4 tham số này) ---
        private string GenerateJwtToken(string taiKhoan, string role, string hoTen, string id)
        {
            // Lấy Secret Key từ file appsettings.json
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));

            // Nhét dữ liệu vào trong bụng Token (Claims)
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, taiKhoan),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, id),
                new Claim(ClaimTypes.Name, hoTen),
                new Claim(ClaimTypes.Role, role) // Cực kỳ quan trọng để phân quyền [Authorize(Roles="Admin")]
            };

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2), // Token sống được 2 tiếng
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}