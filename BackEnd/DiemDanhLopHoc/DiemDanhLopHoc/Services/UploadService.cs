using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace DiemDanhLopHoc.Services
{
    public interface IUploadService
    {
        Task<string?> UploadAvatarAsync(IFormFile file, string maSv);
    }

    public class CloudinaryService : IUploadService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            // Đọc config từ appsettings hoặc User Secrets
            var cloudName = config["Cloudinary:CloudName"];
            var apiKey = config["Cloudinary:ApiKey"];
            var apiSecret = config["Cloudinary:ApiSecret"];

            if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
            {
                throw new Exception("Cấu hình Cloudinary chưa đầy đủ (CloudName, ApiKey, ApiSecret).");
            }

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string?> UploadAvatarAsync(IFormFile file, string maSv)
        {
            if (file == null || file.Length == 0) return null;

            // 1. Kiểm tra dung lượng (Tối đa 5MB)
            if (file.Length > 5 * 1024 * 1024)
                throw new Exception("Kích thước ảnh không được vượt quá 5MB.");

            // 2. Kiểm tra đuôi file
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(extension))
                throw new Exception("Chỉ chấp nhận file ảnh định dạng JPG, JPEG, PNG.");

            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                // Folder lưu trữ: DATTTN/Avatars/
                // PublicID: SV_{maSv}_{timestamp} để tránh trùng lặp và lỗi font
                PublicId = $"DATTTN/Avatars/SV_{maSv}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
                
                // Tự động tối ưu hình ảnh (Resize, Crop) - Tập trung vào khuôn mặt
                Transformation = new Transformation()
                    .Width(500).Height(500)
                    .Crop("thumb")
                    .Gravity("face")
                    .Quality("auto")
                    .FetchFormat("auto")
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            // Kiểm tra lỗi từ Cloudinary (fail rõ ràng)
            if (uploadResult.Error != null)
                throw new Exception($"Lỗi Cloudinary: {uploadResult.Error.Message}");

            // Kiểm tra URL trả về có hợp lệ không (đề phòng upload thầm lặng thất bại)
            var secureUrl = uploadResult.SecureUrl?.ToString();
            if (string.IsNullOrEmpty(secureUrl))
                throw new Exception("Upload thất bại: Cloudinary không trả về URL hợp lệ.");

            // Trả về link HTTPS an toàn
            return secureUrl;
        }
    }
}
