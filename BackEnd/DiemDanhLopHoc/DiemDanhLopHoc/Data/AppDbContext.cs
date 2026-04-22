using System;
using System.Collections.Generic;
using DiemDanhLopHoc.Models;
using Microsoft.EntityFrameworkCore;

namespace DiemDanhLopHoc.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<BuoiHoc> BuoiHocs { get; set; }

    public virtual DbSet<DiemDanh> DiemDanhs { get; set; }

    public virtual DbSet<GiangVien> GiangViens { get; set; }

    public virtual DbSet<LopHoc> LopHocs { get; set; }

    public virtual DbSet<MonHoc> MonHocs { get; set; }

    public virtual DbSet<QuanTriVien> QuanTriViens { get; set; }

    public virtual DbSet<SinhVien> SinhViens { get; set; }

    public virtual DbSet<PhanHoi> PhanHois { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Connection string should be configured in Program.cs
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BuoiHoc>(entity =>
        {
            entity.HasKey(e => e.MaBuoiHoc).HasName("PK__BuoiHoc__533025067355E7FE");

            entity.ToTable("BuoiHoc");

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.LoaiBuoiHoc).HasDefaultValue(0);
            entity.Property(e => e.MaLop)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.ToaDoGocLat).HasColumnName("ToaDoGoc_Lat");
            entity.Property(e => e.ToaDoGocLong).HasColumnName("ToaDoGoc_Long");
            entity.Property(e => e.TrangThaiBh)
                .HasDefaultValue(0)
                .HasColumnName("TrangThaiBH");

            entity.HasOne(d => d.MaLopNavigation).WithMany(p => p.BuoiHocs)
                .HasForeignKey(d => d.MaLop)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BuoiHoc_LopHoc");
        });

        modelBuilder.Entity<DiemDanh>(entity =>
        {
            entity.HasKey(e => e.MaDiemDanh).HasName("PK__DiemDanh__1512439D0FCD14EC");

            entity.ToTable("DiemDanh");

            entity.HasIndex(e => new { e.MaBuoiHoc, e.MaSv }, "UQ_DiemDanh_1Lan").IsUnique();

            entity.Property(e => e.GhiChu).HasMaxLength(500);
            entity.Property(e => e.MaSv)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("MaSV");
            entity.Property(e => e.MaThietBiLog)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("MaThietBi_Log");
            entity.Property(e => e.NguoiCapNhat)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.ThoiGianQuet).HasColumnType("datetime");
            entity.Property(e => e.ToaDoSvLat).HasColumnName("ToaDoSV_Lat");
            entity.Property(e => e.ToaDoSvLong).HasColumnName("ToaDoSV_Long");

            entity.HasOne(d => d.MaBuoiHocNavigation).WithMany(p => p.DiemDanhs)
                .HasForeignKey(d => d.MaBuoiHoc)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DiemDanh_BuoiHoc");

            entity.HasOne(d => d.MaSvNavigation).WithMany(p => p.DiemDanhs)
                .HasForeignKey(d => d.MaSv)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_DiemDanh_SinhVien");
        });

        modelBuilder.Entity<GiangVien>(entity =>
        {
            entity.HasKey(e => e.MaGv).HasName("PK__GiangVie__2725AEF3F2B37CCE");

            entity.ToTable("GiangVien");

            entity.HasIndex(e => e.TaiKhoan, "UQ__GiangVie__D5B8C7F0AB80B9CC").IsUnique();

            entity.Property(e => e.MaGv)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("MaGV");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.HoLot).HasMaxLength(50);
            entity.Property(e => e.MatKhau)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.SoDienThoai)
                .HasMaxLength(15)
                .IsUnicode(false);
            entity.Property(e => e.TaiKhoan)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.TenGv)
                .HasMaxLength(50)
                .HasColumnName("TenGV");
            entity.Property(e => e.TrangThai).HasDefaultValue(1);
        });

        modelBuilder.Entity<LopHoc>(entity =>
        {
            entity.HasKey(e => e.MaLop).HasName("PK__LopHoc__3B98D27371942026");

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
            entity.Property(e => e.TenLop).HasMaxLength(150);

            entity.HasOne(d => d.MaGvNavigation).WithMany(p => p.LopHocs)
                .HasForeignKey(d => d.MaGv)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LopHoc_GiangVien");

            entity.HasOne(d => d.MaMonNavigation).WithMany(p => p.LopHocs)
                .HasForeignKey(d => d.MaMon)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_LopHoc_MonHoc");

            entity.HasMany(d => d.MaSvs).WithMany(p => p.MaLops)
                .UsingEntity<Dictionary<string, object>>(
                    "ChiTietLopHoc",
                    r => r.HasOne<SinhVien>().WithMany()
                        .HasForeignKey("MaSv")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_CTLH_SinhVien"),
                    l => l.HasOne<LopHoc>().WithMany()
                        .HasForeignKey("MaLop")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_CTLH_LopHoc"),
                    j =>
                    {
                        j.HasKey("MaLop", "MaSv").HasName("PK__ChiTietL__89EA82F26A5413D2");
                        j.ToTable("ChiTietLopHoc");
                        j.IndexerProperty<string>("MaLop")
                            .HasMaxLength(20)
                            .IsUnicode(false);
                        j.IndexerProperty<string>("MaSv")
                            .HasMaxLength(20)
                            .IsUnicode(false)
                            .HasColumnName("MaSV");
                    });
        });

        modelBuilder.Entity<MonHoc>(entity =>
        {
            entity.HasKey(e => e.MaMon).HasName("PK__MonHoc__3A5B29A8EAB3EDF0");

            entity.ToTable("MonHoc");

            entity.Property(e => e.MaMon)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.TenMon).HasMaxLength(150);
        });

        modelBuilder.Entity<QuanTriVien>(entity =>
        {
            entity.HasKey(e => e.MaQtv).HasName("PK__QuanTriV__396E9996F07A481F");

            entity.ToTable("QuanTriVien");

            entity.HasIndex(e => e.TaiKhoan, "UQ__QuanTriV__D5B8C7F03A5C8966").IsUnique();

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
            entity.HasKey(e => e.MaSv).HasName("PK__SinhVien__2725081A32C383A8");

            entity.ToTable("SinhVien");

            entity.HasIndex(e => e.TaiKhoan, "UQ__SinhVien__D5B8C7F0456AB461").IsUnique();

            entity.Property(e => e.MaSv)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("MaSV");
            entity.Property(e => e.AnhDaiDien); // Không giới hạn độ dài (NVARCHAR(MAX)) để lưu Base64
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.HoLot).HasMaxLength(50);
            entity.Property(e => e.Lop)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.PasskeyCredentialId);
            entity.Property(e => e.PasskeyPublicKey);
            entity.Property(e => e.PasskeySignCount);
            entity.Property(e => e.PasskeyUserHandle);
            entity.Property(e => e.MatKhau)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.SoDienThoai)
                .HasMaxLength(15)
                .IsUnicode(false);
            entity.Property(e => e.TaiKhoan)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.TenSv)
                .HasMaxLength(50)
                .HasColumnName("TenSV");
        });

        modelBuilder.Entity<PhanHoi>(entity =>
        {
            entity.HasKey(e => e.MaPhanHoi);
            entity.ToTable("PhanHoi");

            entity.Property(e => e.NoiDung).HasMaxLength(1000);
            entity.Property(e => e.PhanHoiGv).HasMaxLength(1000);
            entity.Property(e => e.ThoiGianGui).HasColumnType("datetime");
            entity.Property(e => e.TrangThai).HasDefaultValue(0);

            entity.HasOne(d => d.MaDiemDanhNavigation)
                .WithMany(p => p.PhanHois)
                .HasForeignKey(d => d.MaDiemDanh)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_PhanHoi_DiemDanh");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
