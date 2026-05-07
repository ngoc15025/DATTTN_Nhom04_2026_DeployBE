using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DiemDanhLopHoc.Data;
using DiemDanhLopHoc.Models;
using DiemDanhLopHoc.DTOs;
using System.Security.Cryptography;
using DiemDanhLopHoc.Utils;
using Microsoft.AspNetCore.Authorization;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Lecturer,Student")]
    public class DiemDanhController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DiemDanhController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Lấy thống kê và lịch sử điểm danh của sinh viên
        // Bao gồm cả buổi đã chốt sổ mà SV chưa điểm danh → hiển thị "Vắng"
        [HttpGet("student/{maSv}")]
        public async Task<IActionResult> GetStudentAttendance(string maSv)
        {
            // Lấy tất cả bản ghi điểm danh có thực của SV
            var existingRecords = await _context.DiemDanhs
                .Where(d => d.MaSv == maSv)
                .Include(d => d.MaBuoiHocNavigation)
                    .ThenInclude(b => b.MaLopNavigation)
                        .ThenInclude(l => l.MaMonNavigation)
                .Select(d => new DiemDanhDto
                {
                    MaDiemDanh = d.MaDiemDanh,
                    MaBuoiHoc   = d.MaBuoiHoc,
                    MaSv        = d.MaSv,
                    TrangThai   = d.TrangThai,
                    ThoiGianQuet = d.ThoiGianQuet,
                    GhiChu      = d.GhiChu,
                    TenMon      = d.MaBuoiHocNavigation.MaLopNavigation.MaMonNavigation.TenMon,
                    NgayHoc     = d.MaBuoiHocNavigation.NgayHoc
                })
                .ToListAsync();

            // Tập hợp các buổi SV đã có bản ghi (để loại trừ khi tạo "vắng ảo")
            var recordedSessionIds = existingRecords.Select(r => r.MaBuoiHoc).ToHashSet();

            // Tìm các lớp SV đang tham gia
            var maLopList = await _context.LopHocs
                .Where(l => l.MaSvs.Any(sv => sv.MaSv == maSv))
                .Select(l => l.MaLop)
                .ToListAsync();

            // Tìm các buổi học đã CHỐT SỔ (TrangThaiBh = 2) mà SV CHƯA có bản ghi điểm danh
            var missedSessions = await (
                from bh in _context.BuoiHocs
                join lh in _context.LopHocs on bh.MaLop equals lh.MaLop
                join mh in _context.MonHocs on lh.MaMon equals mh.MaMon into mhJoin
                from mh in mhJoin.DefaultIfEmpty()
                where maLopList.Contains(bh.MaLop)
                   && bh.TrangThaiBh == 2                          // Buổi đã chốt sổ
                   && bh.LoaiBuoiHoc != 2                          // Không phải buổi báo nghỉ
                   && !recordedSessionIds.Contains(bh.MaBuoiHoc)  // SV chưa có bản ghi
                select new DiemDanhDto
                {
                    MaDiemDanh   = 0,               // Không có ID thực
                    MaBuoiHoc    = bh.MaBuoiHoc,
                    MaSv         = maSv,
                    TrangThai    = 4,               // 4 = Vắng không phép
                    ThoiGianQuet = null,
                    GhiChu       = "Vắng – Không điểm danh trước khi giảng viên chốt sổ.",
                    TenMon       = mh != null ? mh.TenMon : null,
                    NgayHoc      = bh.NgayHoc
                }
            ).ToListAsync();

            // Gộp và sắp xếp theo ngày giảm dần
            var fullHistory = existingRecords
                .Concat(missedSessions)
                .OrderByDescending(d => d.NgayHoc)
                .ToList();

            return Ok(fullHistory);
        }



        // Hàm phụ dùng chung để ghi nhận điểm danh / gian lận
        private async Task RecordAttendance(int maBuoiHoc, string maSv, int trangThai, string? signature, double? lat, double? lng, string? ghiChu = null)
        {
            var ketQua = new DiemDanh
            {
                MaBuoiHoc = maBuoiHoc,
                MaSv = maSv,
                TrangThai = trangThai,
                ThoiGianQuet = TimeUtils.GetVietnamTime(),
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
                        ThoiGianQuet = TimeUtils.GetVietnamTime()
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

            // 2. Lấy toàn bộ bản ghi điểm danh của các lớp này (Chỉ lấy từ các buổi đã chốt và không báo nghỉ)
            var allAttendances = await _context.DiemDanhs
                .Include(d => d.MaBuoiHocNavigation)
                .Where(d => lopIds.Contains(d.MaBuoiHocNavigation.MaLop) 
                         && d.MaBuoiHocNavigation.TrangThaiBh == 2 
                         && d.MaBuoiHocNavigation.LoaiBuoiHoc != 2)
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
                // Các buổi học đã kết thúc (chốt sổ) và không bị báo nghỉ
                var buoiDaChot = lop.BuoiHocs.Where(b => b.TrangThaiBh == 2 && b.LoaiBuoiHoc != 2).ToList();
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
