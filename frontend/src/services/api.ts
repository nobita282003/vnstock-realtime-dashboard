import axios from 'axios';

export const fetchOHLCV = async (symbol: string, from: number, to: number, resolution: string = '1D') => {
    // Tự động dùng domain hiện tại thay vì hardcode localhost (hỗ trợ Deploy lên Web)
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const url = `${API_BASE}/api/ohlcv?symbol=${symbol}&start=${from}&end=${to}&resolution=${resolution}`;
    try {
        const response = await axios.get(url);
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
            return data.map((item: any) => ({
                time: item.time,
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                value: item.volume, // Cho Lightweight Charts
                volume: item.volume // Cho SessionPanel
            }));
        }
        return [];
    } catch (error) {
        console.error("Lỗi tải dữ liệu từ Backend", error);
        return [];
    }
}

export const fetchWatchlist = async () => {
    try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${API_BASE}/api/watchlist`);
        return response.data;
    } catch (error) {
        console.error("Lỗi tải watchlist", error);
        return [];
    }
}

export const fetchCompanyInfo = async (symbol: string) => {
    try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${API_BASE}/api/company/${symbol}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi tải thông tin công ty", error);
        return null;
    }
}

export const fetchWatchlistData = async (symbols: string[]) => {
    const to = Math.floor(Date.now() / 1000);
    const from = to - 15 * 24 * 60 * 60; // Lấy 15 ngày để tính % tuần chuẩn xác
    try {
        const promises = symbols.map(sym => fetchOHLCV(sym, from, to, '1D'));
        const results = await Promise.all(promises);
        
        return symbols.map((sym, index) => {
            const data = results[index];
            if (!data || data.length === 0) return null;
            
            const latest = data[data.length - 1];
            const prev = data.length > 1 ? data[data.length - 2] : latest;
            const weekPrev = data.length >= 5 ? data[data.length - 5] : data[0];
            
            const changePercent = prev.close > 0 ? ((latest.close - prev.close) / prev.close) * 100 : 0;
            const weekChangePercent = weekPrev.close > 0 ? ((latest.close - weekPrev.close) / weekPrev.close) * 100 : 0;
            // Ở TTCK VN, Giá x 1000, do đó (Giá * KL) / 1,000,000 = Tỷ VNĐ
            const volumeBillions = (latest.volume * latest.close) / 1000000; 
            
            return {
                symbol: sym,
                name: sym,
                exchange: 'HOSE',
                price: latest.close,
                changePercent: Number(changePercent.toFixed(2)),
                weekChangePercent: Number(weekChangePercent.toFixed(2)),
                volumeBillions: Number(volumeBillions.toFixed(1))
            };
        }).filter(Boolean);
    } catch (error) {
        console.error("Lỗi tải Watchlist Data", error);
        return [];
    }
}

export const fetchScreener = async () => {
    try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const response = await axios.get(`${API_BASE}/api/screener`);
        return response.data;
    } catch (error) {
        console.error("Lỗi tải Screener", error);
        return [];
    }
}
