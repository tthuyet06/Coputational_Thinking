import { useState, useCallback } from 'react';
// ⚠️ Đảm bảo đường dẫn import đúng vị trí file api.js của bạn
// Ví dụ: nếu useWeather ở src/hooks và api.js ở src/api.js thì dùng '../api'
import api from '../api'; 

const useWeather = () => {
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchWeather = useCallback(async (lat, lng) => {
        if (!lat || !lng) {
            console.warn("⚠️ [useWeather] Missing coordinates, skipping call.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log("🌐 [useWeather] Calling API with Axios:", { lat, lng });

            // Gọi qua instance 'api' đã cấu hình sẵn BaseURL và Token
            const response = await api.get('/api/v1/weather/current', {
                params: {
                    lat: lat,
                    lon: lng, // API backend yêu cầu key là 'lon'
                },
            });

            // Axios tự động parse JSON và để dữ liệu trong response.data
            console.log("✅ [useWeather] Success:", response.data);
            setWeatherData(response.data);

        } catch (err) {
            console.error("❌ [useWeather] Error:", err);
            
            // Xử lý lỗi đặc thù của Axios
            // err.response.data thường chứa message từ backend trả về
            const errorMessage = err.response?.data?.message || err.message || "Không thể lấy dữ liệu thời tiết.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { weatherData, error, isLoading, fetchWeather };
};

export default useWeather;