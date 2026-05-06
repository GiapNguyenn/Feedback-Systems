import axios from 'axios';
import toast from 'react-hot-toast';

// Tạo một instance của axios
const instance = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// TRẠM KIỂM SOÁT ĐẦU RA (Interceptors Response)
instance.interceptors.response.use(
    (response) => {
        // Nếu phản hồi thành công, cứ cho nó đi qua
        return response;
    },
    (error) => {
        // Nếu lỗi là 401 (Unauthorized) - Nghĩa là Token hết hạn hoặc sai
        if (error.response && error.response.status === 401) {
            
            // 1. Xóa sạch dữ liệu đăng nhập
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // 2. Thông báo cho người dùng
            toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");

            // 3. Đợi 2 giây rồi tự động load lại trang về màn hình Login
            setTimeout(() => {
                window.location.href = '/'; 
            }, 2000);
        }
        return Promise.reject(error);
    }
);

export default instance;