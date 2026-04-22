using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Fido2NetLib;
using Fido2NetLib.Objects;
using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using DiemDanhLopHoc.Utils;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebAuthnController : ControllerBase
    {
        private readonly IFido2 _fido2;
        private readonly IMemoryCache _cache;
        private readonly AppDbContext _context;

        public WebAuthnController(IFido2 fido2, IMemoryCache cache, AppDbContext context)
        {
            _fido2 = fido2;
            _cache = cache;
            _context = context;
        }

        // ==========================================================
        // GIAI ĐOẠN 1: ĐĂNG KÝ PASSKEY (MAKE CREDENTIAL)
        // ==========================================================

        [HttpGet("register-options")]
        public async Task<IActionResult> MakeCredentialOptions([FromQuery] string maSv)
        {
            var sv = await _context.SinhViens.FindAsync(maSv);
            if (sv == null) return NotFound(new { message = "Không tìm thấy sinh viên." });

            var userHandle = Encoding.UTF8.GetBytes(sv.MaSv);
            var user = new Fido2User
            {
                DisplayName = sv.HoLot + " " + sv.TenSv,
                Name = sv.TaiKhoan,
                Id = userHandle
            };

            // Bắt buộc sinh viên phải dùng thiết bị có Khóa màn hình (FaceID/Vân tay/PIN)
            var authenticatorSelection = new AuthenticatorSelection
            {
                RequireResidentKey = true,
                UserVerification = UserVerificationRequirement.Required
            };

            var options = _fido2.RequestNewCredential(new RequestNewCredentialParams
            {
                User = user,
                ExcludeCredentials = new List<PublicKeyCredentialDescriptor>(),
                AuthenticatorSelection = authenticatorSelection,
                AttestationPreference = AttestationConveyancePreference.None
            });

            // Lưu Options vào Cache để Verify bước sau (5 phút)
            _cache.Set($"fido2:reg:{maSv}", options.ToJson(), TimeSpan.FromMinutes(5));

            return Ok(options);
        }

        [HttpPost("register-verify")]
        public async Task<IActionResult> MakeCredentialVerify([FromQuery] string maSv, [FromBody] AuthenticatorAttestationRawResponse response)
        {
            var sv = await _context.SinhViens.FindAsync(maSv);
            if (sv == null) return NotFound(new { message = "Không tìm thấy sinh viên." });

            var optionsJson = _cache.Get<string>($"fido2:reg:{maSv}");
            if (string.IsNullOrEmpty(optionsJson))
                 return BadRequest(new { message = "Phiên đăng ký đã hết hạn. Vui lòng thử lại." });

            var options = CredentialCreateOptions.FromJson(optionsJson);

            try
            {
                var success = await _fido2.MakeNewCredentialAsync(new MakeNewCredentialParams
                {
                    AttestationResponse = response,
                    OriginalOptions = options,
                    IsCredentialIdUniqueToUserCallback = async (args, cancellationToken) =>
                    {
                        var existingUser = await _context.SinhViens.FirstOrDefaultAsync(s => s.PasskeyCredentialId == args.CredentialId);
                        return existingUser == null;
                    }
                });

                // Cập nhật DB
                sv.PasskeyCredentialId = success.Id;
                sv.PasskeyPublicKey = success.PublicKey;
                sv.PasskeySignCount = success.SignCount;
                sv.PasskeyUserHandle = success.User.Id;
                
                await _context.SaveChangesAsync();
                _cache.Remove($"fido2:reg:{maSv}"); // Dọn dẹp cache

                return Ok(new { success = true, message = "Đăng ký Khóa truy cập Sinh trắc học thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi xác thực phần cứng: " + ex.Message });
            }
        }

        // ==========================================================
        // GIAI ĐOẠN 2: ĐIỂM DANH (MAKE ASSERTION)
        // ==========================================================

        public class AssertionRequestDto
        {
            public string MaSv { get; set; } = null!;
            public int MaBuoiHoc { get; set; }
            public double? Lat { get; set; }
            public double? Long { get; set; }
            public string QrToken { get; set; } = null!;
        }

        [HttpPost("assertion-options")]
        public async Task<IActionResult> MakeAssertionOptions([FromBody] AssertionRequestDto request)
        {
            var sv = await _context.SinhViens.FindAsync(request.MaSv);
            if (sv == null || sv.PasskeyCredentialId == null)
                return BadRequest(new { message = "Thiết bị chưa được đăng ký Passkey." });

            var buoiHoc = await _context.BuoiHocs.FindAsync(request.MaBuoiHoc);
            if (buoiHoc == null || buoiHoc.TrangThaiBh != 1)
                return BadRequest(new { message = "Buổi học chưa mở điểm danh." });

            var daDiemDanh = await _context.DiemDanhs.AnyAsync(d => d.MaBuoiHoc == request.MaBuoiHoc && d.MaSv == request.MaSv);
            if (daDiemDanh) return BadRequest(new { message = "Bạn đã điểm danh buổi này rồi." });

            // 1. KIỂM TRA QR ĐỘNG (TOTP - 30s)
            if (!QrUtils.ValidateQrToken(request.MaBuoiHoc, request.QrToken))
                return BadRequest(new { message = "Mã QR đã hết hạn! Vui lòng quét lại mã mới trên màn hình Giảng viên." });

            // 2. KIỂM TRA GPS BÁN KÍNH 60M
            double? calculatedDistance = null;
            if (buoiHoc.ToaDoGocLat.HasValue && buoiHoc.ToaDoGocLong.HasValue && request.Lat.HasValue && request.Long.HasValue)
            {
                var rawDistance = CalculateDistance(buoiHoc.ToaDoGocLat.Value, buoiHoc.ToaDoGocLong.Value, request.Lat.Value, request.Long.Value);
                if (rawDistance > 60)
                {
                    // Ghi nhận gian lận GPS ngay lập tức
                    calculatedDistance = Math.Max(0, Math.Round(rawDistance - 32));
                    await RecordAttendance(request.MaBuoiHoc, request.MaSv, 5, request.Lat, request.Long, $"Gian lận vị trí: Cách {calculatedDistance} mét");
                    return StatusCode(403, new { message = "Gian lận vị trí! Bạn đang ở quá xa phòng học." });
                }
                calculatedDistance = Math.Max(0, Math.Round(rawDistance - 32));
            }

            // Tạo Challenge gửi về hệ điều hành điện thoại
            var allowedCredentials = new List<PublicKeyCredentialDescriptor>
            {
                new PublicKeyCredentialDescriptor(sv.PasskeyCredentialId)
            };
            
            var options = _fido2.GetAssertionOptions(new GetAssertionOptionsParams
            {
                AllowedCredentials = allowedCredentials,
                UserVerification = UserVerificationRequirement.Required
            });

            // Lưu Options kèm Dữ liệu Điểm danh TẠM THỜI vào Cache
            var cacheData = new {
                OptionsJson = options.ToJson(),
                request.MaBuoiHoc,
                request.Lat,
                request.Long,
                Distance = calculatedDistance
            };
            _cache.Set($"fido2:auth:{request.MaSv}", JsonSerializer.Serialize(cacheData), TimeSpan.FromMinutes(2));

            return Ok(options);
        }

        [HttpPost("assertion-verify")]
        public async Task<IActionResult> MakeAssertionVerify([FromQuery] string maSv, [FromBody] AuthenticatorAssertionRawResponse response)
        {
            var sv = await _context.SinhViens.FindAsync(maSv);
            if (sv == null || sv.PasskeyPublicKey == null) return NotFound();

            var cacheStr = _cache.Get<string>($"fido2:auth:{maSv}");
            if (string.IsNullOrEmpty(cacheStr))
                 return BadRequest(new { message = "Phiên điểm danh đã hết hạn." });

            var cacheData = JsonSerializer.Deserialize<JsonElement>(cacheStr);
            var optionsJson = cacheData.GetProperty("OptionsJson").GetString();
            var maBuoiHoc = cacheData.GetProperty("MaBuoiHoc").GetInt32();
            var distance = cacheData.TryGetProperty("Distance", out var dEl) && dEl.ValueKind == JsonValueKind.Number ? dEl.GetDouble() : (double?)null;
            
            double? lat = cacheData.TryGetProperty("Lat", out var latEl) && latEl.ValueKind == JsonValueKind.Number ? latEl.GetDouble() : null;
            double? lng = cacheData.TryGetProperty("Long", out var lngEl) && lngEl.ValueKind == JsonValueKind.Number ? lngEl.GetDouble() : null;

            var options = AssertionOptions.FromJson(optionsJson);

            try
            {
                var storedSignCount = (uint?)sv.PasskeySignCount ?? 0;
                var res = await _fido2.MakeAssertionAsync(new MakeAssertionParams
                {
                    AssertionResponse = response,
                    OriginalOptions = options,
                    StoredPublicKey = sv.PasskeyPublicKey,
                    StoredSignatureCounter = storedSignCount,
                    IsUserHandleOwnerOfCredentialIdCallback = async (args, cancellationToken) =>
                    {
                        return sv.PasskeyCredentialId.SequenceEqual(args.CredentialId);
                    }
                });

                // Cập nhật lại SignCount để chống Replay Attack
                sv.PasskeySignCount = res.SignCount;
                await _context.SaveChangesAsync();
                
                _cache.Remove($"fido2:auth:{maSv}");

                // GHI NHẬN ĐIỂM DANH THÀNH CÔNG VÀO DB
                await RecordAttendance(maBuoiHoc, maSv, 1, lat, lng);
                return Ok(new { success = true, message = "Điểm danh thành công!", distance = distance });
            }
            catch (Exception ex)
            {
                await RecordAttendance(maBuoiHoc, maSv, 5, lat, lng, "Phát hiện giả mạo chữ ký thiết bị (" + ex.Message + ")");
                return StatusCode(403, new { message = "Phát hiện gian lận thiết bị/chữ ký không hợp lệ." });
            }
        }

        // --- Helper functions ---
        private async Task RecordAttendance(int maBuoiHoc, string maSv, int trangThai, double? lat, double? lng, string? ghiChu = null)
        {
            var ketQua = new DiemDanh
            {
                MaBuoiHoc = maBuoiHoc,
                MaSv = maSv,
                TrangThai = trangThai,
                ThoiGianQuet = TimeUtils.GetVietnamTime(),
                ToaDoSvLat = lat,
                ToaDoSvLong = lng,
                GhiChu = ghiChu,
                MaThietBiLog = "Passkey_WebAuthn_Verified"
            };
            _context.DiemDanhs.Add(ketQua);
            await _context.SaveChangesAsync();
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371e3;
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) + Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }
    }
}
