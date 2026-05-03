namespace DiemDanhLopHoc.Utils;

/// <summary>
/// Tiện ích mã hóa mật khẩu bằng BCrypt (work factor = 12).
/// BCrypt tự nhúng Salt vào hash — an toàn chống Rainbow Table và Brute Force.
/// </summary>
public static class PasswordUtils
{
    private const int WorkFactor = 12; // Tăng lên 13-14 nếu server mạnh hơn

    /// <summary>Hash mật khẩu thuần túy → chuỗi BCrypt 60 ký tự.</summary>
    public static string Hash(string plainPassword)
        => BCrypt.Net.BCrypt.HashPassword(plainPassword, WorkFactor);

    /// <summary>Kiểm tra mật khẩu người dùng nhập khớp với hash đã lưu hay không.</summary>
    public static bool Verify(string plainPassword, string hashedPassword)
        => BCrypt.Net.BCrypt.Verify(plainPassword, hashedPassword);

    /// <summary>
    /// Nhận diện mật khẩu cũ (plaintext) hay mới (BCrypt hash).
    /// BCrypt hash luôn bắt đầu bằng "$2a$", "$2b$", hoặc "$2y$".
    /// Dùng trong giai đoạn chuyển đổi để tương thích ngược.
    /// </summary>
    public static bool IsHashed(string password)
        => password.StartsWith("$2a$") || password.StartsWith("$2b$") || password.StartsWith("$2y$");
}
