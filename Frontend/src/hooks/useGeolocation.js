// src/hooks/useGeolocation.js
import { useState, useCallback } from 'react';

/**
 * Custom Hook để lấy vị trí GPS hiện tại của trình duyệt.
 * @returns {object} { location: {lat, lng} | null, error: string, isLoading: boolean, getLocation: function }
 */
const useGeolocation = () => {
    const [location, setLocation] = useState(null); // { lat, lng }
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Callback xử lý khi lấy vị trí thành công
    const handleSuccess = (position) => {
        setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        });
        setIsLoading(false);
    };

    // Callback xử lý khi lấy vị trí thất bại hoặc bị từ chối
    const handleError = (err) => {
        setIsLoading(false);
        let msg = "Could not retrieve location.";
        
        if (err.code === err.PERMISSION_DENIED) {
            msg = "Lỗi: Bạn đã từ chối cấp quyền truy cập vị trí. Vui lòng cho phép để tiếp tục.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = "Lỗi: Vị trí không xác định được.";
        } else if (err.code === err.TIMEOUT) {
            msg = "Lỗi: Hết thời gian chờ lấy vị trí.";
        }
        
        console.error("Geolocation Error:", err.message, err.code);
        setError(msg);
    };

    // Hàm để bắt đầu quá trình lấy vị trí
    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }

        setError('');
        setIsLoading(true);

        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true, // Yêu cầu độ chính xác cao
            timeout: 15000,          // Timeout sau 5 giây
            maximumAge: 600000,           // Không dùng cache
        });
    }, []);

    // Hook này sẽ không tự động chạy, mà cần được gọi thủ công (getLocation)
    return { location, error, isLoading, getLocation };
};

export default useGeolocation;