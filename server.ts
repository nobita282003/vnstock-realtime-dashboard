import express from 'express';
import cors from 'cors';
import path from 'path';
import { Market, Reference } from './src/index';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Cho phép Backend phân phát các file tĩnh của thư mục frontend/dist sau khi build
app.use(express.static(path.join(process.cwd(), 'frontend', 'dist')));

// API lấy dữ liệu lịch sử giá OHLCV
app.get('/api/ohlcv', async (req, res) => {
    try {
        const symbol = (req.query.symbol as string) || 'FPT';
        
        // Mặc định lấy 1 năm nếu không truyền start/end (sử dụng Unix Timestamp)
        const now = Math.floor(Date.now() / 1000);
        const oneYearAgo = now - 365 * 24 * 60 * 60;
        
        const start = (req.query.start as string) || oneYearAgo.toString();
        const end = (req.query.end as string) || now.toString();
        const resolution = (req.query.resolution as string) || '1D';

        const market = new Market();
        const data = await market.equity(symbol).ohlcv(start, end, resolution);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API lấy danh sách cổ phiếu cho Watchlist
app.get('/api/watchlist', async (req, res) => {
    try {
        // Trả về một số mã phổ biến
        const symbols = ['FPT', 'VNM', 'VIC', 'HPG', 'SSI', 'VCB', 'TCB', 'MWG'];
        res.json(symbols);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API lấy dữ liệu Screener (Bộ lọc) với cơ chế Quét ngầm (Background Worker) và Caching
import { Screener } from './src/index';

let cachedScreenerData: any[] = [];
let lastScreenerTime = 0;
let isScanning = false;

const runBackgroundScan = async () => {
    if (isScanning) return;
    isScanning = true;
    console.log("⏳ [Backend] Bắt đầu quét tín hiệu 500+ cổ phiếu ngầm...");
    try {
        const startTime = Date.now();
        const screener = new Screener();
        const data = await screener.scanAll();
        cachedScreenerData = data;
        lastScreenerTime = Date.now();
        console.log(`✅ [Backend] Đã quét xong 500+ mã trong ${(lastScreenerTime - startTime) / 1000}s. Tổng cộng: ${data.length} mã có tín hiệu.`);
    } catch (error: any) {
        console.error("❌ [Backend] Lỗi khi quét tín hiệu ngầm:", error.message);
    } finally {
        isScanning = false;
    }
};

// Khởi động quét ngầm sau 2 giây khi Server chạy
setTimeout(runBackgroundScan, 2000);

// Cứ mỗi 3 phút chạy quét lại một lần ngầm để cập nhật giá trị mới nhất
setInterval(runBackgroundScan, 3 * 60 * 1000);

app.get('/api/screener', async (req, res) => {
    try {
        // Trả về dữ liệu đã được tính toán sẵn từ Cache ngay lập tức (< 1ms!)
        res.json(cachedScreenerData);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// API lấy thông tin công ty
app.get('/api/company/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const ref = new Reference();
        const profile = await ref.company(symbol).info();
        res.json(profile);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Chuyển hướng mọi Request không phải API về file index.html của React (Hỗ trợ React Router)
app.use((req, res) => {
    res.sendFile(path.join(process.cwd(), 'frontend', 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 [Backend] Server đang chạy tại http://localhost:${port}`);
});
