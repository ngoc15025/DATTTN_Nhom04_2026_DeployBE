using ClosedXML.Excel;
using DiemDanhLopHoc.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiemDanhLopHoc.Controllers
{
    [Route("api/excel")]
    [ApiController]
    public class ExcelExportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExcelExportController(AppDbContext context)
        {
            _context = context;
        }

        private string GetStatusText(int status)
        {
            return status switch
            {
                1 => "Có mặt",
                2 => "Đi trễ",
                3 => "Vắng có phép",
                4 => "Vắng không phép",
                5 => "Lỗi xác thực",
                _ => "Chưa xác định"
            };
        }

        private XLColor GetStatusColor(int status)
        {
            return status switch
            {
                1 => XLColor.SeaGreen,       // Có mặt
                2 => XLColor.Orange,         // Đi trễ
                3 => XLColor.LightBlue,      // Vắng có phép
                4 => XLColor.Red,            // Vắng không phép
                5 => XLColor.DarkRed,        // Gian lận
                _ => XLColor.Black
            };
        }

        // 1. Xuất Excel từng buổi học
        [HttpGet("session/{maBuoiHoc}")]
        public async Task<IActionResult> ExportSessionExcel(int maBuoiHoc)
        {
            var buoiHoc = await _context.BuoiHocs
                .Include(b => b.MaLopNavigation)
                    .ThenInclude(l => l.MaMonNavigation)
                .Include(b => b.MaLopNavigation)
                    .ThenInclude(l => l.MaGvNavigation)
                .FirstOrDefaultAsync(b => b.MaBuoiHoc == maBuoiHoc);

            if (buoiHoc == null) return NotFound("Không tìm thấy buổi học.");

            var diemDanhs = await _context.DiemDanhs
                .Include(d => d.MaSvNavigation)
                .Where(d => d.MaBuoiHoc == maBuoiHoc)
                .ToListAsync();

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Danh sách điểm danh");

                // Tiêu đề
                worksheet.Cell(1, 1).Value = "KẾT QUẢ ĐIỂM DANH BUỔI HỌC";
                worksheet.Cell(1, 1).Style.Font.Bold = true;
                worksheet.Cell(1, 1).Style.Font.FontSize = 16;
                worksheet.Range(1, 1, 1, 7).Merge();
                worksheet.Cell(1, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(2, 1).Value = $"Lớp: {buoiHoc.MaLopNavigation.TenLop} ({buoiHoc.MaLop})";
                worksheet.Cell(2, 5).Value = $"Môn: {buoiHoc.MaLopNavigation.MaMonNavigation.TenMon}";
                worksheet.Cell(3, 1).Value = $"Ngày học: {buoiHoc.NgayHoc:dd/MM/yyyy}";
                worksheet.Cell(3, 5).Value = $"Giảng viên: {buoiHoc.MaLopNavigation.MaGvNavigation.HoLot} {buoiHoc.MaLopNavigation.MaGvNavigation.TenGv}";

                // Header bảng
                string[] headers = { "STT", "Mã SV", "Họ Tên", "Lớp", "Trạng Thái", "Thời Gian", "Ghi Chú" };
                for (int i = 0; i < headers.Length; i++)
                {
                    var cell = worksheet.Cell(5, i + 1);
                    cell.Value = headers[i];
                    cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#4F81BD");
                    cell.Style.Font.FontColor = XLColor.White;
                    cell.Style.Font.Bold = true;
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                }

                // Dữ liệu
                int row = 6;
                int stt = 1;
                foreach (var dd in diemDanhs)
                {
                    worksheet.Cell(row, 1).Value = stt++;
                    worksheet.Cell(row, 2).Value = dd.MaSv;
                    worksheet.Cell(row, 3).Value = dd.MaSvNavigation.HoLot + " " + dd.MaSvNavigation.TenSv;
                    worksheet.Cell(row, 4).Value = dd.MaSvNavigation.Lop;
                    
                    var statusCell = worksheet.Cell(row, 5);
                    statusCell.Value = GetStatusText(dd.TrangThai);
                    statusCell.Style.Font.FontColor = GetStatusColor(dd.TrangThai);
                    statusCell.Style.Font.Bold = true;

                    worksheet.Cell(row, 6).Value = dd.ThoiGianQuet?.ToString("HH:mm:ss") ?? "-";
                    worksheet.Cell(row, 7).Value = dd.GhiChu;
                    row++;
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var content = stream.ToArray();
                    string fileName = $"DiemDanh_{buoiHoc.MaLop}_{buoiHoc.NgayHoc:dd-MM-yyyy}.xlsx";
                    return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
        }

        // 2. Xuất Excel toàn kỳ học (Matrix)
        [HttpGet("class/{maLop}")]
        public async Task<IActionResult> ExportClassExcel(string maLop)
        {
            var lop = await _context.LopHocs
                .Include(l => l.MaGvNavigation)
                .Include(l => l.MaMonNavigation)
                .Include(l => l.MaSvs)
                .Include(l => l.BuoiHocs)
                .FirstOrDefaultAsync(l => l.MaLop == maLop);

            if (lop == null) return NotFound("Không tìm thấy lớp học.");

            var buoiHocs = lop.BuoiHocs.OrderBy(b => b.NgayHoc).ToList();
            var buoiHocIds = buoiHocs.Select(b => b.MaBuoiHoc).ToList();

            var allAttendances = await _context.DiemDanhs
                .Where(d => buoiHocIds.Contains(d.MaBuoiHoc))
                .ToListAsync();

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Báo cáo chuyên cần");

                // Tiêu đề
                worksheet.Cell(1, 1).Value = "BÁO CÁO CHUYÊN CẦN TOÀN KỲ HỌC";
                worksheet.Cell(1, 1).Style.Font.Bold = true;
                worksheet.Cell(1, 1).Style.Font.FontSize = 16;
                int totalCols = 5 + buoiHocs.Count + 2;
                worksheet.Range(1, 1, 1, totalCols).Merge();
                worksheet.Cell(1, 1).Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                worksheet.Cell(2, 1).Value = $"Lớp học phần: {lop.TenLop} ({lop.MaLop})";
                worksheet.Cell(2, 5).Value = $"Môn: {lop.MaMonNavigation.TenMon}";
                worksheet.Cell(3, 1).Value = $"Giảng viên: {lop.MaGvNavigation.HoLot} {lop.MaGvNavigation.TenGv}";
                worksheet.Cell(3, 5).Value = $"Tổng số buổi dự kiến: {lop.SoBuoiHoc}";

                // Header
                worksheet.Cell(5, 1).Value = "STT";
                worksheet.Cell(5, 2).Value = "Mã SV";
                worksheet.Cell(5, 3).Value = "Họ Tên";
                worksheet.Cell(5, 4).Value = "Lớp";

                int col = 5;
                foreach (var bh in buoiHocs)
                {
                    var cell = worksheet.Cell(5, col);
                    cell.Value = bh.NgayHoc.ToString("dd/MM");
                    cell.Style.Alignment.TextRotation = 45;
                    col++;
                }

                worksheet.Cell(5, col).Value = "Tổng Vắng";
                worksheet.Cell(5, col + 1).Value = "Tỷ lệ (%)";
                worksheet.Cell(5, col + 2).Value = "Kết quả";

                var headerRange = worksheet.Range(5, 1, 5, col + 2);
                headerRange.Style.Fill.BackgroundColor = XLColor.FromHtml("#4F81BD");
                headerRange.Style.Font.FontColor = XLColor.White;
                headerRange.Style.Font.Bold = true;
                headerRange.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

                // Dữ liệu sinh viên
                int row = 6;
                int stt = 1;
                foreach (var sv in lop.MaSvs.OrderBy(s => s.MaSv))
                {
                    worksheet.Cell(row, 1).Value = stt++;
                    worksheet.Cell(row, 2).Value = sv.MaSv;
                    worksheet.Cell(row, 3).Value = sv.HoLot + " " + sv.TenSv;
                    worksheet.Cell(row, 4).Value = sv.Lop;

                    int vangCount = 0;
                    int subCol = 5;

                    foreach (var bh in buoiHocs)
                    {
                        var attendance = allAttendances.FirstOrDefault(a => a.MaSv == sv.MaSv && a.MaBuoiHoc == bh.MaBuoiHoc);
                        var cell = worksheet.Cell(row, subCol);

                        if (attendance == null) // Chưa điểm danh hoặc vắng
                        {
                            if (bh.TrangThaiBh == 2) // Nếu buổi đã chốt mà ko có record -> Vắng
                            {
                                cell.Value = "V";
                                cell.Style.Font.FontColor = XLColor.Red;
                                vangCount++;
                            }
                            else
                            {
                                cell.Value = "-";
                            }
                        }
                        else
                        {
                            // 1,2: Có mặt/Trễ | 3,4,5: Vắng/Gian lận
                            if (attendance.TrangThai <= 2)
                            {
                                cell.Value = attendance.TrangThai == 1 ? "x" : "T";
                                cell.Style.Font.FontColor = attendance.TrangThai == 1 ? XLColor.SeaGreen : XLColor.Orange;
                            }
                            else
                            {
                                cell.Value = "V";
                                cell.Style.Font.FontColor = XLColor.Red;
                                vangCount++;
                            }
                        }
                        cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                        subCol++;
                    }

                    worksheet.Cell(row, subCol).Value = vangCount;
                    double rate = (double)vangCount / lop.SoBuoiHoc;
                    worksheet.Cell(row, subCol + 1).Value = Math.Round(rate * 100, 1);
                    
                    var resultCell = worksheet.Cell(row, subCol + 2);
                    if (rate > 0.3)
                    {
                        resultCell.Value = "CẤM THI";
                        resultCell.Style.Font.FontColor = XLColor.Red;
                        resultCell.Style.Font.Bold = true;
                    }
                    else
                    {
                        resultCell.Value = "Đạt";
                        resultCell.Style.Font.FontColor = XLColor.Black;
                    }

                    row++;
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var content = stream.ToArray();
                    string fileName = $"BaoCao_ToanKy_{lop.MaLop}.xlsx";
                    return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
                }
            }
        }
    }
}
