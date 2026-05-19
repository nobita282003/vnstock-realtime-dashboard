import React, { useState, useEffect } from 'react';
import { Search, Clock, Filter, AlertCircle } from 'lucide-react';
import { fetchScreener } from '../services/api';

interface ScreenerResult {
    symbol: string;
    signal: 'MUA' | 'BÁN' | 'HOLD' | 'NONE';
    price: number;
    profit: number;
    tPlus: number | null;
}

interface ScreenerSidebarProps {
    activeSymbol: string;
    onSelectSymbol: (symbol: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

export const WatchlistSidebar: React.FC<ScreenerSidebarProps> = ({
    activeSymbol,
    onSelectSymbol,
    isOpen,
    onToggle
}) => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'MUA' | 'HOLD' | 'BÁN' | 'ALL'>('MUA');
    const [screenerData, setScreenerData] = useState<ScreenerResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(30);

    // Reset visible count khi đổi tab hoặc tìm kiếm để tối ưu render
    useEffect(() => {
        setVisibleCount(30);
    }, [activeTab, search]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
        // Nếu cuộn gần tới đáy (cách đáy 60px) thì tải tiếp 30 mã nữa
        if (scrollHeight - scrollTop <= clientHeight + 60) {
            setVisibleCount(prev => Math.min(prev + 30, filteredData.length));
        }
    };

    useEffect(() => {
        const loadScreener = async () => {
            setLoading(true);
            try {
                const data = await fetchScreener();
                // Sắp xếp dữ liệu ưu tiên lợi nhuận giảm dần (với HOLD) hoặc ngẫu nhiên
                if (data && Array.isArray(data)) {
                    data.sort((a, b) => b.profit - a.profit);
                    setScreenerData(data);
                }
            } catch (error) {
                console.error("Lỗi tải dữ liệu screener", error);
            } finally {
                setLoading(false);
            }
        };
        
        loadScreener();
        // Cập nhật bộ lọc mỗi 2 phút
        const interval = setInterval(loadScreener, 120000);
        return () => clearInterval(interval);
    }, []);

    // Lọc theo Tab và Search
    const filteredData = screenerData.filter(item => {
        // Nếu người dùng nhập tìm kiếm, tìm kiếm trên tất cả các mã (bỏ qua lọc tab)
        if (search) {
            return item.symbol.toLowerCase().includes(search.toLowerCase());
        }
        if (activeTab === 'ALL') return true;
        if (item.signal !== activeTab) return false;
        return true;
    });

    const getSignalColor = (signal: string) => {
        switch (signal) {
            case 'MUA': return 'bg-blue-600 text-white';
            case 'BÁN': return 'bg-pink-600 text-white';
            case 'HOLD': return 'bg-green-700 text-white';
            case 'NONE': return 'bg-gray-400 text-white';
            default: return 'bg-gray-400 text-white';
        }
    };

    return (
        <div className={`
            ${isOpen ? 'w-full md:w-80 border-r border-gray-200' : 'w-0 overflow-hidden'} 
            h-full flex flex-col bg-white transition-all duration-300 shrink-0 z-40 absolute md:relative shadow-xl md:shadow-none
        `}>
            {/* Header */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-blue-600" />
                    <span className="font-extrabold text-gray-800 text-sm">BỘ LỌC TÍN HIỆU</span>
                </div>
                {/* Đóng (chỉ trên mobile) */}
                <button onClick={onToggle} className="md:hidden p-1 text-gray-500 hover:text-gray-800">
                    ✕
                </button>
            </div>

            {/* Tìm kiếm */}
            <div className="p-3 border-b border-gray-100">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm mã..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-100 border-none rounded text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold uppercase"
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('ALL')}
                    className={`flex-1 py-2 text-[10px] md:text-xs font-bold transition-colors ${activeTab === 'ALL' ? 'text-gray-800 border-b-2 border-gray-800 bg-gray-100/50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    TẤT CẢ
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[9px]">{screenerData.length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('MUA')}
                    className={`flex-1 py-2 text-[10px] md:text-xs font-bold transition-colors ${activeTab === 'MUA' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    MUA
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px]">{screenerData.filter(d => d.signal === 'MUA').length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('HOLD')}
                    className={`flex-1 py-2 text-[10px] md:text-xs font-bold transition-colors ${activeTab === 'HOLD' ? 'text-green-700 border-b-2 border-green-700 bg-green-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    NẮM GIỮ
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px]">{screenerData.filter(d => d.signal === 'HOLD').length}</span>
                </button>
                <button 
                    onClick={() => setActiveTab('BÁN')}
                    className={`flex-1 py-2 text-[10px] md:text-xs font-bold transition-colors ${activeTab === 'BÁN' ? 'text-pink-600 border-b-2 border-pink-600 bg-pink-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    BÁN
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[9px]">{screenerData.filter(d => d.signal === 'BÁN').length}</span>
                </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[20%_24%_20%_20%_16%] w-full bg-[#0066b3] text-white text-[10px] md:text-[11px] font-bold text-center border-b border-gray-200 sticky top-0 z-10 shadow-sm shrink-0">
                <div className="py-2.5 px-0.5 border-r border-[#1a75bc] flex items-center justify-center gap-1 shrink-0">MÃ <span className="opacity-50">▲</span></div>
                <div className="py-2.5 px-0.5 border-r border-[#1a75bc] flex items-center justify-center gap-1 shrink-0">TÍN HIỆU <span className="opacity-50">▼</span></div>
                <div className="py-2.5 px-0.5 border-r border-[#1a75bc] flex items-center justify-center gap-1 shrink-0">GIÁ BÁO <span className="opacity-50">▲</span></div>
                <div className="py-2.5 px-0.5 border-r border-[#1a75bc] flex items-center justify-center gap-1 shrink-0">(%) <span className="opacity-50">▲</span></div>
                <div className="py-2.5 px-0.5 flex items-center justify-center gap-1 shrink-0">T+ <span className="opacity-50">▲</span></div>
            </div>

            {/* Data List - Hỗ trợ Cuộn vô hạn ngầm (Infinite Scroll / Lazy Rendering) */}
            <div onScroll={handleScroll} className="flex-1 overflow-y-auto bg-white">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 space-y-3">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-gray-500">Đang quét thị trường...</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
                        <AlertCircle size={24} />
                        <span className="text-xs font-medium">Không có mã nào thỏa mãn điều kiện</span>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-gray-100">
                        {filteredData.slice(0, visibleCount).map((item, idx) => (
                            <div 
                                key={item.symbol}
                                onClick={() => onSelectSymbol(item.symbol)}
                                className={`grid grid-cols-[20%_24%_20%_20%_16%] w-full text-center items-center text-xs cursor-pointer transition-colors hover:bg-[#f0f8ff] ${activeSymbol === item.symbol ? 'bg-blue-50 ring-1 ring-blue-500 inset-0 relative z-10' : (idx % 2 === 0 ? 'bg-white' : 'bg-[#fcfcfc]')}`}
                            >
                                {/* Cột 1: MÃ */}
                                <div className="py-2.5 px-0.5 font-bold text-[#2e5eb9] text-[11px] md:text-[13px] border-r border-gray-100 shrink-0">
                                    {item.symbol}
                                </div>
                                
                                {/* Cột 2: TÍN HIỆU */}
                                <div className="py-1 px-1 border-r border-gray-100 h-full flex items-center justify-center bg-blue-50/20 shrink-0">
                                    <div className={`w-full py-1.5 rounded-sm font-extrabold text-[10px] md:text-[11px] shadow-sm tracking-wide ${getSignalColor(item.signal)}`}>
                                        {item.signal === 'NONE' ? 'QUAN SÁT' : item.signal}
                                    </div>
                                </div>

                                {/* Cột 3: GIÁ BÁO */}
                                <div className="py-2.5 px-0.5 font-semibold text-gray-700 text-[11px] md:text-xs border-r border-gray-100 bg-gray-50/30 shrink-0">
                                    {item.price.toFixed(2)}
                                </div>

                                {/* Cột 4: (%) */}
                                <div className={`py-2.5 px-0.5 font-bold text-[11px] md:text-xs border-r border-gray-100 shrink-0 ${item.profit > 0 ? 'text-[#10b981]' : (item.profit < 0 ? 'text-[#ef4444]' : 'text-gray-500')}`}>
                                    {item.profit > 0 ? `+${item.profit.toFixed(1)}%` : `${item.profit.toFixed(1)}%`}
                                </div>

                                {/* Cột 5: T+ */}
                                <div className="py-2.5 px-0.5 font-semibold text-gray-800 text-[11px] md:text-xs bg-gray-50/50 shrink-0">
                                    {item.tPlus !== null ? `T+${item.tPlus}` : '-'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {/* Footer Summary */}
            {!loading && (
                <div className="p-2 border-t border-gray-200 bg-gray-50 text-center text-[10px] text-gray-500 font-medium shrink-0 flex items-center justify-center gap-1.5">
                    <Clock size={12} className="text-gray-400" />
                    <span>Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')}</span>
                </div>
            )}
        </div>
    );
};
