import axios from 'axios';

const axiosClient = axios.create({
    // Prefer Vite env config; fallback to deployed backend
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://diemdanhlophoc.onrender.com/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Tự động kẹp Token vào mọi request gửi đi
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor: Xử lý response lỗi 401 (Token hết hạn) -> Tự động đá ra Login
// Ngoại lệ: Không redirect khi 401 đến từ /auth/login (đó là sai mật khẩu, không phải token hết hạn)
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginEndpoint = error.config?.url?.includes('/auth/login');
        if (error.response && error.response.status === 401 && !isLoginEndpoint) {
            localStorage.removeItem('token');
            localStorage.removeItem('stu_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosClient;

