import { Market } from './Market';

// Danh sách 500+ cổ phiếu active trên thị trường Việt Nam (HOSE, HNX, UPCoM)
const WATCHLIST_SYMBOLS = [
    // --- HOSE (VN30 & VÀNG) ---
    'ACB', 'BCM', 'BID', 'BVH', 'CTG', 'FPT', 'GAS', 'GVR', 'HPG', 'MBB',
    'MSN', 'MWG', 'PLX', 'PNJ', 'POW', 'SAB', 'SHB', 'SSB', 'SSI', 'STB',
    'TCB', 'TPB', 'VCB', 'VHM', 'VIC', 'VJC', 'VNM', 'VPB', 'VRE', 'LPB',
    
    // --- CHỨNG KHOÁN & TÀI CHÍNH ---
    'VIX', 'VND', 'VCI', 'HCM', 'SHS', 'MBS', 'FTS', 'BSI', 'CTS', 'ORS',
    'AGR', 'BVS', 'TCI', 'PSI', 'APG', 'TVB', 'SBS', 'VDS', 'IVS', 'EVS',
    'HBS', 'TVC', 'TVS', 'WSS', 'AAS', 'VIG', 'DSC', 'VFS', 'HAC', 'PFS',
    
    // --- BẤT ĐỘNG SẢN & PHÁT TRIỂN ĐÔ THỊ ---
    'DIG', 'DXG', 'NLG', 'KDH', 'CEO', 'PDR', 'DXS', 'HDC', 'IJC', 'VPI',
    'TCH', 'HQC', 'SCR', 'CRE', 'SJS', 'SZC', 'KBC', 'ITA', 'LHG', 'TIP',
    'D2D', 'NHA', 'DRH', 'NDN', 'VPH', 'QCG', 'LDG', 'HAR', 'KHG', 'TCD',
    'EVG', 'MST', 'IDJ', 'API', 'APS', 'L14', 'DTA', 'FIT', 'ITC', 'LGL',
    'NBB', 'NTL', 'PFL', 'PTL', 'PVL', 'TDH', 'VRC', 'SZL', 'SZB',
    
    // --- THÉP & KHAI KHOÁNG ---
    'HSG', 'NKG', 'TLH', 'SMC', 'POM', 'VGS', 'TIS', 'TVN', 'KSB', 'DHA',
    'MSR', 'NNC', 'BMC', 'NBC', 'TC6', 'THT', 'TVD', 'ALV', 'ACM', 'BKC',
    'HGM', 'KHL', 'KMT', 'LCM', 'MDC', 'MIC', 'MVB', 'NAG', 'TCS', 'TDN',
    
    // --- XÂY DỰNG & ĐẦU TƯ CÔNG ---
    'VCG', 'HHV', 'LCG', 'FCN', 'C4G', 'G36', 'BCG', 'CII', 'HUT', 'HT1',
    'BCC', 'DPG', 'PHR', 'DPR', 'TRC', 'DRI', 'CDC', 'CTD', 'HBC',
    'SCG', 'ACC', 'CMS', 'CSC', 'L18', 'MCG', 'PHC', 'SD5',
    'SD6', 'SD9', 'S99', 'TGG', 'VC1', 'VC2', 'VC3', 'VC7', 'VC9', 'VMC',
    
    // --- DẦU KHÍ, NĂNG LƯỢNG & ĐIỆN ---
    'PVD', 'PVS', 'PVT', 'PVC', 'BSR', 'OIL', 'NT2', 'PC1', 'GEG', 'HDG',
    'REE', 'TV2', 'VSH', 'SJD', 'TTA', 'PGD', 'PGB', 'PGS', 'PVB',
    'PVM', 'PVP', 'PVY', 'CNG', 'LIG', 'KHP', 'VPD', 'TMP',
    
    // --- HÓA CHẤT, NHỰA & PHÂN BÓN ---
    'DPM', 'DCM', 'BFC', 'DDV', 'DGC', 'HVT', 'LIX', 'NET', 'AAA', 'APH',
    'BMP', 'NTP', 'DAG', 'HCD', 'RDP', 'PLP',
    'CSV', 'LAS', 'SFG', 'VFG', 'CPC', 'PLC', 'TOC',
    
    // --- TIÊU DÙNG, BÁN LẺ & THỰC PHẨM ---
    'FRT', 'DGW', 'PET', 'HAX', 'VHC', 'ANV', 'IDI', 'FMC', 'MPC', 'CMX',
    'ACL', 'PAN', 'LTG', 'TAR', 'NSC', 'HAG', 'HNG', 'DBC', 'BAF', 'VLC',
    'MCH', 'VOC', 'KDC', 'SBT', 'LSS', 'SLS', 'BHN',
    'DAT', 'TLD', 'MML', 'VSF', 'MCM', 'CLX', 'HTM', 'TTB', 'VHE', 'DL1',
    
    // --- CÔNG NGHỆ & VIỄN THÔNG ---
    'CMG', 'ELC', 'FOX', 'TTN', 'MFS', 'VTC', 'ITD', 'SGT', 'FOC', 'HIG',
    'ICT', 'ONE', 'VGI', 'CTR', 'VTE', 'VNZ', 'VIE', 'SMN', 'VEC',
    
    // --- CẢNG BIỂN, LOGISTICS & VẬN TẢI ---
    'GMD', 'HAH', 'VSC', 'VIP', 'VTO', 'PDN', 'SGP', 'MVN', 'TCL', 'DXP',
    'VOS', 'TMS', 'DVP', 'ILB', 'STG', 'VNA', 'CDN',
    
    // --- DỆT MAY & DA GIÀY ---
    'TNG', 'MSH', 'GIL', 'TCM', 'VGG', 'STK', 'MHC', 'HTG', 'ADS',
    'FTM', 'KMR', 'TDT', 'TVT', 'VGT', 'M10', 'BGG', 'NDF', 'VTG',
    
    // --- NÔNG LÂM THỦY SẢN & CAO SU ---
    'ASM', 'SJ1', 'BLF', 'ABT', 'TS4', 'CAD',
    
    // --- CÁC MÃ DỊCH VỤ & KHÁC ---
    'HVN', 'VJC', 'ACV', 'VTP', 'DHG', 'TRA', 'DBD', 'DMC', 'IMP', 'AMV', 'JVC', 'TNH', 'LDP', 'PME',
    'SAM', 'VGC', 'VNP', 'VPS', 'YEG', 'AME', 'APF', 'APP', 'ASA', 'ATB', 'ATG', 'B82', 'BAM', 'BAP',
    'BBD', 'BBE', 'BBH', 'BCV', 'BDF', 'BDP', 'BDT', 'BDV', 'BHA', 'BHC', 'BHG', 'BHP', 'BHS', 'BIC', 'BIG', 'BIO', 'BJP', 'BKC',
    'BLN', 'BLW', 'BMD', 'BMF', 'BMG', 'BMI', 'BMN', 'BMT',
    'BMV', 'BNA', 'BND', 'BNE', 'BNW', 'BOB', 'BOT', 'BPG', 'BPH', 'BPP',
    'BQB', 'BRC', 'BRR', 'BRS', 'BRV', 'BSD', 'BSG', 'BSL', 'BSN',
    'BSQ', 'BSS', 'BST', 'BSY', 'BTA', 'BTB', 'BTD', 'BTE', 'BTG',
    'BTH', 'BTL', 'BTP', 'BTR', 'BTS', 'BTT', 'BTU', 'BTV', 'BTW', 'BTX',
    'BUD', 'BVA', 'BVC', 'BVG', 'BVI', 'BVL', 'BVT', 'BYG',
    'C12', 'C21', 'C22', 'C32', 'C47', 'C71', 'C92', 'CAF',
    'CAG', 'CAM', 'CAP', 'CAS', 'CAT', 'CAV', 'CBC', 'CBI', 'CBP', 'CBV',
    'CC1', 'CC4', 'CCA', 'CCD', 'CCG', 'CCH', 'CCI', 'CCM', 'CCN', 'CCP',
    'CCS', 'CDG', 'CDH', 'CDO', 'CDP', 'CDV', 'CE1', 'CEG', 'CEM',
    'CEN', 'CET', 'CFV', 'CGB', 'CGD', 'CGP', 'CGV', 'CHC', 'CHD',
    'CHG', 'CHP', 'CHS', 'CHV', 'CIA', 'CID', 'CIG', 'CIM', 'CIP'
];

export interface ScreenerResult {
    symbol: string;
    signal: 'MUA' | 'BÁN' | 'HOLD' | 'NONE';
    price: number;
    profit: number;
    tPlus: number | null;
}

export class Screener {
    async scanAll(): Promise<ScreenerResult[]> {
        const market = new Market();
        
        const to = Math.floor(Date.now() / 1000);
        // Đồng bộ hoàn toàn với App.tsx: Lấy 5 năm dữ liệu để các đường EMA (MACD) hội tụ chính xác 100%
        const from = to - 5 * 365 * 24 * 60 * 60;
        
        // Loại bỏ trùng lặp trong danh sách mã
        const uniqueSymbols = Array.from(new Set(WATCHLIST_SYMBOLS));
        const results: ScreenerResult[] = [];
        
        // Chia thành các chunk (mỗi nhóm 20 mã) để quét bất đồng bộ tuần tự, tránh bị Entrade chặn IP
        const chunkSize = 20;
        for (let i = 0; i < uniqueSymbols.length; i += chunkSize) {
            const chunk = uniqueSymbols.slice(i, i + chunkSize);
            const promises = chunk.map(symbol => 
                market.equity(symbol).ohlcv(from.toString(), to.toString(), '1D')
                    .then(data => this.processSignal(symbol, data))
                    .catch(err => null)
            );
            
            const chunkResults = await Promise.all(promises);
            for (const res of chunkResults) {
                if (res) results.push(res);
            }
            
            // Nghỉ nhẹ 30ms giữa các chunk để tránh bị rate limit
            await new Promise(resolve => setTimeout(resolve, 30));
        }

        return results;
    }

    private processSignal(symbol: string, data: any[]): ScreenerResult | null {
        if (!data || data.length < 50) return null;

        const trades: any[] = [];
        const sma10: (number | null)[] = [];
        const sma20: (number | null)[] = [];

        let sum10 = 0, sum20 = 0;
        for (let i = 0; i < data.length; i++) {
            sum10 += data[i].close;
            sum20 += data[i].close;
            if (i >= 10) sum10 -= data[i - 10].close;
            if (i >= 20) sum20 -= data[i - 20].close;
            sma10[i] = i >= 9 ? sum10 / 10 : null;
            sma20[i] = i >= 19 ? sum20 / 20 : null;
        }

        const calculateEMA = (dataArr: any[], period: number, key: string = 'close') => {
            const k = 2 / (period + 1);
            const emaData: number[] = [];
            let ema = dataArr.length > 0 ? dataArr[0][key] : 0;
            for (let i = 0; i < dataArr.length; i++) {
                if (i === 0) {
                    emaData.push(ema);
                } else {
                    ema = (dataArr[i][key] - ema) * k + ema;
                    emaData.push(ema);
                }
            }
            return emaData;
        };

        const ema12 = calculateEMA(data, 12, 'close');
        const ema26 = calculateEMA(data, 26, 'close');
        const macdLine = data.map((_, i) => ({ close: ema12[i] - ema26[i] }));
        const signalLine = calculateEMA(macdLine, 9, 'close');
        const histogram = macdLine.map((m, i) => m.close - signalLine[i]);

        let highestPriceSinceBuy = 0;

        for (let i = 26; i < data.length; i++) {
            const isHolding = trades.length > 0 && trades[trades.length - 1].type === 'MUA';

            const prevHist = histogram[i - 1];
            const currHist = histogram[i];
            const currClose = data[i].close;
            const prevClose = data[i - 1].close;
            const currMA20 = sma20[i];
            const prevMA20 = sma20[i - 1];

            if (currMA20 === null || prevMA20 === null) continue;

            if (isHolding) {
                if (currClose > highestPriceSinceBuy) highestPriceSinceBuy = currClose;
            } else {
                highestPriceSinceBuy = 0;
            }

            const currentlyBullish = currHist > 0 && currClose > currMA20;
            const previouslyBullish = prevHist > 0 && prevClose > prevMA20;
            const currentlyBearish = currHist < 0 && currClose < currMA20;

            const isBuy = currentlyBullish && !previouslyBullish;
            const isTrendBroken = currentlyBearish;
            const isTrailingStop = isHolding && currClose < highestPriceSinceBuy * 0.92;
            const isCatastrophicStop = currClose < currMA20 * 0.96;
            const isSell = isTrendBroken || isTrailingStop || isCatastrophicStop;

            if (!isHolding && isBuy) {
                trades.push({ type: 'MUA', price: data[i].open, time: data[i].time, index: i });
                highestPriceSinceBuy = data[i].open;
            } else if (isHolding && isSell) {
                trades.push({ type: 'BÁN', price: data[i].open, time: data[i].time, index: i });
            }
        }

        const latestData = data[data.length - 1];

        // Lấy tín hiệu cuối cùng
        if (trades.length === 0) {
            return { symbol, signal: 'NONE', price: latestData.close, profit: 0, tPlus: null };
        }

        const lastTrade = trades[trades.length - 1];
        const isLastBarTrade = lastTrade.index === data.length - 1;

        if (lastTrade.type === 'MUA') {
            // T+ chuẩn: đếm số nến giao dịch (tự động bỏ qua T7, CN, ngày lễ)
            const daysHeld = (data.length - 1) - lastTrade.index;
            const profit = ((latestData.close - lastTrade.price) / lastTrade.price) * 100;
            
            return {
                symbol,
                signal: isLastBarTrade ? 'MUA' : 'HOLD',
                price: lastTrade.price,
                profit: Number(profit.toFixed(2)),
                tPlus: daysHeld
            };
        } else {
            // Lệnh BÁN
            let prevBuy = null;
            for (let i = trades.length - 2; i >= 0; i--) {
                if (trades[i].type === 'MUA') {
                    prevBuy = trades[i];
                    break;
                }
            }

            if (isLastBarTrade && prevBuy) {
                const profit = ((lastTrade.price - prevBuy.price) / prevBuy.price) * 100;
                return {
                    symbol,
                    signal: 'BÁN',
                    price: lastTrade.price,
                    profit: Number(profit.toFixed(2)),
                    tPlus: null
                };
            }

            return {
                symbol,
                signal: 'NONE',
                price: latestData.close,
                profit: 0,
                tPlus: null
            };
        }
    }
}
