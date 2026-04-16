using System;
using System.Collections.Generic;

namespace DiemDanhLopHoc.DTOs
{
    public class AdminDashboardStatsDto
    {
        public int TotalStudents { get; set; }
        public int TotalLecturers { get; set; }
        public int TotalClasses { get; set; }
        public int TodayAttendance { get; set; }
        public List<RecentActivityDto> RecentActivities { get; set; } = new();
    }

    public class RecentActivityDto
    {
        public string StudentName { get; set; } = null!;
        public string StudentId { get; set; } = null!;
        public string SubjectName { get; set; } = null!;
        public string ClassId { get; set; } = null!;
        public int Status { get; set; }
        public DateTime? Time { get; set; }
        public string? Note { get; set; }
    }
}
