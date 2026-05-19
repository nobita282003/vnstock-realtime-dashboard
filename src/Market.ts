import axios from 'axios';

export class Market {
    equity(symbol: string) {
        return {
            ohlcv: async (start: string, end: string, resolution: string = '1D') => {
                const isUnixStart = !isNaN(Number(start));
                const isUnixEnd = !isNaN(Number(end));
                
                const fromTs = isUnixStart ? Number(start) : Math.floor(new Date(start).getTime() / 1000);
                let toTs = isUnixEnd ? Number(end) : Math.floor(new Date(end).getTime() / 1000);
                
                // Tránh việc cắt cụt ngày hiện tại ở mốc 0h sáng nếu truyền format YYYY-MM-DD
                if (!isUnixEnd && end.includes('-') && !end.includes('T')) {
                    toTs += 86399; 
                }

                const url = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${fromTs}&to=${toTs}&symbol=${symbol}&resolution=${resolution}`;
                
                try {
                    const response = await axios.get(url);
                    const data = response.data;
                    const result: any[] = [];
                    
                    if (data && data.t && data.t.length > 0) {
                        for (let i = 0; i < data.t.length; i++) {
                            result.push({
                                time: data.t[i],
                                open: data.o[i],
                                high: data.h[i],
                                low: data.l[i],
                                close: data.c[i],
                                volume: data.v[i]
                            });
                        }
                    }

                    // NGHIỆP VỤ: Gộp nến Live trong phiên (chỉ áp dụng cho khung Ngày)
                    // API lịch sử ohlcs 1D thường không trả về nến ngày hôm nay cho đến khi kết phiên.
                    // Ta sẽ gọi API khung 1 phút (intraday) của ngày hôm nay và tự động tổng hợp (aggregate) thành nến Daily live.
                    if (resolution === '1D') {
                        // Tính mốc 0h sáng của ngày cuối cùng cần lấy (có thể là hôm nay)
                        const now = new Date();
                        now.setHours(0, 0, 0, 0);
                        const startOfToday = Math.floor(now.getTime() / 1000);
                        const currentTs = Math.floor(Date.now() / 1000);
                        
                        // Nếu toTs (người dùng yêu cầu) bao gồm ngày hôm nay
                        if (toTs >= startOfToday) {
                            const liveUrl = `https://services.entrade.com.vn/chart-api/v2/ohlcs/stock?from=${startOfToday}&to=${currentTs}&symbol=${symbol}&resolution=1`;
                            try {
                                const liveRes = await axios.get(liveUrl);
                                const liveData = liveRes.data;
                                
                                if (liveData && liveData.t && liveData.t.length > 0) {
                                    let liveHigh = -Infinity;
                                    let liveLow = Infinity;
                                    let liveVolume = 0;
                                    
                                    for (let i = 0; i < liveData.t.length; i++) {
                                        if (liveData.h[i] > liveHigh) liveHigh = liveData.h[i];
                                        if (liveData.l[i] < liveLow) liveLow = liveData.l[i];
                                        liveVolume += Number(liveData.v[i] || 0);
                                    }
                                    
                                    const liveCandle = {
                                        time: startOfToday, // Timestamp của đầu ngày hôm nay
                                        open: liveData.o[0],
                                        high: liveHigh,
                                        low: liveLow,
                                        close: liveData.c[liveData.c.length - 1], // Giá khớp lệnh gần nhất
                                        volume: liveVolume
                                    };
                                    
                                    // Kiểm tra xem nến cuối cùng trong mảng lịch sử đã là ngày hôm nay chưa
                                    if (result.length > 0 && result[result.length - 1].time >= startOfToday) {
                                        result[result.length - 1] = liveCandle; // Ghi đè
                                    } else {
                                        result.push(liveCandle); // Nối thêm (Append)
                                    }
                                }
                            } catch(e) {
                                // Bỏ qua nếu lỗi mạng lấy live, giữ nguyên mảng lịch sử
                            }
                        }
                    }

                    return result;
                } catch (error: any) {
                    if (error.response?.status !== 400) {
                        console.error(`Lỗi khi tải dữ liệu OHLCV (${symbol}):`, error.message);
                    }
                    return [];
                }
            }
        };
    }
}
