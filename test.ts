import { Market, Reference } from './src/index';

async function run() {
    console.log("🚀 Bắt đầu test vnstock-node...\n");
    
    const market = new Market();
    const ref = new Reference();

    console.log("1. Lấy dữ liệu lịch sử giá cổ phiếu VNM từ 01/01/2024 đến 10/01/2024...");
    const history = await market.equity('VNM').ohlcv('2024-01-01', '2024-01-10');
    console.table(history);

    console.log("\n2. Xem tổng quan công ty FPT...");
    const profile = await ref.company('FPT').info();
    if (profile) {
        console.log(`- Tên công ty: ${profile.shortName || 'N/A'}`);
        console.log(`- Sàn giao dịch: ${profile.exchange || 'N/A'}`);
        console.log(`- Ngành nghề: ${profile.industry || 'N/A'}`);
        console.log(`- Website: ${profile.website || 'N/A'}`);
    } else {
        console.log("Không thể tải thông tin công ty do lỗi mạng hoặc API thay đổi.");
    }
}

run();
