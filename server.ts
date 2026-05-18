import express from 'express';
import cors from 'cors';
import path from 'path';
import { Market, Reference } from './src/index';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Cho phép Backend phân phát các file tĩnh của thư mục frontend/dist sau khi build
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

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
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 [Backend] Server đang chạy tại http://localhost:${port}`);
});
