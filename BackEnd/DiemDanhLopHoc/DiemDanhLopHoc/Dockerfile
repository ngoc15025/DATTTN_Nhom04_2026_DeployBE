# 1. Dùng SDK .NET để Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# 2. Copy file cấu hình và tải thư viện (Chỉ định rõ file)
COPY ["DiemDanhLopHoc.csproj", "./"]
RUN dotnet restore "DiemDanhLopHoc.csproj"

# 3. Copy toàn bộ code còn lại và đóng gói (Ép bỏ qua file .sln)
COPY . .
RUN dotnet publish "DiemDanhLopHoc.csproj" -c Release -o out

# 4. Chuyển sang môi trường Runtime (Siêu nhẹ)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/out .

# 5. Cấu hình Port cho Render
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# 6. Lệnh kích nổ Server
ENTRYPOINT ["dotnet", "DiemDanhLopHoc.dll"]
