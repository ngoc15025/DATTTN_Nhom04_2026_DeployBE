namespace DiemDanhLopHoc.DTOs
{
    public class MonHocDTOs
    {

    }

    // ---DTO để nhận và trả dữ liệu (Chống lỗi vòng lặp Swagger) ---
    public class MonHocDto
    {
        public string MaMon { get; set; } = null!;
        public string TenMon { get; set; } = null!;
    }
}
