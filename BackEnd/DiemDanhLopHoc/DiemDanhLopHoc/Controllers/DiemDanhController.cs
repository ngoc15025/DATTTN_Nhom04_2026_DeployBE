using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using DiemDanhLopHoc.DTOs;
using System.Security.Cryptography;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DiemDanhController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DiemDanhController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Lấy thống kê và lịch sử điểm danh của sinh viên
        [HttpGet("student/{maSv}")]
        public async Task<IActionResult> GetStudentAttendance(string maSv)
        {
            var history = await _context.DiemDanhs
                .Where(d => d.MaSv == maSv)
                .Include(d => d.MaBuoiHocNavigation)
                    .ThenInclude(b => b.MaLopNavigation)
                        .ThenInclude(l => l.MaMonNavigation)
                .OrderByDescending(d => d.ThoiGianQuet)
                .Select(d => new DiemDanhDto
                {
                    MaDiemDanh = d.MaDiemDanh,
                    MaBuoiHoc = d.MaBuoiHoc,
                    MaSv = d.MaSv,
                    TrangThai = d.TrangThai,
                    ThoiGianQuet = d.ThoiGianQuet,
                    GhiChu = d.GhiChu,
                    TenMon = d.MaBuoiHocNavigation.MaLopNavigation.MaMonNavigation.TenMon,
                    NgayHoc = d.MaBuoiHocNavigation.NgayHoc
                })
                .ToListAsync();

            return Ok(history);
        }

        // 2. Chấm điểm danh (Dùng cho QR quét từ SV — Có xác thực chữ ký số ECDSA)
        [HttpPost("submit")]
        public async Task<IActionResult> Submit([FromBody] SubmitDiemDanhDto request)
        {
            var buoiHoc = await _context.BuoiHocs.FindAsync(request.MaBuoiHoc);
            if (buoiHoc == null) return NotFound(new { message = "Không tìm thấy buổi học." });

            // Kiểm tra buổi học có đang mở QR chưa (TrangThaiBh == 1)
            if (buoiHoc.TrangThaiBh != 1)
                return BadRequest(new { message = "Buổi học này chưa mở điểm danh hoặc đã chốt sổ. Vui lòng liên hệ giảng viên." });

            // Kiểm tra xem đã điểm danh buổi này chưa
            var tonTai = await _context.DiemDanhs
                .AnyAsync(d => d.MaBuoiHoc == request.MaBuoiHoc && d.MaSv == request.MaSv);
            if (tonTai) return BadRequest(new { message = "Bạn đã điểm danh buổi học này rồi!" });

            bool isGpsFraud = false;
            bool isDeviceFraud = false;
            string deviceErrorMessage = null;

            // ==== KIỂM TRA ĐỊA LÝ (GPS) BÁN KÍNH 60 MÉT ====
            double? calculatedDistance = null;
            if (buoiHoc.ToaDoGocLat.HasValue && buoiHoc.ToaDoGocLong.HasValue && request.Lat.HasValue && request.Long.HasValue)
            {
                var rawDistance = CalculateDistance(buoiHoc.ToaDoGocLat.Value, buoiHoc.ToaDoGocLong.Value, request.Lat.Value, request.Long.Value);
                if (rawDistance > 60)
                {
                    isGpsFraud = true;
                }
                // Bù trừ sai số 32m cho phần hiển thị và ghi log
                calculatedDistance = Math.Max(0, Math.Round(rawDistance - 32));
            }

            // ==== XÁC THỰC CHỮ KÝ SỐ ECDSA ====
            var sinhVien = await _context.SinhViens.FindAsync(request.MaSv);
            if (sinhVien == null)
                return NotFound(new { message = "Không tìm thấy sinh viên." });

            if (string.IsNullOrEmpty(sinhVien.MaThietBi))
            {
                isDeviceFraud = true;
                deviceErrorMessage = "Thiết bị chưa được đăng ký. Vui lòng đăng xuất và đăng nhập lại.";
            }
            else if (string.IsNullOrEmpty(request.Signature) || string.IsNullOrEmpty(request.RawPayload))
            {
                isDeviceFraud = true;
                deviceErrorMessage = "Thiếu chữ ký số. Không thể xác thực thiết bị.";
            }
            else
            {
                var dbData = sinhVien.MaThietBi.Split('|');
                if (dbData.Length != 2)
                {
                    isDeviceFraud = true;
                    deviceErrorMessage = "Dữ liệu thiết bị bị hỏng hoặc theo chuẩn cũ. Vui lòng nhờ Giảng viên reset thiết bị.";
                }
                else
                {
                    string publicKeyDb = dbData[0];
                    string fingerprintDb = dbData[1];

                    try
                    {
                        var payloadObj = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(request.RawPayload);
                        if (!payloadObj.TryGetProperty("Fingerprint", out var fingerprintElement))
                        {
                            isDeviceFraud = true;
                            deviceErrorMessage = "Thiếu vân tay thiết bị trong yêu cầu điểm danh.";
                        }
                        else
                        {
                            string fingerprintHienTai = fingerprintElement.GetString();
                            if (fingerprintDb != fingerprintHienTai)
                            {
                                isDeviceFraud = true;
                                deviceErrorMessage = "Phát hiện nhân bản dữ liệu (LevelDB Hijacking). Môi trường phần cứng không khớp!";
                            }
                            else
                            {
                                // CHỐT CHẶN CHỮ KÝ SỐ
                                var publicKeyBytes = Convert.FromBase64String(publicKeyDb);
                                using var ecdsa = ECDsa.Create();
                                ecdsa.ImportSubjectPublicKeyInfo(publicKeyBytes, out _);

                                var payloadBytes = System.Text.Encoding.UTF8.GetBytes(request.RawPayload);
                                var signatureBytes = Convert.FromBase64String(request.Signature);
                                bool isValid = ecdsa.VerifyData(payloadBytes, signatureBytes, HashAlgorithmName.SHA256);

                                if (!isValid)
                                {
                                    isDeviceFraud = true;
                                    deviceErrorMessage = "Chữ ký số không khớp.";
                                }
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        isDeviceFraud = true;
                        deviceErrorMessage = "Lỗi xác thực hệ thống: " + ex.Message;
                    }
                }
            }

            // ==== TỔNG HỢP VÀ GHI NHẬN ====
            if (isGpsFraud || isDeviceFraud)
            {
                var ghiChuParts = new List<string>();
                if (isGpsFraud && calculatedDistance.HasValue) ghiChuParts.Add($"Gian lận vị trí: Cách phòng học {Math.Round(calculatedDistance.Value)} mét");
                if (isDeviceFraud) ghiChuParts.Add($"Phát hiện gian lận thiết bị ({deviceErrorMessage})");
                
                string ghiChu = string.Join(" | ", ghiChuParts);
                await RecordAttendance(request.MaBuoiHoc, request.MaSv, 5, request.Signature, request.Lat, request.Long, ghiChu);
                
                return StatusCode(403, new { 
                    message = "Phát hiện gian lận điểm danh!", 
                    isGpsFraud = isGpsFraud, 
                    isDeviceFraud = isDeviceFraud, 
                    distance = calculatedDistance.HasValue ? Math.Round(calculatedDistance.Value) : (double?)null 
                });
            }
            // ==== KẾT THÚC XÁC THỰC ====

            await RecordAttendance(request.MaBuoiHoc, request.MaSv, 1, request.Signature, request.Lat, request.Long);

            return Ok(new { success = true, message = "Điểm danh thành công!", distance = calculatedDistance.HasValue ? Math.Round(calculatedDistance.Value) : (double?)null });
        }

        // Hàm phụ dùng chung để ghi nhận điểm danh / gian lận
        private async Task RecordAttendance(int maBuoiHoc, string maSv, int trangThai, string? signature, double? lat, double? lng, string? ghiChu = null)
        {
            var ketQua = new DiemDanh
            {
                MaBuoiHoc = maBuoiHoc,
                MaSv = maSv,
                TrangThai = trangThai,
                ThoiGianQuet = DateTime.Now,
                ToaDoSvLat = lat,
                ToaDoSvLong = lng,
                MaThietBiLog = signature?[..Math.Min(255, signature.Length)],
                GhiChu = ghiChu
            };
            _context.DiemDanhs.Add(ketQua);
            await _context.SaveChangesAsync();
        }

        // 3. Lấy danh sách điểm danh của một buổi học (Dùng cho giảng viên xem sổ tay)
        [HttpGet("session/{maBuoiHoc}")]
        public async Task<IActionResult> GetSessionAttendance(int maBuoiHoc)
        {
            var data = await _context.DiemDanhs
                .Where(d => d.MaBuoiHoc == maBuoiHoc)
                .Select(d => new DiemDanhDto
                {
                    MaDiemDanh = d.MaDiemDanh,
                    MaBuoiHoc = d.MaBuoiHoc,
                    MaSv = d.MaSv,
                    TrangThai = d.TrangThai,
                    ThoiGianQuet = d.ThoiGianQuet,
                    GhiChu = d.GhiChu,
                    MaThietBiLog = d.MaThietBiLog
                })
                .ToListAsync();
            return Ok(data);
        }

        // 4. Lưu/Cập nhật hàng loạt (Giảng viên chốt sổ tay)
        [HttpPost("bulk-update")]
        public async Task<IActionResult> BulkUpdate([FromBody] List<DiemDanhDto> requests)
        {
            foreach (var req in requests)
            {
                var record = await _context.DiemDanhs
                    .FirstOrDefaultAsync(d => d.MaBuoiHoc == req.MaBuoiHoc && d.MaSv == req.MaSv);

                if (record != null)
                {
                    record.TrangThai = req.TrangThai;
                    record.GhiChu = req.GhiChu;
                }
                else
                {
                    _context.DiemDanhs.Add(new DiemDanh
                    {
                        MaBuoiHoc = req.MaBuoiHoc,
                        MaSv = req.MaSv,
                        TrangThai = req.TrangThai,
                        GhiChu = req.GhiChu,
                        ThoiGianQuet = DateTime.Now
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Đã lưu bảng điểm danh!" });
        }

        // 5. Thống kê cho Giảng viên
        [HttpGet("lecturer-stats/{maGv}")]
        public async Task<IActionResult> GetLecturerStats(string maGv)
        {
            // 1. Lấy danh sách lớp của GV kèm theo SV và Buổi học đã chốt
            var lopHocs = await _context.LopHocs
                .Include(l => l.MaSvs)
                .Include(l => l.BuoiHocs)
                .Include(l => l.MaMonNavigation)
                .Where(l => l.MaGv == maGv)
                .ToListAsync();

            var lopIds = lopHocs.Select(l => l.MaLop).ToList();

            // 2. Lấy toàn bộ bản ghi điểm danh của các lớp này
            var allAttendances = await _context.DiemDanhs
                .Where(d => lopIds.Contains(d.MaBuoiHocNavigation.MaLop))
                .ToListAsync();

            // 3. Tính toán Thống kê Tổng quan
            int totalStudentsUnique = lopHocs.SelectMany(l => l.MaSvs).Select(s => s.MaSv).Distinct().Count();
            
            // Tỷ lệ chuyên cần = (Có mặt + Trễ) / Tổng số bản ghi (không tính Gian lận/Vắng)
            var coMatRecords = allAttendances.Count(a => a.TrangThai == 1 || a.TrangThai == 2);
            var totalRecords = allAttendances.Count;
            int avgAttendance = totalRecords == 0 ? 0 : (int)Math.Round((double)coMatRecords * 100 / totalRecords);

            // 4. Tìm kiếm Sinh viên vi phạm ngưỡng 30% (Per Class)
            var warningList = new List<object>();

            foreach (var lop in lopHocs)
            {
                // Các buổi học đã kết thúc (chốt sổ)
                var buoiDaChot = lop.BuoiHocs.Where(b => b.TrangThaiBh == 2).ToList();
                var buoiDaChotIds = buoiDaChot.Select(b => b.MaBuoiHoc).ToList();

                foreach (var sv in lop.MaSvs)
                {
                    // Lấy điểm danh của SV này trong các buổi đã chốt của lớp này
                    var svAttendances = allAttendances
                        .Where(a => a.MaSv == sv.MaSv && buoiDaChotIds.Contains(a.MaBuoiHoc))
                        .ToList();

                    // Đếm vắng thực tế (3: Vắng có phép, 4: Vắng không phép, 5: Gian lận)
                    int vangThucTe = svAttendances.Count(a => a.TrangThai >= 3);

                    // Đếm vắng do "Chưa điểm danh" (Buổi đã chốt nhưng không có record)
                    int chuaDiemDanhCount = buoiDaChot.Count(b => !svAttendances.Any(a => a.MaBuoiHoc == b.MaBuoiHoc));

                    int tongVang = vangThucTe + chuaDiemDanhCount;
                    double tiLe = (double)tongVang / lop.SoBuoiHoc;

                    // Ngưỡng 30%: Nếu vắng quá 30% tổng số buổi môn học
                    if (tiLe > 0.3)
                    {
                        warningList.Add(new
                        {
                            MaSv = sv.MaSv,
                            HoTen = sv.HoLot + " " + sv.TenSv,
                            Lop = sv.Lop, // Lớp sinh hoạt
                            TenLop = lop.TenLop, // Tên lớp học phần/Môn học
                            TenMon = lop.MaMonNavigation?.TenMon,
                            SoBuoiVang = tongVang,
                            TongBuoi = lop.SoBuoiHoc,
                            TiLeVang = Math.Round(tiLe * 100, 1)
                        });
                    }
                }
            }

            // Sắp xếp theo tỷ lệ vắng giảm dần
            var sortedWarningList = warningList
                .Cast<dynamic>()
                .OrderByDescending(x => x.TiLeVang)
                .ToList();

            return Ok(new
            {
                totalStudents = totalStudentsUnique,
                avgAttendance,
                warningStudents = sortedWarningList.Count,
                warningList = sortedWarningList
            });
        }

        // --- Helper: Thuật toán Haversine tính khoảng cách giữa 2 tọa độ GPS (Đơn vị: Mét) ---
        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            var R = 6371e3; // Bán kính Trái đất tính bằng mét
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
                    
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c; // Trả về khoảng cách mét
        }
    }
}
