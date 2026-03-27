using System;
using System.Collections.Generic;
using DiemDanhLopHoc.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace DiemDanhLopHoc.Data
{
    public partial class AppDbContext : DbContext
    {
        public AppDbContext()
        {
        }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public virtual DbSet<BuoiHoc> BuoiHocs { get; set; } = null!;
        public virtual DbSet<DiemDanh> DiemDanhs { get; set; } = null!;
        public virtual DbSet<GiangVien> GiangViens { get; set; } = null!;
        public virtual DbSet<LopHoc> LopHocs { get; set; } = null!;
        public virtual DbSet<MonHoc> MonHocs { get; set; } = null!;
        public virtual DbSet<QuanTriVien> QuanTriViens { get; set; } = null!;
        public virtual DbSet<SinhVien> SinhViens { get; set; } = null!;


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<BuoiHoc>(entity =>
            {
                entity.HasKey(e => e.MaBuoiHoc)
                    .HasName("PK__BuoiHoc__53302506DB4E7FF7");

                entity.ToTable("BuoiHoc");

                entity.Property(e => e.GhiChu).HasMaxLength(255);

                entity.Property(e => e.MaLop)
                    .HasMaxLength(20)
                    .IsUnicode(false);

                entity.Property(e => e.NgayHoc)
                    .HasColumnType("date")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.ToaDoGocLat).HasColumnName("ToaDoGoc_Lat");

                entity.Property(e => e.ToaDoGocLong).HasColumnName("ToaDoGoc_Long");

                entity.HasOne(d => d.MaLopNavigation)
                    .WithMany(p => p.BuoiHocs)
                    .HasForeignKey(d => d.MaLop)
                    .HasConstraintName("FK__BuoiHoc__MaLop__5DCAEF64");
            });

            modelBuilder.Entity<DiemDanh>(entity =>
            {
                entity.HasKey(e => e.MaDiemDanh)
                    .HasName("PK__DiemDanh__1512439DE12310E5");

                entity.ToTable("DiemDanh");

                entity.HasIndex(e => new { e.MaBuoiHoc, e.MaSv }, "UNIQUE_SV_PER_SESSION")
                    .IsUnique();

                entity.Property(e => e.FingerprintId)
                    .HasMaxLength(255)
                    .IsUnicode(false)
                    .HasColumnName("FingerprintID");

                entity.Property(e => e.GhiChu).HasMaxLength(255);

                entity.Property(e => e.MaSv)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasColumnName("MaSV");

                entity.Property(e => e.NguoiCapNhat).HasMaxLength(100);

                entity.Property(e => e.ThoiGianQuet)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("(getdate())");

                entity.Property(e => e.ToaDoSvLat).HasColumnName("ToaDoSV_Lat");

                entity.Property(e => e.ToaDoSvLong).HasColumnName("ToaDoSV_Long");

                entity.Property(e => e.TrangThai).HasMaxLength(50);

                entity.HasOne(d => d.MaBuoiHocNavigation)
                    .WithMany(p => p.DiemDanhs)
                    .HasForeignKey(d => d.MaBuoiHoc)
                    .HasConstraintName("FK__DiemDanh__MaBuoi__628FA481");

                entity.HasOne(d => d.MaSvNavigation)
                    .WithMany(p => p.DiemDanhs)
                    .HasForeignKey(d => d.MaSv)
                    .HasConstraintName("FK__DiemDanh__MaSV__6383C8BA");
            });

            modelBuilder.Entity<GiangVien>(entity =>
            {
                entity.HasKey(e => e.MaGv)
                    .HasName("PK__GiangVie__2725AEF31AD7ABCD");

                entity.ToTable("GiangVien");

                entity.HasIndex(e => e.TaiKhoan, "UQ__GiangVie__D5B8C7F098929665")
                    .IsUnique();

                entity.Property(e => e.MaGv)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasColumnName("MaGV");

                entity.Property(e => e.Email)
                    .HasMaxLength(100)
                    .IsUnicode(false);

                entity.Property(e => e.HoTen).HasMaxLength(100);

                entity.Property(e => e.MatKhau)
                    .HasMaxLength(255)
                    .IsUnicode(false);

                entity.Property(e => e.SoDienThoai)
                    .HasMaxLength(15)
                    .IsUnicode(false);

                entity.Property(e => e.TaiKhoan)
                    .HasMaxLength(50)
                    .IsUnicode(false);

                entity.Property(e => e.TrangThai).HasDefaultValueSql("((1))");
            });

            modelBuilder.Entity<LopHoc>(entity =>
            {
                entity.HasKey(e => e.MaLop)
                    .HasName("PK__LopHoc__3B98D273416D2153");

                entity.ToTable("LopHoc");

                entity.Property(e => e.MaLop)
                    .HasMaxLength(20)
                    .IsUnicode(false);

                entity.Property(e => e.MaGv)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasColumnName("MaGV");

                entity.Property(e => e.MaMon)
                    .HasMaxLength(20)
                    .IsUnicode(false);

                entity.Property(e => e.TenLop).HasMaxLength(100);

                entity.HasOne(d => d.MaGvNavigation)
                    .WithMany(p => p.LopHocs)
                    .HasForeignKey(d => d.MaGv)
                    .HasConstraintName("FK__LopHoc__MaGV__571DF1D5");

                entity.HasOne(d => d.MaMonNavigation)
                    .WithMany(p => p.LopHocs)
                    .HasForeignKey(d => d.MaMon)
                    .HasConstraintName("FK__LopHoc__MaMon__5629CD9C");

                entity.HasMany(d => d.MaSvs)
                    .WithMany(p => p.MaLops)
                    .UsingEntity<Dictionary<string, object>>(
                        "ChiTietLopHoc",
                        l => l.HasOne<SinhVien>().WithMany().HasForeignKey("MaSv").OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK__ChiTietLop__MaSV__5AEE82B9"),
                        r => r.HasOne<LopHoc>().WithMany().HasForeignKey("MaLop").OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK__ChiTietLo__MaLop__59FA5E80"),
                        j =>
                        {
                            j.HasKey("MaLop", "MaSv").HasName("PK__ChiTietL__89EA82F27BDF178C");

                            j.ToTable("ChiTietLopHoc");

                            j.IndexerProperty<string>("MaLop").HasMaxLength(20).IsUnicode(false);

                            j.IndexerProperty<string>("MaSv").HasMaxLength(20).IsUnicode(false).HasColumnName("MaSV");
                        });
            });

            modelBuilder.Entity<MonHoc>(entity =>
            {
                entity.HasKey(e => e.MaMon)
                    .HasName("PK__MonHoc__3A5B29A8C16A6288");

                entity.ToTable("MonHoc");

                entity.Property(e => e.MaMon)
                    .HasMaxLength(20)
                    .IsUnicode(false);

                entity.Property(e => e.TenMon).HasMaxLength(100);
            });

            modelBuilder.Entity<QuanTriVien>(entity =>
            {
                entity.HasKey(e => e.MaQtv)
                    .HasName("PK__QuanTriV__396E99969F0026DB");

                entity.ToTable("QuanTriVien");

                entity.HasIndex(e => e.TaiKhoan, "UQ__QuanTriV__D5B8C7F0B7BF9B4D")
                    .IsUnique();

                entity.Property(e => e.MaQtv)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasColumnName("MaQTV");

                entity.Property(e => e.HoTen).HasMaxLength(100);

                entity.Property(e => e.MatKhau)
                    .HasMaxLength(255)
                    .IsUnicode(false);

                entity.Property(e => e.TaiKhoan)
                    .HasMaxLength(50)
                    .IsUnicode(false);
            });

            modelBuilder.Entity<SinhVien>(entity =>
            {
                entity.HasKey(e => e.MaSv)
                    .HasName("PK__SinhVien__2725081A029383A2");

                entity.ToTable("SinhVien");

                entity.HasIndex(e => e.TaiKhoan, "UQ__SinhVien__D5B8C7F0C0F18CE8")
                    .IsUnique();

                entity.Property(e => e.MaSv)
                    .HasMaxLength(20)
                    .IsUnicode(false)
                    .HasColumnName("MaSV");

                entity.Property(e => e.AnhDaiDien)
                    .HasMaxLength(255)
                    .IsUnicode(false);

                entity.Property(e => e.Email)
                    .HasMaxLength(100)
                    .IsUnicode(false);

                entity.Property(e => e.HoTen).HasMaxLength(100);

                entity.Property(e => e.MatKhau)
                    .HasMaxLength(255)
                    .IsUnicode(false);

                entity.Property(e => e.NgaySinh).HasColumnType("date");

                entity.Property(e => e.SoDienThoai)
                    .HasMaxLength(15)
                    .IsUnicode(false);

                entity.Property(e => e.TaiKhoan)
                    .HasMaxLength(50)
                    .IsUnicode(false);
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
