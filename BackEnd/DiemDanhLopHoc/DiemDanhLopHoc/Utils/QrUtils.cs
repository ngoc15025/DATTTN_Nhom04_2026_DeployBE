using System;
using System.Security.Cryptography;
using System.Text;

namespace DiemDanhLopHoc.Utils
{
    public static class QrUtils
    {
        // Chìa khóa gốc dùng để băm. Trên thực tế nên để ở appsettings.json
        private const string SecretKey = "STUNexusQRSecret!@#"; 
        
        // Chu kỳ làm mới QR (30 giây)
        private const int StepInSeconds = 30;

        /// <summary>
        /// Tạo một Token ngẫu nhiên nhưng kết nối với thời gian thực cho buổi học đó.
        /// Sinh ra chuỗi Hex dài 16 ký tự.
        /// </summary>
        public static string GenerateQrToken(int maBuoiHoc)
        {
            long currentStep = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / StepInSeconds;
            return CalculateHash(maBuoiHoc, currentStep);
        }

        /// <summary>
        /// Xác thực Token từ sinh viên gửi lên có khớp với Token do hệ thống tính toán ngay lúc này không.
        /// Cho phép trễ 1 chu kỳ (Tối đa chậm 30s) do mạng lag hoặc thao tác chậm.
        /// </summary>
        public static bool ValidateQrToken(int maBuoiHoc, string tokenFromClient)
        {
            long currentStep = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / StepInSeconds;
            
            // So sánh với chu kỳ hiện tại
            if (tokenFromClient == CalculateHash(maBuoiHoc, currentStep)) return true;
            
            // So sánh với 1 chu kỳ trước đó (Bù trừ độ trễ mạng)
            if (tokenFromClient == CalculateHash(maBuoiHoc, currentStep - 1)) return true;
            
            return false;
        }

        private static string CalculateHash(int maBuoiHoc, long step)
        {
            string rawData = $"{maBuoiHoc}-{SecretKey}-{step}";
            using (var sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
                StringBuilder builder = new StringBuilder();
                foreach (var b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString().Substring(0, 16);
            }
        }
    }
}
