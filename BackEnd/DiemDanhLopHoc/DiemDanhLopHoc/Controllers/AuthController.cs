using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DiemDanhLopHoc.Utils;
using Microsoft.AspNetCore.Authorization;

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
                return BadRequest(new { success = false, message = "Vui lòng nhập đầy đủ tài khoản và mật khẩu." });

            // Helper xác thực mật khẩu — tương thích ngược: hash hoặc plaintext cũ
            bool CheckPassword(string stored, string input)
            {
                if (PasswordUtils.IsHashed(stored))
                    return PasswordUtils.Verify(input, stored);
                return stored == input; // Plaintext cũ
            }

            // 1. Admin
            var admin = await _context.QuanTriViens.FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan);
            if (admin != null && CheckPassword(admin.MatKhau, request.MatKhau))
            {
                // Tự động nâng cấp hash nếu còn plaintext
                if (!PasswordUtils.IsHashed(admin.MatKhau))
                {
                    admin.MatKhau = PasswordUtils.Hash(request.MatKhau);
                    await _context.SaveChangesAsync();
                }
                var token = GenerateJwtToken(admin.TaiKhoan, "Admin", admin.HoTen, admin.MaQtv);
                return Ok(new { success = true, message = "Đăng nhập thành công", data = new { token, role = "Admin", name = admin.HoTen } });
            }

            // 2. Giảng viên
            var giangVien = await _context.GiangViens.FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan);
            if (giangVien != null && CheckPassword(giangVien.MatKhau, request.MatKhau))
            {
                if (giangVien.TrangThai != 1)
                    return Unauthorized(new { success = false, message = "Tài khoản giảng viên này đã bị khóa. Vui lòng liên hệ Quản trị viên." });

                if (!PasswordUtils.IsHashed(giangVien.MatKhau))
                {
                    giangVien.MatKhau = PasswordUtils.Hash(request.MatKhau);
                    await _context.SaveChangesAsync();
                }
                var hoTenGv = $"{giangVien.HoLot} {giangVien.TenGv}";
                var token = GenerateJwtToken(giangVien.TaiKhoan, "Lecturer", hoTenGv, giangVien.MaGv);
                return Ok(new { success = true, data = new { token, role = "Lecturer", name = hoTenGv } });
            }

            // 3. Sinh viên
            var sinhVien = await _context.SinhViens.FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan);
            if (sinhVien != null && CheckPassword(sinhVien.MatKhau, request.MatKhau))
            {
                if (!PasswordUtils.IsHashed(sinhVien.MatKhau))
                {
                    sinhVien.MatKhau = PasswordUtils.Hash(request.MatKhau);
                    await _context.SaveChangesAsync();
                }
                var hoTenSv = $"{sinhVien.HoLot} {sinhVien.TenSv}";
                var token = GenerateJwtToken(sinhVien.TaiKhoan, "Student", hoTenSv, sinhVien.MaSv);
                return Ok(new { success = true, data = new {
                    token, role = "Student", name = hoTenSv,
                    anhDaiDien = sinhVien.AnhDaiDien,
                    hasPasskey = sinhVien.PasskeyCredentialId != null
                }});
            }

            return Unauthorized(new { success = false, message = "Tài khoản hoặc mật khẩu không chính xác!" });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            bool CheckPassword(string stored, string input)
                => PasswordUtils.IsHashed(stored) ? PasswordUtils.Verify(input, stored) : stored == input;

            var admin = await _context.QuanTriViens.FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan);
            if (admin != null && CheckPassword(admin.MatKhau, request.OldPassword))
            {
                admin.MatKhau = PasswordUtils.Hash(request.NewPassword);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Đổi mật khẩu thành công!" });
            }

            var gv = await _context.GiangViens.FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan);
            if (gv != null && CheckPassword(gv.MatKhau, request.OldPassword))
            {
                gv.MatKhau = PasswordUtils.Hash(request.NewPassword);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Đổi mật khẩu thành công!" });
            }

            var sv = await _context.SinhViens.FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan);
            if (sv != null && CheckPassword(sv.MatKhau, request.OldPassword))
            {
                sv.MatKhau = PasswordUtils.Hash(request.NewPassword);
                await _context.SaveChangesAsync();
                return Ok(new { success = true, message = "Đổi mật khẩu thành công!" });
            }

            return BadRequest(new { success = false, message = "Mật khẩu cũ không chính xác!" });
        }

        // Đăng ký mật khẩu vân tay/thiết bị cũ đã được thay thế hoàn toàn bằng WebAuthnController
        
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
                expires: TimeUtils.GetVietnamTime().AddHours(2), // Token sống được 2 tiếng theo giờ VN
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}