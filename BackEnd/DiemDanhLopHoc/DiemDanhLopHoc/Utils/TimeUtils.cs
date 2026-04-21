using System;

namespace DiemDanhLopHoc.Utils
{
    public static class TimeUtils
    {
        /// <summary>
        /// Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7).
        /// </summary>
        /// <returns>DateTime theo giờ Việt Nam</returns>
        public static DateTime GetVietnamTime()
        {
            var utcNow = DateTime.UtcNow;
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(utcNow, vietnamTimeZone);
        }
    }
}
