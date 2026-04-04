# 1. Dùng ảnh SDK để build code
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy file .csproj và restore các thư viện (nuget)
COPY *.csproj ./
RUN dotnet restore

# Copy toàn bộ code còn lại và build bản Release
COPY . ./
RUN dotnet publish -c Release -o out

# 2. Dùng ảnh ASP.NET siêu nhẹ để chạy thực tế
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Mở cổng 8080 (Mặc định của .NET 8 trên Linux/Docker)
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Lệnh khởi động server
ENTRYPOINT ["dotnet", "DiemDanhLopHoc.dll"]
