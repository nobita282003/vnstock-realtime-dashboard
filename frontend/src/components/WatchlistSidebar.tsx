import React, { useState, useEffect } from 'react';
import { Search, Star, X, ChevronDown } from 'lucide-react';

interface WatchlistSidebarProps {
  activeSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface StockItem {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  changePercent: number;
  weekChangePercent: number;
  volumeBillions: number;
}

export const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({
  activeSymbol,
  onSelectSymbol,
  isOpen,
  onToggle
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<'tangmanh' | 'giammanh' | 'bungno' | 'cancung'>('tangmanh');
  const [limit15, setLimit15] = useState(true);

  // Danh sách các cổ phiếu chính gieo hạt (mặc định lấy theo mockup ban đầu)
  const [stocks] = useState<StockItem[]>([
    { symbol: 'GAS', name: 'PetroVietnam Gas', exchange: 'HOSE', price: 89.40, changePercent: 6.94, weekChangePercent: 19.68, volumeBillions: 435.8 },
    { symbol: 'PHR', name: 'Phuoc Hoa Rubber', exchange: 'HOSE', price: 71.30, changePercent: 6.90, weekChangePercent: 11.58, volumeBillions: 135.3 },
    { symbol: 'PLX', name: 'Petrolimex', exchange: 'HOSE', price: 42.20, changePercent: 5.90, weekChangePercent: 12.23, volumeBillions: 380.4 },
    { symbol: 'DXS', name: 'Dat Xanh Services', exchange: 'HOSE', price: 8.50, changePercent: 5.20, weekChangePercent: 11.55, volumeBillions: 63.3 },
    { symbol: 'BSR', name: 'Binh Son Refining', exchange: 'UPCOM', price: 31.75, changePercent: 4.96, weekChangePercent: 22.35, volumeBillions: 608.9 },
    { symbol: 'TAL', name: 'Talon Group', exchange: 'HOSE', price: 45.95, changePercent: 4.55, weekChangePercent: 5.63, volumeBillions: 37.2 },
    { symbol: 'PAN', name: 'The PAN Group', exchange: 'HOSE', price: 32.95, changePercent: 4.44, weekChangePercent: 0.61, volumeBillions: 94.5 },
    { symbol: 'GVR', name: 'Vietnam Rubber Group', exchange: 'HOSE', price: 37.75, changePercent: 4.28, weekChangePercent: 5.74, volumeBillions: 251.6 },
    { symbol: 'NVL', name: 'Novaland', exchange: 'HOSE', price: 17.30, changePercent: 3.90, weekChangePercent: 0.58, volumeBillions: 536.3 },
    { symbol: 'SAB', name: 'Sabeco', exchange: 'HOSE', price: 48.55, changePercent: 3.30, weekChangePercent: 4.97, volumeBillions: 79.5 },
    { symbol: 'FPT', name: 'FPT Corporation', exchange: 'HOSE', price: 115.20, changePercent: 1.58, weekChangePercent: 4.50, volumeBillions: 890.5 },
    { symbol: 'HPG', name: 'Hoa Phat Group', exchange: 'HOSE', price: 26.55, changePercent: -1.85, weekChangePercent: 3.20, volumeBillions: 1205.3 },
    { symbol: 'SSI', name: 'SSI Securities', exchange: 'HOSE', price: 34.80, changePercent: -2.35, weekChangePercent: -1.50, volumeBillions: 670.2 },
    { symbol: 'VNM', name: 'Vinamilk', exchange: 'HOSE', price: 68.40, changePercent: 0.29, weekChangePercent: -0.80, volumeBillions: 240.1 },
    { symbol: 'VIC', name: 'Vingroup', exchange: 'HOSE', price: 42.15, changePercent: -6.95, weekChangePercent: -10.20, volumeBillions: 580.4 },
    { symbol: 'TCB', name: 'Techcombank', exchange: 'HOSE', price: 46.20, changePercent: -1.20, weekChangePercent: 2.10, volumeBillions: 710.6 },
    { symbol: 'VCB', name: 'Vietcombank', exchange: 'HOSE', price: 92.50, changePercent: -0.11, weekChangePercent: 1.80, volumeBillions: 190.5 },
    { symbol: 'VND', name: 'VNDIRECT Securities', exchange: 'HOSE', price: 19.85, changePercent: 1.43, weekChangePercent: 5.60, volumeBillions: 430.7 },
    { symbol: 'MWG', name: 'Mobile World', exchange: 'HOSE', price: 58.70, changePercent: -3.18, weekChangePercent: -2.50, volumeBillions: 520.1 },
    { symbol: 'DGC', name: 'Duc Giang Chemicals', exchange: 'HOSE', price: 112.50, changePercent: -0.53, weekChangePercent: 12.80, volumeBillions: 340.9 },
    { symbol: 'VRE', name: 'Vincom Retail', exchange: 'HOSE', price: 21.40, changePercent: -4.50, weekChangePercent: -8.10, volumeBillions: 110.2 },
    { symbol: 'MSN', name: 'Masan Group', exchange: 'HOSE', price: 72.80, changePercent: -5.10, weekChangePercent: -3.80, volumeBillions: 220.5 },
    { symbol: 'STB', name: 'Sacombank', exchange: 'HOSE', price: 28.90, changePercent: 0.85, weekChangePercent: 2.45, volumeBillions: 615.4 },
    { symbol: 'MBB', name: 'MB Bank', exchange: 'HOSE', price: 22.45, changePercent: 1.15, weekChangePercent: 3.50, volumeBillions: 490.8 },
    { symbol: 'ACB', name: 'ACB Bank', exchange: 'HOSE', price: 27.30, changePercent: 0.35, weekChangePercent: 1.20, volumeBillions: 310.2 }
  ]);

  // Tạm khóa chức năng Polling để chờ API Bảng Giá thật
  useEffect(() => {
    // UI tĩnh, không nhảy số ảo và không gọi API biểu đồ bị sai giá
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectSymbol(searchInput.trim().toUpperCase());
      setSearchInput('');
    }
  };

  // Lọc theo thanh tìm kiếm ở đầu
  const searchedStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchInput.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchInput.toLowerCase())
  );

  // Sắp xếp các danh mục lọc trong phiên
  const sortedStocks = [...searchedStocks].sort((a, b) => {
    if (activeTab === 'tangmanh') {
      return b.changePercent - a.changePercent;
    }
    if (activeTab === 'giammanh') {
      return a.changePercent - b.changePercent;
    }
    if (activeTab === 'bungno') {
      return b.volumeBillions - a.volumeBillions;
    }
    if (activeTab === 'cancung') {
      return a.volumeBillions - b.volumeBillions;
    }
    return 0;
  });

  // Giới hạn 15 mã hoặc hiển thị đầy đủ
  const displayedStocks = limit15 ? sortedStocks.slice(0, 15) : sortedStocks;

  return (
    <div 
      className={`h-full border-r border-gray-200 bg-white flex flex-col transition-all duration-300 relative select-none z-40 ${
        isOpen ? 'w-80 md:w-88' : 'w-0 overflow-hidden border-r-0'
      }`}
    >
      {/* WATCHLIST HEADER */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/80">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="font-bold text-gray-800 text-sm">Lọc cổ phiếu trong phiên</span>
        </div>
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-600 md:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* THANH TÌM KIẾM NHANH */}
      <form onSubmit={handleSearchSubmit} className="p-3 border-b border-gray-100 shrink-0 bg-white">
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus-within:border-blue-500 focus-within:bg-white transition-all">
          <Search size={14} className="text-gray-400 mr-2" />
          <input
            type="text"
            className="w-full bg-transparent outline-none text-xs text-gray-800 font-semibold"
            placeholder="Tìm nhanh mã CP (Enter để xem biểu đồ)..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
      </form>

      {/* 4 ĐẦU MỤC LỌC */}
      <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50 px-3 py-2 gap-1 text-[11px] font-extrabold shrink-0 items-center justify-between select-none">
        <div className="flex gap-3 overflow-x-auto py-1 scrollbar-none flex-1 pr-1">
          <button 
            onClick={() => setActiveTab('tangmanh')}
            className={`pb-1.5 transition-all relative whitespace-nowrap ${
              activeTab === 'tangmanh' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Tăng mạnh
          </button>
          <button 
            onClick={() => setActiveTab('giammanh')}
            className={`pb-1.5 transition-all relative whitespace-nowrap ${
              activeTab === 'giammanh' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Giảm mạnh
          </button>
          <button 
            onClick={() => setActiveTab('bungno')}
            className={`pb-1.5 transition-all relative whitespace-nowrap ${
              activeTab === 'bungno' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Bùng nổ
          </button>
          <button 
            onClick={() => setActiveTab('cancung')}
            className={`pb-1.5 transition-all relative whitespace-nowrap ${
              activeTab === 'cancung' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Cạn cung
          </button>
        </div>

        <div className="flex items-center gap-0.5 text-blue-600 cursor-pointer bg-blue-50 px-1.5 py-0.5 rounded text-[10px] shrink-0 font-extrabold hover:bg-blue-100">
          <span>1D</span>
          <ChevronDown size={10} />
        </div>
      </div>

      {/* TIÊU ĐỀ BẢNG LỌC */}
      <div className="grid grid-cols-12 px-3 py-2 bg-white text-[9px] md:text-[10px] font-bold text-gray-400 border-b border-gray-50 select-none uppercase tracking-wider">
        <span className="col-span-4 text-left">Mã / KLGD</span>
        <span className="col-span-2 text-right">Giá</span>
        <span className="col-span-3 text-center">% Hôm nay</span>
        <span className="col-span-3 text-center">% Tuần này</span>
      </div>

      {/* DANH SÁCH CỔ PHIẾU LỌC */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-50 bg-white">
        {displayedStocks.map((stock) => {
          const isActive = stock.symbol === activeSymbol;
          const isUp = stock.changePercent >= 0;
          const isWeekUp = stock.weekChangePercent >= 0;
          const isCeiling = stock.changePercent >= 6.9; // Trần/sàn HOSE (7%)
          
          let priceColor = 'text-green-600';
          if (isCeiling) priceColor = 'text-[#c2185b] font-extrabold'; // Màu tím trần
          else if (stock.changePercent === 0) priceColor = 'text-yellow-600';
          else if (stock.changePercent < 0) priceColor = 'text-red-500';

          return (
            <div
              key={stock.symbol}
              onClick={() => onSelectSymbol(stock.symbol)}
              className={`grid grid-cols-12 px-3 py-2.5 cursor-pointer items-center border-b border-gray-50/50 transition-all ${
                isActive 
                  ? 'bg-blue-50/70 border-l-4 border-blue-600 pl-2' 
                  : 'hover:bg-gray-50 border-l-4 border-transparent'
              }`}
            >
              {/* CỘT 1: MÃ & KLGD */}
              <div className="col-span-4 flex flex-col gap-0.5">
                <span className="font-extrabold text-xs md:text-sm text-gray-800">{stock.symbol}</span>
                <span className="text-[9px] text-gray-400 font-semibold">{stock.volumeBillions.toFixed(1)} Tỷ</span>
              </div>

              {/* CỘT 2: GIÁ */}
              <div className="col-span-2 text-right">
                <span className={`font-extrabold text-xs md:text-sm ${priceColor}`}>
                  {stock.price.toFixed(2)}
                </span>
              </div>

              {/* CỘT 3: % HÔM NAY BADGE */}
              <div className="col-span-3 flex justify-center">
                <div className={`w-16 py-1 text-[10px] md:text-xs font-bold rounded-lg text-center ${
                  isCeiling 
                    ? 'bg-[#fce4ec] text-[#c2185b]' 
                    : isUp 
                      ? 'bg-[#e8f5e9] text-[#2e7d32]' 
                      : 'bg-[#ffebee] text-[#c62828]'
                }`}>
                  {isUp && !isCeiling ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </div>
              </div>

              {/* CỘT 4: % TUẦN NÀY BADGE */}
              <div className="col-span-3 flex justify-center">
                <div className={`w-16 py-1 text-[10px] md:text-xs font-bold rounded-lg text-center ${
                  isWeekUp 
                    ? 'bg-[#e8f5e9] text-[#2e7d32]' 
                    : 'bg-[#ffebee] text-[#c62828]'
                }`}>
                  {isWeekUp ? '+' : ''}{stock.weekChangePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}

        {displayedStocks.length === 0 && (
          <div className="p-8 text-center text-xs text-gray-400">
            Không tìm thấy mã nào phù hợp.
          </div>
        )}
      </div>

      {/* NÚT XEM THÊM */}
      {sortedStocks.length > 15 && (
        <div 
          onClick={() => setLimit15(!limit15)}
          className="py-2.5 text-center text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-1 cursor-pointer select-none shrink-0"
        >
          <span>{limit15 ? 'Xem thêm' : 'Thu gọn'}</span>
          <ChevronDown size={14} className={`transform transition-transform ${limit15 ? '' : 'rotate-180'}`} />
        </div>
      )}
    </div>
  );
};
