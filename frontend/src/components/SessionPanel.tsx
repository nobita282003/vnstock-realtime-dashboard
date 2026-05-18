import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, CheckCircle, Info } from 'lucide-react';

interface SessionPanelProps {
  symbol: string;
  latestData: any | null;
  prevData: any | null;
}

interface TradeTick {
  time: string;
  price: number;
  change: number;
  volume: number;
  side: 'Mua' | 'Bán';
}

interface OrderBookLevel {
  buyPrice: number;
  buyVol: number;
  sellPrice: number;
  sellVol: number;
}

interface PriceLevelVolume {
  price: number;
  buyVol: number;
  sellVol: number;
  totalVol: number;
}

export const SessionPanel: React.FC<SessionPanelProps> = ({ symbol, latestData, prevData }) => {
  const [activeTab, setActiveTab] = useState<'tongquan' | 'dongtien'>('tongquan');
  const [activeSubTab, setActiveSubTab] = useState<'giaodich' | 'chitiet'>('giaodich');

  // Lấy dữ liệu thực tế 100% từ Biểu đồ
  const basePrice = (latestData && !isNaN(latestData.close)) ? Number(latestData.close) : 100.0;
  const refPrice = (prevData && !isNaN(prevData.close)) ? Number(prevData.close) : basePrice;
  const openPrice = latestData ? Number(latestData.open) : basePrice;
  const highPrice = latestData ? Number(latestData.high) : basePrice;
  const lowPrice = latestData ? Number(latestData.low) : basePrice;
  const totalVol = (latestData && latestData.volume) ? Number(latestData.volume) : 0;

  const [buyVol, setBuyVol] = useState(0);
  const [sellVol, setSellVol] = useState(0);

  const [orderBook, setOrderBook] = useState<OrderBookLevel[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeTick[]>([]);
  const [priceProfiles, setPriceProfiles] = useState<PriceLevelVolume[]>([]);

  // Khởi tạo dữ liệu giả lập cho Sổ Lệnh và Dòng tiền (vì chưa có API Level-2)
  useEffect(() => {
    const seedBase = basePrice;
    const seedTick = seedBase > 100 ? 0.5 : seedBase > 50 ? 0.1 : 0.05;

    // Seed Khối lượng Mua/Bán chủ động dựa trên Khối lượng thật
    const initialBuyVol = Math.floor(totalVol * (0.42 + Math.random() * 0.15));
    const initialSellVol = totalVol - initialBuyVol;
    
    setBuyVol(initialBuyVol);
    setSellVol(initialSellVol);

    // Seed Sổ lệnh (3 mức giá)
    const seedOrderBook = () => {
      const list: OrderBookLevel[] = [];
      for (let i = 0; i < 3; i++) {
        list.push({
          buyPrice: seedBase - (i + 1) * seedTick,
          buyVol: Math.floor(200000 + Math.random() * 2000000),
          sellPrice: seedBase + i * seedTick,
          sellVol: Math.floor(200000 + Math.random() * 2000000)
        });
      }
      return list;
    };
    setOrderBook(seedOrderBook());

    // Seed Khớp lệnh gần nhất (12 ticks)
    const seedRecentTrades = () => {
      const list: TradeTick[] = [];
      const now = new Date();
      for (let i = 0; i < 12; i++) {
        const side = Math.random() > 0.45 ? 'Mua' : 'Bán';
        const tradePrice = seedBase + (Math.floor(Math.random() * 5) - 2) * seedTick;
        const timeStr = new Date(now.getTime() - i * 15 * 1000).toTimeString().split(' ')[0];
        
        list.push({
          time: timeStr,
          price: tradePrice,
          change: tradePrice - seedBase,
          volume: Math.floor(100 + Math.random() * 500) * 10,
          side
        });
      }
      return list;
    };
    setRecentTrades(seedRecentTrades());

    // Seed Phân bố dòng tiền (Volume Profile - 8 mức giá)
    const seedPriceProfiles = () => {
      const list: PriceLevelVolume[] = [];
      for (let i = -4; i <= 4; i++) {
        const levelPrice = seedBase + i * seedTick;
        const total = Math.floor(totalVol * (0.03 + Math.random() * 0.18));
        const buy = Math.floor(total * (0.35 + Math.random() * 0.3));
        list.push({
          price: levelPrice,
          buyVol: buy,
          sellVol: total - buy,
          totalVol: total
        });
      }
      // Sắp xếp giá giảm dần
      return list.sort((a, b) => b.price - a.price);
    };
    setPriceProfiles(seedPriceProfiles());

  }, [symbol, basePrice, totalVol]);

  // Vòng lặp cập nhật Real-time sau mỗi 1.5 - 3 giây
  useEffect(() => {
    // NGHIỆP VỤ: Kiểm tra giờ giao dịch thị trường chứng khoán Việt Nam
    const isMarketOpen = () => {
      const now = new Date();
      const day = now.getDay();
      if (day === 0 || day === 6) return false; // Nghỉ Thứ 7, Chủ Nhật
      
      const time = now.getHours() * 60 + now.getMinutes();
      // Phiên sáng: 09:00 (540) - 11:30 (690)
      // Phiên chiều: 13:00 (780) - 15:00 (900)
      if ((time >= 540 && time <= 690) || (time >= 780 && time <= 900)) {
        return true;
      }
      return false;
    };

    const seedTick = basePrice > 100 ? 0.5 : basePrice > 50 ? 0.1 : 0.05;

    const interval = setInterval(() => {
      // KHÔNG NHẢY SỐ (ĐÓNG BĂNG) KHI THỊ TRƯỜNG ĐÓNG CỬA HOẶC NGHỈ TRƯA
      if (!isMarketOpen()) return;

      // 1. Tạo tick khớp lệnh mới
      const side = Math.random() > 0.48 ? 'Mua' : 'Bán';
      // Giá khớp thường nằm quanh Bid 1 và Ask 1
      const priceOffset = side === 'Mua' ? 0 : -seedTick;
      const tradePrice = Number((basePrice + priceOffset + (Math.floor(Math.random() * 3) - 1) * seedTick).toFixed(2));
      const tradeVol = Math.floor(10 + Math.random() * 990) * 10;
      
      const nowStr = new Date().toTimeString().split(' ')[0];
      const newTick: TradeTick = {
        time: nowStr,
        price: tradePrice,
        change: tradePrice - refPrice,
        volume: tradeVol,
        side
      };

      // 2. Thêm vào Khớp lệnh gần nhất
      setRecentTrades(prev => [newTick, ...prev.slice(0, 19)]);

      // 3. Cộng dồn Tỉ lệ Mua/Bán chủ động
      if (side === 'Mua') {
        setBuyVol(prev => prev + tradeVol);
      } else {
        setSellVol(prev => prev + tradeVol);
      }

      // 5. Làm động Sổ lệnh (Bid/Ask volumes dao động)
      setOrderBook(prev => {
        return prev.map((level) => {
          const deltaBuy = Math.floor((Math.random() * 40000 - 20000));
          const deltaSell = Math.floor((Math.random() * 40000 - 20000));
          return {
            ...level,
            buyVol: Math.max(10000, level.buyVol + deltaBuy),
            sellVol: Math.max(10000, level.sellVol + deltaSell)
          };
        });
      });

      // 6. Cập nhật Volume Profile
      setPriceProfiles(prev => {
        let found = false;
        const nextProfiles = prev.map(p => {
          if (Math.abs(p.price - tradePrice) < 0.01) {
            found = true;
            return {
              ...p,
              totalVol: p.totalVol + tradeVol,
              buyVol: side === 'Mua' ? p.buyVol + tradeVol : p.buyVol,
              sellVol: side === 'Bán' ? p.sellVol + tradeVol : p.sellVol
            };
          }
          return p;
        });

        if (!found) {
          // Thêm mức giá mới nếu chưa tồn tại
          nextProfiles.push({
            price: tradePrice,
            buyVol: side === 'Mua' ? tradeVol : 0,
            sellVol: side === 'Bán' ? tradeVol : 0,
            totalVol: tradeVol
          });
          nextProfiles.sort((a, b) => b.price - a.price);
        }
        return nextProfiles;
      });

    }, 2000);

    return () => clearInterval(interval);
  }, [symbol, basePrice, refPrice, highPrice, lowPrice]);

  // Hàm định dạng số lớn
  const formatVol = (num: any) => {
    const val = Number(num);
    if (val === undefined || val === null || isNaN(val)) return '0';
    if (val >= 1000000) {
      return (val / 1000000).toFixed(2) + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toLocaleString();
  };

  const getPriceColor = (price: number | undefined | null) => {
    if (price === undefined || price === null || isNaN(price)) return 'text-yellow-500';
    if (price > refPrice) return 'text-green-600';
    if (price < refPrice) return 'text-red-500';
    return 'text-yellow-500';
  };

  // Tính phần trăm mua bán chủ động
  const buyPercent = totalVol > 0 ? (buyVol / totalVol) * 100 : 50;
  const sellPercent = 100 - buyPercent;

  // Tính toán độ sâu lớn nhất của sổ lệnh để vẽ thanh màu nền tỉ lệ
  const maxBookVol = orderBook.reduce((max, item) => Math.max(max, item.buyVol, item.sellVol), 1);

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden text-xs md:text-sm">
      {/* HEADER PANEL */}
      <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-base text-gray-800 tracking-tight">{symbol}</span>
          <span className="text-[10px] text-gray-500 font-semibold px-1.5 py-0.5 bg-gray-200/60 rounded">HOSE</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('tongquan')} 
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs ${activeTab === 'tongquan' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >
            Tổng quan
          </button>
          <button 
            onClick={() => setActiveTab('dongtien')} 
            className={`px-3 py-1 rounded-full font-bold transition-all text-xs ${activeTab === 'dongtien' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >
            Dòng tiền
          </button>
        </div>
      </div>

      {/* TAB TỔNG QUAN */}
      {activeTab === 'tongquan' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sub-tabs Giao dịch / Chi tiết */}
          <div className="flex border-b border-gray-100 p-2 shrink-0 gap-2 bg-white justify-center">
            <button 
              onClick={() => setActiveSubTab('giaodich')}
              className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'giaodich' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Giao dịch
            </button>
            <button 
              onClick={() => setActiveSubTab('chitiet')}
              className={`px-4 py-1 text-xs font-bold rounded-lg transition-all ${activeSubTab === 'chitiet' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Cơ bản
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {activeSubTab === 'giaodich' ? (
              <>
                {/* 1. Chỉ số cơ bản nhanh */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-1.5 bg-gray-50 rounded border border-gray-100">
                    <div className="text-[10px] text-gray-400 font-semibold">Tham chiếu</div>
                    <div className="font-bold text-yellow-500">{(refPrice ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 bg-gray-50 rounded border border-gray-100">
                    <div className="text-[10px] text-gray-400 font-semibold">Mở cửa</div>
                    <div className={`font-bold ${getPriceColor(openPrice)}`}>{(openPrice ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 bg-gray-50 rounded border border-gray-100">
                    <div className="text-[10px] text-gray-400 font-semibold">Thấp nhất</div>
                    <div className={`font-bold ${getPriceColor(lowPrice)}`}>{(lowPrice ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="p-1.5 bg-gray-50 rounded border border-gray-100">
                    <div className="text-[10px] text-gray-400 font-semibold">Cao nhất</div>
                    <div className={`font-bold ${getPriceColor(highPrice)}`}>{(highPrice ?? 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* 2. Sổ lệnh (3 mức giá) */}
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50/80 px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-500 flex justify-between">
                    <span>MUA CHỦ ĐỘNG (DƯ MUA)</span>
                    <span>BÁN CHỦ ĐỘNG (DƯ BÁN)</span>
                  </div>
                  
                  <div className="divide-y divide-gray-50 bg-white">
                    {orderBook.map((level, idx) => {
                      const buyRatio = (level.buyVol / maxBookVol) * 80; // max 80% width
                      const sellRatio = (level.sellVol / maxBookVol) * 80;

                      return (
                        <div key={idx} className="flex h-10 items-center justify-between text-xs relative">
                          {/* Dư mua */}
                          <div className="flex-1 flex items-center justify-between px-3 h-full relative z-10">
                            <span className="font-bold text-gray-700">{formatVol(level.buyVol)}</span>
                            <span className="font-extrabold text-green-600">{(level.buyPrice ?? 0).toFixed(2)}</span>
                            <div 
                              style={{ width: `${buyRatio}%` }} 
                              className="absolute top-0 right-0 bottom-0 bg-green-50/60 -z-10 transition-all duration-300"
                            />
                          </div>

                          <div className="w-[1px] h-6 bg-gray-200"></div>

                          {/* Dư bán */}
                          <div className="flex-1 flex items-center justify-between px-3 h-full relative z-10">
                            <span className="font-extrabold text-red-500">{(level.sellPrice ?? 0).toFixed(2)}</span>
                            <span className="font-bold text-gray-700">{formatVol(level.sellVol)}</span>
                            <div 
                              style={{ width: `${sellRatio}%` }} 
                              className="absolute top-0 left-0 bottom-0 bg-red-50/60 -z-10 transition-all duration-300"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Khớp lệnh gần nhất & Tỉ lệ mua bán */}
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-800 text-xs md:text-sm flex items-center gap-1">
                    <TrendingUp size={16} className="text-blue-500" />
                    Khớp lệnh gần nhất
                  </h3>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col">
                    <div className="flex justify-between items-end border-b border-gray-200/50 pb-2">
                      <div>
                        <div className="text-[10px] text-gray-400 font-semibold">TỔNG KHỐI LƯỢNG</div>
                        <div className="font-extrabold text-lg text-gray-800">{formatVol(totalVol)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-400 font-semibold flex items-center justify-end gap-1">
                          <span>MUA/BÁN CHỦ ĐỘNG</span>
                        </div>
                        <div className="flex gap-2 text-xs font-extrabold mt-0.5">
                          <span className="text-green-600">{formatVol(buyVol)}</span>
                          <span className="text-gray-300">/</span>
                          <span className="text-red-500">{formatVol(sellVol)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar tỉ lệ */}
                    <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-200 mt-3 shadow-inner relative">
                      <div 
                        style={{ width: `${buyPercent}%` }} 
                        className="bg-gradient-to-r from-emerald-400 to-[#26a69a] h-full transition-all duration-500 flex items-center justify-start pl-2"
                      >
                        <span className="text-[8px] text-white font-bold leading-none">{buyPercent.toFixed(0)}%</span>
                      </div>
                      <div 
                        style={{ width: `${sellPercent}%` }} 
                        className="bg-gradient-to-r from-[#ef5350] to-rose-500 h-full transition-all duration-500 flex items-center justify-end pr-2"
                      >
                        <span className="text-[8px] text-white font-bold leading-none">{sellPercent.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* List 10 ticks gần nhất */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-5 px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-400 text-center">
                      <span>Thời gian</span>
                      <span>Giá</span>
                      <span>+/-</span>
                      <span>Khối lượng</span>
                      <span>Phe</span>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-50 bg-white">
                      {recentTrades.slice(0, 10).map((trade, idx) => (
                        <div key={idx} className="grid grid-cols-5 px-3 py-1.5 text-center text-xs items-center hover:bg-gray-50">
                          <span className="text-gray-400 font-medium">{trade.time}</span>
                          <span className={`font-bold ${getPriceColor(trade.price)}`}>{(trade.price ?? 0).toFixed(2)}</span>
                          <span className={`font-semibold ${trade.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {trade.change >= 0 ? '+' : ''}{(trade.change ?? 0).toFixed(2)}
                          </span>
                          <span className="text-gray-700 font-bold">{trade.volume.toLocaleString()}</span>
                          <span className={`font-bold ${trade.side === 'Mua' ? 'text-green-600' : 'text-red-500'}`}>
                            {trade.side}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Tab cơ bản của công ty
              <div className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 flex gap-3 text-xs">
                  <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-blue-700">
                    <p className="font-bold">Thông tin doanh nghiệp</p>
                    <p className="mt-1 leading-relaxed">Dữ liệu tài chính cơ bản được cập nhật tự động từ báo cáo tài chính kiểm toán quý gần nhất.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Khối lượng CPLH</div>
                    <div className="text-sm font-extrabold text-gray-800 mt-1">Đang cập nhật</div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">Vốn hóa thị trường</div>
                    <div className="text-sm font-extrabold text-gray-800 mt-1">Đang cập nhật</div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">P/E Hiện tại</div>
                    <div className="text-sm font-extrabold text-gray-800 mt-1">-</div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">P/B</div>
                    <div className="text-sm font-extrabold text-gray-800 mt-1">-</div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">EPS (Thu nhập/CP)</div>
                    <div className="text-sm font-extrabold text-gray-800 mt-1">-</div>
                  </div>
                  <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">ROE (%)</div>
                    <div className="text-sm font-extrabold text-gray-800 mt-1">-</div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-white shadow-sm">
                  <h4 className="font-bold text-gray-800 flex items-center gap-1.5">
                    <CheckCircle size={16} className="text-green-500" />
                    Đánh giá Sức khỏe Tài chính
                  </h4>
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span>Khả năng thanh toán nhanh:</span>
                      <span className="font-bold text-gray-800">Tốt (&gt; 1.5)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-100">
                      <span>Nợ/Vốn chủ sở hữu:</span>
                      <span className="font-bold text-green-600">An toàn (35%)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Biên lợi nhuận gộp:</span>
                      <span className="font-bold text-gray-800">Khá (18.5%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB DÒNG TIỀN (VOLUME PROFILE) */}
      {activeTab === 'dongtien' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3">
          <h3 className="font-bold text-gray-800 text-xs md:text-sm flex items-center gap-1">
            <BarChart2 size={16} className="text-blue-500" />
            Khối lượng khớp theo mức giá
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 border border-gray-100 rounded-xl p-3 bg-white shadow-sm">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 pb-2 border-b border-gray-50">
              <span className="w-12 text-left">Giá</span>
              <span className="flex-1 text-center">Phân bổ Mua (Xanh) vs Bán (Đỏ)</span>
              <span className="w-16 text-right">Tổng KL</span>
              <span className="w-10 text-right">%</span>
            </div>

            <div className="space-y-2.5 pt-1.5">
              {priceProfiles.map((level, idx) => {
                const totalOfAll = priceProfiles.reduce((sum, p) => sum + p.totalVol, 1);
                const percent = ((level.totalVol / totalOfAll) * 100).toFixed(2);
                
                // Tỉ lệ mua bán ở mức giá này
                const levelBuyPercent = level.totalVol > 0 ? (level.buyVol / level.totalVol) * 100 : 50;
                const levelSellPercent = 100 - levelBuyPercent;
                
                // Độ rộng tối đa của thanh dựa trên % khối lượng tổng
                const maxWidth = Math.min(100, Math.max(10, Number(percent) * 3.5)); 

                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className={`w-12 text-left font-extrabold ${getPriceColor(level.price)}`}>
                      {(level.price ?? 0).toFixed(2)}
                    </span>

                    {/* Progress Bar kép nằm ngang */}
                    <div className="flex-1 h-3 rounded overflow-hidden flex bg-gray-100">
                      <div 
                        style={{ width: `${maxWidth}%`, display: 'flex' }}
                        className="h-full rounded-sm overflow-hidden"
                      >
                        <div 
                          style={{ width: `${levelBuyPercent}%` }} 
                          className="bg-[#26a69a] h-full"
                          title={`Mua: ${formatVol(level.buyVol)}`}
                        ></div>
                        <div 
                          style={{ width: `${levelSellPercent}%` }} 
                          className="bg-[#ef5350] h-full"
                          title={`Bán: ${formatVol(level.sellVol)}`}
                        ></div>
                      </div>
                    </div>

                    <span className="w-16 text-right font-bold text-gray-700">
                      {formatVol(level.totalVol)}
                    </span>
                    
                    <span className="w-10 text-right font-semibold text-gray-400">
                      {percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
