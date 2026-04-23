using System;
using System.Collections.Generic;

namespace DiemDanhLopHoc.Models;

public partial class SinhVien
{
    public string MaSv { get; set; } = null!;

    public string TaiKhoan { get; set; } = null!;

    public string MatKhau { get; set; } = null!;

    public string HoLot { get; set; } = null!;

    public string TenSv { get; set; } = null!;

    public string Lop { get; set; } = null!;

    public string? Email { get; set; }

    public string? SoDienThoai { get; set; }

    public byte[]? PasskeyCredentialId { get; set; }

    public byte[]? PasskeyPublicKey { get; set; }

    public long? PasskeySignCount { get; set; } // Dùng long để tương thích với SQL BIGINT/INT

    public byte[]? PasskeyUserHandle { get; set; }

    // Định danh trình duyệt/thiết bị - Chốt chặn 1 máy 1 sinh viên
    public string? DeviceUUID { get; set; }

    public string? AnhDaiDien { get; set; }

    public virtual ICollection<DiemDanh> DiemDanhs { get; set; } = new List<DiemDanh>();

    public virtual ICollection<LopHoc> MaLops { get; set; } = new List<LopHoc>();
}
