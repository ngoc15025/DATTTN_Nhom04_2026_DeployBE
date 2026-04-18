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
                // Kiểm tra tài khoản bị khóa
                if (giangVien.TrangThai != 1)
                {
                    return Unauthorized(new { success = false, message = "Tài khoản giảng viên này đã bị khóa. Vui lòng liên hệ Quản trị viên." });
                }
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
                return Ok(new { success = true, data = new {
                    token,
                    role = "Student",
                    name = hoTenDayDu,
                    anhDaiDien = sinhVien.AnhDaiDien  // Trả URL ảnh Cloudinary về ngay khi đăng nhập
                }});
            }

            // 4. Tìm cả 3 bảng không ra ai
            return Unauthorized(new { success = false, message = "Tài khoản hoặc mật khẩu không chính xác!" });
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            // Tìm trong 3 bảng
            var admin = await _context.QuanTriViens.FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan && x.MatKhau == request.OldPassword);
            if (admin != null) { admin.MatKhau = request.NewPassword; await _context.SaveChangesAsync(); return Ok(new { success = true, message = "Đổi mật khẩu thành công!" }); }

            var gv = await _context.GiangViens.FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan && x.MatKhau == request.OldPassword);
            if (gv != null) { gv.MatKhau = request.NewPassword; await _context.SaveChangesAsync(); return Ok(new { success = true, message = "Đổi mật khẩu thành công!" }); }

            var sv = await _context.SinhViens.FirstOrDefaultAsync(x => x.TaiKhoan == request.TaiKhoan && x.MatKhau == request.OldPassword);
            if (sv != null) { sv.MatKhau = request.NewPassword; await _context.SaveChangesAsync(); return Ok(new { success = true, message = "Đổi mật khẩu thành công!" }); }

            return BadRequest(new { success = false, message = "Mật khẩu cũ không chính xác!" });
        }

        // Đăng ký thiết bị: Lưu Public Key (ECDSA SPKI Base64) vào cột MaThietBi
        [HttpPost("register-device")]
        public async Task<IActionResult> RegisterDevice([FromBody] RegisterDeviceDto request)
        {
            if (string.IsNullOrWhiteSpace(request.MaSv) || string.IsNullOrWhiteSpace(request.PublicKeyBase64))
                return BadRequest(new { success = false, message = "MaSv và PublicKeyBase64 không được để trống." });

            var sinhVien = await _context.SinhViens.FindAsync(request.MaSv);
            if (sinhVien == null)
                return NotFound(new { success = false, message = "Không tìm thấy sinh viên." });

            // RÀO CHẮN BẢO MẬT 1: Không cho phép dùng chung thiết bị
            var deviceAlreadyInUse = await _context.SinhViens.AnyAsync(s => s.MaThietBi == request.PublicKeyBase64 && s.MaSv != request.MaSv);
            if (deviceAlreadyInUse)
            {
                return BadRequest(new { success = false, message = "Lỗi bảo mật: Thiết bị này đang được sử dụng bởi một tài khoản sinh viên khác. Bạn không thể dùng chung thiết bị!" });
            }

            // RÀO CHẮN BẢO MẬT 2: Không cho phép ghi đè nếu đã có thiết bị khác
            if (!string.IsNullOrEmpty(sinhVien.MaThietBi))
            {
                if (sinhVien.MaThietBi == request.PublicKeyBase64)
                    return Ok(new { success = true, message = "Thiết bị đã được đồng bộ từ trước." });
                else
                    return BadRequest(new { success = false, message = "Tài khoản của bạn đã được liên kết với một thiết bị khác. Vui lòng liên hệ Giảng viên/Giáo vụ để yêu cầu Reset thiết bị." });
            }

            // Validate định dạng Base64 hợp lệ
            try { Convert.FromBase64String(request.PublicKeyBase64); }
            catch { return BadRequest(new { success = false, message = "PublicKey không đúng định dạng Base64." }); }

            // Lưu Public Key vào cột MaThietBi
            sinhVien.MaThietBi = request.PublicKeyBase64;
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đăng ký thiết bị thành công!" });
        }

        // Reset thiết bị: Chỉ định cho Giảng viên / Admin dùng để mở khóa cấp lại thiết bị
        [HttpPost("reset-device/{maSv}")]
        public async Task<IActionResult> ResetDevice(string maSv)
        {
            var sinhVien = await _context.SinhViens.FindAsync(maSv);
            if (sinhVien == null)
                return NotFound(new { success = false, message = "Không tìm thấy sinh viên." });
            
            // Xóa Public Key cũ, đưa về NULL
            sinhVien.MaThietBi = null;
            await _context.SaveChangesAsync();
            
            return Ok(new { success = true, message = $"Đã reset thiết bị cho SV {maSv}. Sinh viên có thể đăng nhập để đăng ký thiết bị mới." });
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
