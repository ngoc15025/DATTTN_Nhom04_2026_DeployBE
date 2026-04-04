# 1. Dùng SDK .NET 8.0 để Build (Môi trường thợ xây)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# 2. Copy file cấu hình và tải thư viện (Restore)
COPY ["DiemDanhLopHoc.csproj", "./"]
RUN dotnet restore "./DiemDanhLopHoc.csproj"

# 3. Copy toàn bộ code còn lại và đóng gói (Publish)
COPY . .
RUN dotnet publish "DiemDanhLopHoc.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 4. Chuyển sang môi trường Runtime (Siêu nhẹ, chỉ để chạy app)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# 5. Cấu hình Port cho Render (Thường xài 8080)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# 6. Lệnh kích nổ Server
ENTRYPOINT ["dotnet", "DiemDanhLopHoc.dll"]