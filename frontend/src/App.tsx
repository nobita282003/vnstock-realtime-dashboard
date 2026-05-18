import React, { useState, useEffect } from 'react';
import { Search, Settings, Expand, LayoutGrid, ChevronDown, Star, Menu, Eye, EyeOff, ChevronUp, BookOpen } from 'lucide-react';
import { TVChart } from './components/TVChart';
import { fetchOHLCV } from './services/api';
import { WatchlistSidebar } from './components/WatchlistSidebar';
import { SessionPanel } from './components/SessionPanel';

const RESOLUTIONS = [
  { label: '1 phút', value: '1', group: 'PHÚT' },
  { label: '3 phút', value: '3', group: 'PHÚT' },
  { label: '5 phút', value: '5', group: 'PHÚT' },
  { label: '15 phút', value: '15', group: 'PHÚT' },
  { label: '30 phút', value: '30', group: 'PHÚT' },
  { label: '1 giờ', value: '60', group: 'GIỜ' },
  { label: '2 giờ', value: '120', group: 'GIỜ' },
  { label: '4 giờ', value: '240', group: 'GIỜ' },
  { label: '1 ngày', value: '1D', group: 'NGÀY', isDefault: true },
  { label: '1 tuần', value: '1W', group: 'NGÀY' },
  { label: '1 tháng', value: '1M', group: 'NGÀY' },
];

function App() {
  const [symbol, setSymbol] = useState('FPT');
  const [searchInput, setSearchInput] = useState('FPT');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolution, setResolution] = useState(RESOLUTIONS.find(r => r.isDefault)!);

  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);

  // States quản lý 3 cột (Watchlist - Chart - Session detail)
  const [watchlistOpen, setWatchlistOpen] = useState(window.innerWidth > 768);
  const [sessionPanelOpen, setSessionPanelOpen] = useState(window.innerWidth > 1024);
  const [mobileActiveTab, setMobileActiveTab] = useState<'chart' | 'session'>('chart');

  // Trạng thái cho chú thích & chỉ báo
  const [legendExpanded, setLegendExpanded] = useState(true);
  const [indicators, setIndicators] = useState({
    sma10: true,
    sma20: true,
    macd: true,
    volume: true,
    bollinger: false
  });



  const toggleIndicator = (key: keyof typeof indicators) => {
    setIndicators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Tải dữ liệu chính với cơ chế tự động làm mới (Polling Real-time) mỗi 10 giây
  useEffect(() => {
    let active = true;

    const loadData = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      const to = Math.floor(Date.now() / 1000);

      let days = 365 * 5; // Tải 5 năm dữ liệu để đảm bảo đủ dài test thuật toán
      if (resolution.group === 'PHÚT' || resolution.group === 'GIỜ') {
        days = 60;
      }

      const from = to - days * 24 * 60 * 60;
      try {
        const res = await fetchOHLCV(symbol, from, to, resolution.value);
        if (active) {
          setData(res);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu OHLCV:", error);
      } finally {
        if (isInitial && active) setLoading(false);
      }
    };

    // Tải dữ liệu lần đầu tiên (hiển thị loading spinner)
    loadData(true);

    // Thiết lập Polling cập nhật dữ liệu sau mỗi 10 giây (không hiện loading spinner để tránh gián đoạn trải nghiệm)
    const intervalId = setInterval(() => {
      loadData(false);
    }, 10000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [symbol, resolution]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSymbol(searchInput.trim().toUpperCase());
    }
  };

  const handleSelectResolution = (res: any) => {
    setResolution(res);
    setShowTimeframeMenu(false);
  };

  const latestData = data.length > 0 ? data[data.length - 1] : null;
  const prevData = data.length > 1 ? data[data.length - 2] : null;

  const getColor = (current: number, prev: number) => {
    if (!prev) return 'text-gray-500';
    return current >= prev ? 'text-green-600' : 'text-red-500';
  };

  // Thuật toán giao dịch: SỰ ĐỒNG THUẬN KÉP (Dual Confirmation - Đỉnh cao Thực chiến)
  // Kết hợp hoàn hảo giữa Hành động giá (MA20) và Động lượng (MACD)
  // Tiêu chí: Lọc SẠCH tín hiệu nhiễu, không đoán đáy, BẮT TRỌN SIÊU SÓNG từ gốc đến ngọn.
  const calculateTradingSignals = () => {
    if (!data || data.length < 50) return { markers: [], trades: [], sma10: [], sma20: [] };

    const markers: any[] = [];
    const trades: any[] = [];
    const sma10: (number | null)[] = [];
    const sma20: (number | null)[] = [];
    
    // 1. Tính SMA 10, 20
    let sum10 = 0, sum20 = 0;
    for (let i = 0; i < data.length; i++) {
      sum10 += data[i].close;
      sum20 += data[i].close;
      if (i >= 10) sum10 -= data[i - 10].close;
      if (i >= 20) sum20 -= data[i - 20].close;
      sma10[i] = i >= 9 ? sum10 / 10 : null;
      sma20[i] = i >= 19 ? sum20 / 20 : null;
    }

    // 2. Hàm tính EMA cho MACD
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

    // 3. Tính MACD (12, 26, 9)
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

      // --- TRẠNG THÁI THỊ TRƯỜNG (CỐT LÕI THUẬT TOÁN) ---
      
      // 1. TRẠNG THÁI BULLISH (TĂNG MẠNH):
      // Đòi hỏi sự đồng thuận: Giá BẮT BUỘC phải nằm trên MA20 (xu hướng tăng) VÀ MACD phải > 0 (động lượng mạnh)
      const currentlyBullish = currHist > 0 && currClose > currMA20;
      const previouslyBullish = prevHist > 0 && prevClose > prevMA20;

      // 2. TRẠNG THÁI BEARISH (GIẢM MẠNH):
      // Sự đồng thuận: Giá thủng dưới MA20 VÀ MACD âm
      const currentlyBearish = currHist < 0 && currClose < currMA20;

      // --- TÍN HIỆU MUA CHUẨN ---
      // CHỈ MUA khi thị trường CHÍNH THỨC bước vào trạng thái Bullish (chuyển từ chưa Bullish sang Bullish).
      // Điều kiện này giải quyết triệt để 2 việc:
      // + Bắt trọn chân sóng (Ngay khi 2 yếu tố hội tụ)
      // + Bỏ qua TẤT CẢ các điểm nhiễu khi MACD xanh nhưng giá vẫn cắm đầu dưới MA20 (downtrend).
      const isBuy = currentlyBullish && !previouslyBullish;

      // --- TÍN HIỆU BÁN CHUẨN ---
      // 1. Chốt Lời / Cắt Lỗ Theo Xu Hướng: Bán khi trạng thái Bearish được xác nhận (Cả Giá và MACD đều vỡ)
      // Nếu chỉ 1 yếu tố vỡ (ví dụ rũ bỏ nhẹ qua MA20 nhưng MACD vẫn xanh) -> GIỮ HÀNG.
      const isTrendBroken = currentlyBearish;

      // 2. Trailing Stop (Chặn lãi bảo toàn thành quả): 
      // Không để một khoản lãi lớn biến thành lỗ. Mất 8% từ đỉnh cao nhất -> BÁN.
      const isTrailingStop = isHolding && currClose < highestPriceSinceBuy * 0.92;
      
      // 3. Stoploss Khẩn Cấp (Gãy Nền Trọng Yếu):
      // Nếu giá bất ngờ sập mạnh mất hơn 4% dưới MA20 (bán tháo bất chấp MACD có kịp phản ứng hay không) -> BÁN.
      const isCatastrophicStop = currClose < currMA20 * 0.96;

      const isSell = isTrendBroken || isTrailingStop || isCatastrophicStop;

      // --- KÍCH HOẠT LỆNH ---
      if (!isHolding && isBuy) {
        markers.push({
          time: data[i].time,
          position: 'belowBar',
          color: '#2962FF', // Xanh dương
          shape: 'arrowUp',
          text: `MUA ${(currClose).toFixed(2)}`,
          size: 2
        });
        trades.push({ type: 'MUA', price: currClose, time: data[i].time, index: i });
        highestPriceSinceBuy = currClose; // Lưu vết đỉnh mới
      } 
      else if (isHolding && isSell) {
        markers.push({
          time: data[i].time,
          position: 'aboveBar',
          color: '#E91E63', // Hồng/Đỏ
          shape: 'arrowDown',
          text: `BÁN ${(currClose).toFixed(2)}`,
          size: 2
        });
        trades.push({ type: 'BÁN', price: currClose, time: data[i].time, index: i });
      }
    }

    return { markers, trades, sma10, sma20 };
  };

  const { markers, trades, sma10, sma20 } = calculateTradingSignals();

  const latestSma10 = sma10.length > 0 ? sma10[sma10.length - 1] : null;
  const latestSma20 = sma20.length > 0 ? sma20[sma20.length - 1] : null;

  // Lấy ra thông tin Trade (Giao dịch) gần nhất để hiển thị ra Bảng
  let tradeSummary = null;
  if (trades.length > 0 && latestData) {
    const last = trades[trades.length - 1];
    if (last.type === 'MUA') {
      // Lệnh đang mở (Đang nắm giữ)
      const daysHeld = Math.floor((latestData.time - last.time) / (24 * 60 * 60)); // Tính nhẩm T+
      const profit = ((latestData.close - last.price) / last.price) * 100;
      tradeSummary = {
        status: 'BÁO MUA',
        date: new Date(last.time * 1000).toISOString().split('T')[0],
        entryPrice: last.price.toFixed(2),
        tPlus: daysHeld,
        profit: profit.toFixed(2),
        target: (last.price * 1.15).toFixed(2), // Mục tiêu +15%
        cutloss: (last.price * 0.93).toFixed(2), // Cắt lỗ -7%
        isClosed: false
      };
    } else {
      // Lệnh đã đóng (Vừa báo Bán)
      // Tìm lệnh Mua gần nhất trước đó để tính toán
      let prevBuy = null;
      for (let i = trades.length - 2; i >= 0; i--) {
        if (trades[i].type === 'MUA') {
          prevBuy = trades[i];
          break;
        }
      }
      if (prevBuy) {
        const daysHeld = Math.floor((last.time - prevBuy.time) / (24 * 60 * 60));
        const profit = ((last.price - prevBuy.price) / prevBuy.price) * 100;
        tradeSummary = {
          status: 'BÁO BÁN',
          buyDate: new Date(prevBuy.time * 1000).toISOString().split('T')[0],
          sellDate: new Date(last.time * 1000).toISOString().split('T')[0],
          entryPrice: prevBuy.price.toFixed(2),
          sellPrice: last.price.toFixed(2),
          tPlus: daysHeld,
          profit: profit.toFixed(2),
          isClosed: true
        };
      }
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white text-[#131722] font-sans overflow-hidden">
      {/* TOP TOOLBAR - Tương thích Mobile */}
      <div className="h-12 md:h-14 border-b border-gray-200 flex items-center justify-between px-2 md:px-4 text-xs md:text-sm bg-white shrink-0 relative z-50">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Nút đóng mở Watchlist bên trái */}
          <button
            onClick={() => setWatchlistOpen(!watchlistOpen)}
            className={`p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700 flex items-center justify-center ${watchlistOpen ? 'bg-blue-50 text-blue-600' : ''}`}
            title="Đóng/Mở Watchlist"
          >
            <Menu size={18} />
          </button>

          <div className="font-bold text-blue-600 text-base md:text-lg mx-1 flex items-center gap-1">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-600 text-white rounded flex items-center justify-center shadow-sm">T</div>
            <span className="hidden sm:inline">TVClone</span>
          </div>

          {/* Ô Tìm kiếm */}
          <form onSubmit={handleSearch} className="flex items-center hover:bg-gray-100 px-2 py-1 md:py-1.5 rounded cursor-pointer border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-colors min-w-[90px]">
            <Search size={14} className="text-gray-500 mr-1 md:mr-2" />
            <input
              className="w-14 md:w-20 font-bold bg-transparent outline-none uppercase text-base md:text-sm"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="MÃ CK"
            />
          </form>

          <div className="h-4 w-[1px] bg-gray-300 mx-1"></div>

          {/* Timeframe Dropdown */}
          <div className="relative">
            <div
              className="flex items-center gap-1 md:gap-2 px-2 hover:bg-gray-100 rounded py-1 md:py-1.5 cursor-pointer font-semibold"
              onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
            >
              <span className="text-xs md:text-sm">{resolution.label}</span>
              <ChevronDown size={14} className="text-gray-500" />
            </div>

            {showTimeframeMenu && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 shadow-xl rounded py-2 w-48 md:w-56 z-50 text-xs md:text-sm overflow-hidden">
                {['PHÚT', 'GIỜ', 'NGÀY'].map(group => (
                  <div key={group}>
                    <div className="px-3 py-1 text-[10px] md:text-xs text-gray-400 font-bold bg-gray-50 border-y border-gray-100">{group}</div>
                    {RESOLUTIONS.filter(r => r.group === group).map(r => (
                      <div
                        key={r.value}
                        onClick={() => handleSelectResolution(r)}
                        className={`px-4 py-1.5 cursor-pointer flex justify-between items-center transition-colors ${resolution.value === r.value
                            ? 'bg-blue-600 text-white font-medium'
                            : 'hover:bg-gray-100'
                          }`}
                      >
                        {r.label}
                        <Star size={12} className={resolution.value === r.value ? "fill-white text-white" : "text-gray-300 hover:text-yellow-400"} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nút bên phải (ẩn bớt trên mobile) */}
        <div className="flex items-center gap-1.5 text-gray-600 shrink-0">
          {/* Nút đóng mở Số liệu phiên bên phải */}
          <button
            onClick={() => setSessionPanelOpen(!sessionPanelOpen)}
            className={`p-1.5 hover:bg-gray-100 rounded transition-colors hidden md:flex items-center gap-1 font-bold text-xs ${sessionPanelOpen ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500'}`}
            title="Đóng/Mở Số liệu phiên"
          >
            <BookOpen size={16} />
            <span>Chi tiết phiên</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-300 hidden md:block"></div>

          <div className="hidden md:flex p-1.5 hover:bg-gray-100 rounded cursor-pointer transition-colors"><LayoutGrid size={16} /></div>
          <div className="hidden sm:flex p-1.5 hover:bg-gray-100 rounded cursor-pointer transition-colors"><Settings size={16} /></div>
          <div className="hidden sm:flex p-1.5 hover:bg-gray-100 rounded cursor-pointer transition-colors"><Expand size={16} /></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* CỘT 1: WATCHLIST SIDEBAR (BÊN TRÁI) */}
        <WatchlistSidebar
          activeSymbol={symbol}
          onSelectSymbol={(sym) => {
            setSymbol(sym);
            setSearchInput(sym);
          }}
          isOpen={watchlistOpen}
          onToggle={() => setWatchlistOpen(!watchlistOpen)}
        />

        {/* CONTAINER PHẢI: CHỨA BIỂU ĐỒ VÀ CHI TIẾT PHIÊN */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TAB ĐIỀU HƯỚNG TRÊN MOBILE */}
          <div className="flex md:hidden border-b border-gray-200 shrink-0 bg-gray-50/50 p-1 gap-1">
            <button
              onClick={() => setMobileActiveTab('chart')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${mobileActiveTab === 'chart'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-200'
                }`}
            >
              Biểu đồ kỹ thuật
            </button>
            <button
              onClick={() => setMobileActiveTab('session')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${mobileActiveTab === 'session'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-200'
                }`}
            >
              Số liệu phiên
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* MOBILE TRADE SUMMARY (Chỉ hiện trên mobile, dạng dải ngang nhỏ gọn) */}
            {tradeSummary && mobileActiveTab === 'chart' && (
              <div className="md:hidden w-full bg-[#f8fdfc] border-b border-[#a2dcd6] px-3 py-2 flex justify-between items-center text-xs z-20 shrink-0 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${tradeSummary.status === 'BÁO MUA' ? 'bg-[#2962FF]' : 'bg-[#E91E63]'} animate-pulse`}></div>
                  <span className={`font-extrabold ${tradeSummary.status === 'BÁO MUA' ? 'text-[#2962FF]' : 'text-[#E91E63]'}`}>
                    {tradeSummary.status} {tradeSummary.status === 'BÁO MUA' ? tradeSummary.entryPrice : tradeSummary.sellPrice}
                  </span>
                </div>
                {!tradeSummary.isClosed ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[#0d47a1] font-semibold">T+{tradeSummary.tPlus}</span>
                    <span className={`font-bold ${Number(tradeSummary.profit) >= 0 ? 'text-[#1b5e20]' : 'text-[#b71c1c]'}`}>
                      {Number(tradeSummary.profit) > 0 ? '+' : ''}{tradeSummary.profit}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-semibold">Lãi/Lỗ:</span>
                    <span className={`font-bold ${Number(tradeSummary.profit) >= 0 ? 'text-[#1b5e20]' : 'text-[#b71c1c]'}`}>
                      {Number(tradeSummary.profit) > 0 ? '+' : ''}{tradeSummary.profit}%
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* CỘT 2: MAIN CHART AREA (GIỮA) */}
            <div className={`flex-1 flex flex-col relative bg-white overflow-hidden ${mobileActiveTab === 'chart' ? 'flex' : 'hidden md:flex'
              }`}>
              {/* Chart Header Info (Chú thích & Bật/Tắt) */}
              <div className="absolute top-2 left-2 md:top-3 md:left-4 z-10 pointer-events-auto flex flex-col items-start p-1.5 md:p-2 bg-white/60 rounded-lg backdrop-blur shadow-sm border border-gray-100">
                {/* Tên mã và khung giờ */}
                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm flex-wrap cursor-default">
                  <span className="font-extrabold text-xl md:text-2xl tracking-tight text-gray-800 drop-shadow-sm">{symbol}</span>
                  <span className="text-gray-500 font-medium px-1.5 py-0.5 bg-gray-100 rounded text-[10px] md:text-xs">{resolution.label}</span>

                  {/* Glowing Green LIVE badge indicating real-time updates */}
                  <span className="flex items-center gap-1 bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full text-[9px] md:text-[10px] border border-green-200/40 shadow-sm shrink-0">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    <span>LIVE</span>
                  </span>

                  <div
                    className="p-1 hover:bg-gray-200/80 rounded cursor-pointer text-gray-500 transition-colors ml-1"
                    onClick={() => setLegendExpanded(!legendExpanded)}
                  >
                    <ChevronUp size={16} className={`transform transition-transform ${legendExpanded ? 'rotate-0' : 'rotate-180'}`} />
                  </div>
                </div>

                {/* OHLC Values */}
                {latestData && legendExpanded && (
                  <div className="flex gap-2 md:gap-3 text-[10px] md:text-xs font-semibold mt-1.5 ml-1">
                    <span className="text-gray-500">O<span className={`ml-1 ${getColor(latestData.open, prevData?.close)}`}>{latestData.open.toFixed(2)}</span></span>
                    <span className="text-gray-500">H<span className={`ml-1 ${getColor(latestData.high, prevData?.close)}`}>{latestData.high.toFixed(2)}</span></span>
                    <span className="text-gray-500">L<span className={`ml-1 ${getColor(latestData.low, prevData?.close)}`}>{latestData.low.toFixed(2)}</span></span>
                    <span className="text-gray-500">C<span className={`ml-1 ${getColor(latestData.close, prevData?.close)}`}>{latestData.close.toFixed(2)}</span></span>
                  </div>
                )}

                {/* Danh sách Chỉ báo (Bật/Tắt) */}
                {legendExpanded && (
                  <div className="flex flex-col mt-2 gap-0.5 ml-1 select-none">

                    {/* SMA 10 Toggle */}
                    {latestSma10 && (
                      <div className="flex items-center gap-2 text-[10px] md:text-xs group hover:bg-gray-100/50 p-1 rounded">
                        <div onClick={() => toggleIndicator('sma10')} className="cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity">
                          {indicators.sma10 ? <Eye size={14} className="text-blue-600" /> : <EyeOff size={14} className="text-gray-400" />}
                        </div>
                        <span className={`font-semibold ${indicators.sma10 ? 'text-blue-600' : 'text-gray-400'}`}>MA Cross 10</span>
                        <span className="text-gray-600 font-medium">{latestSma10.toFixed(2)}</span>
                      </div>
                    )}

                    {/* SMA 20 Toggle */}
                    {latestSma20 && (
                      <div className="flex items-center gap-2 text-[10px] md:text-xs group hover:bg-gray-100/50 p-1 rounded">
                        <div onClick={() => toggleIndicator('sma20')} className="cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity">
                          {indicators.sma20 ? <Eye size={14} className="text-blue-600" /> : <EyeOff size={14} className="text-gray-400" />}
                        </div>
                        <span className={`font-semibold ${indicators.sma20 ? 'text-orange-500' : 'text-gray-400'}`}>MA Cross 20</span>
                        <span className="text-gray-600 font-medium">{latestSma20.toFixed(2)}</span>
                      </div>
                    )}

                    {/* MACD Toggle */}
                    <div className="flex items-center gap-2 text-[10px] md:text-xs group hover:bg-gray-100/50 p-1 rounded">
                      <div onClick={() => toggleIndicator('macd')} className="cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity">
                        {indicators.macd ? <Eye size={14} className="text-blue-600" /> : <EyeOff size={14} className="text-gray-400" />}
                      </div>
                      <span className={`font-semibold ${indicators.macd ? 'text-purple-600' : 'text-gray-400'}`}>MACD (12, 26, 9)</span>
                    </div>

                    {/* Bollinger Bands Toggle */}
                    <div className="flex items-center gap-2 text-[10px] md:text-xs group hover:bg-gray-100/50 p-1 rounded">
                      <div onClick={() => toggleIndicator('bollinger')} className="cursor-pointer opacity-50 group-hover:opacity-100 transition-opacity">
                        {indicators.bollinger ? <Eye size={14} className="text-teal-600" /> : <EyeOff size={14} className="text-gray-400" />}
                      </div>
                      <span className={`font-semibold ${indicators.bollinger ? 'text-teal-600' : 'text-gray-400'}`}>Fansi Band 20, 2</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bảng thống kê lệnh Mua/Bán nổi ở góc phải trên cùng (Chỉ Desktop) */}
              {tradeSummary && (
                <div className="hidden md:block absolute top-3 right-16 md:right-20 z-20 select-none">
                  <table className="border-collapse text-[10px] md:text-xs font-bold bg-[#f7fdfd]/95 backdrop-blur-sm border border-[#a2dcd6] shadow-lg rounded-lg overflow-hidden text-gray-700 w-44 md:w-48">
                    <tbody>
                      {/* Dòng Header */}
                      <tr className="bg-[#e2f7f5]/80">
                        <td className="px-2.5 py-1.5 border border-[#a2dcd6] text-center text-[#c2185b] font-extrabold tracking-wide text-xs">
                          {tradeSummary.status}
                        </td>
                        <td className="px-2.5 py-1.5 border border-[#a2dcd6] text-center text-[#c2185b] font-extrabold text-xs">
                          {tradeSummary.status === 'BÁO MUA' ? tradeSummary.entryPrice : tradeSummary.sellPrice}
                        </td>
                      </tr>

                      {!tradeSummary.isClosed ? (
                        // ĐANG NẮM GIỮ (LỆNH MUA)
                        <>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              Ngày Báo
                            </td>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-center text-[#0d47a1]">
                              {tradeSummary.date}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              T+
                            </td>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-center text-[#0d47a1]">
                              {tradeSummary.tPlus}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              Đang lãi:
                            </td>
                            <td className={`px-2.5 py-1 border border-[#a2dcd6] text-center ${Number(tradeSummary.profit) >= 0 ? 'text-[#1b5e20]' : 'text-[#b71c1c]'}`}>
                              {Number(tradeSummary.profit) > 0 ? '+' : ''}{tradeSummary.profit}%
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              Mục tiêu
                            </td>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-center text-[#1b5e20]">
                              {tradeSummary.target}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              Cắt lỗ
                            </td>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-center text-[#b71c1c]">
                              {tradeSummary.cutloss}
                            </td>
                          </tr>
                        </>
                      ) : (
                        // ĐÃ ĐÓNG LỆNH (BÁO BÁN)
                        <>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              Ngày Mua
                            </td>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-center text-gray-600">
                              {tradeSummary.buyDate}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              Giá Mua
                            </td>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-center text-gray-700">
                              {tradeSummary.entryPrice}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              Ngày Bán
                            </td>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-center text-gray-600">
                              {tradeSummary.sellDate}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              Giá Bán
                            </td>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-center text-gray-700">
                              {tradeSummary.sellPrice}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-2.5 py-1 border border-[#a2dcd6] text-left text-[#0d47a1] font-semibold pl-3">
                              Kết quả
                            </td>
                            <td className={`px-2.5 py-1 border border-[#a2dcd6] text-center ${Number(tradeSummary.profit) >= 0 ? 'text-[#1b5e20]' : 'text-[#b71c1c]'}`}>
                              {Number(tradeSummary.profit) > 0 ? '+' : ''}{tradeSummary.profit}%
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white/60 backdrop-blur-sm">
                  <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="mt-4 font-semibold text-gray-600 text-xs md:text-sm">Đang tải dữ liệu...</span>
                </div>
              )}

              {/* The Chart */}
              <div className="flex-1 w-full h-full p-1 relative z-0">
                <TVChart data={data} indicators={indicators} markers={markers} chartId={`${symbol}-${resolution.value}`} />
              </div>
            </div>

            {/* CỘT 3: SESSION DETAIL PANEL (BÊN PHẢI) */}
            <div
              className={`${sessionPanelOpen ? 'w-80 md:w-96 border-l border-gray-200' : 'w-0 overflow-hidden'
                } h-full bg-white transition-all duration-300 shrink-0 ${mobileActiveTab === 'session'
                  ? 'flex w-full z-30'
                  : sessionPanelOpen ? 'hidden md:flex' : 'hidden'
                }`}
            >
              <SessionPanel symbol={symbol} latestData={latestData} prevData={prevData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
