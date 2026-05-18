import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import type { IChartApi, ISeriesPrimitive, IPrimitivePaneView, IPrimitivePaneRenderer } from 'lightweight-charts';

// Custom Canvas Primitive to draw dynamic background color between Bollinger Bands
class BandAreaPaneRenderer implements IPrimitivePaneRenderer {
    private _upperPoints: any[] = [];
    private _lowerPoints: any[] = [];
    private _trends: boolean[] = [];

    constructor(upperPoints: any[], lowerPoints: any[], trends: boolean[]) {
        this._upperPoints = upperPoints;
        this._lowerPoints = lowerPoints;
        this._trends = trends;
    }

    draw(target: any) {
        target.useBitmapCoordinateSpace((context: any) => {
            const ctx = context.context;
            if (this._upperPoints.length === 0 || this._lowerPoints.length === 0) return;

            let startIdx = 0;
            while (startIdx < this._upperPoints.length - 1) {
                const currentTrend = this._trends[startIdx];
                let endIdx = startIdx;
                
                while (endIdx < this._upperPoints.length - 1 && this._trends[endIdx] === currentTrend) {
                    endIdx++;
                }

                ctx.fillStyle = currentTrend ? 'rgba(38, 166, 154, 0.08)' : 'rgba(239, 83, 80, 0.08)';
                ctx.beginPath();
                
                ctx.moveTo(this._upperPoints[startIdx].x, this._upperPoints[startIdx].y);
                for (let i = startIdx + 1; i <= endIdx; i++) {
                    ctx.lineTo(this._upperPoints[i].x, this._upperPoints[i].y);
                }
                
                for (let i = endIdx; i >= startIdx; i--) {
                    ctx.lineTo(this._lowerPoints[i].x, this._lowerPoints[i].y);
                }
                
                ctx.closePath();
                ctx.fill();
                
                startIdx = endIdx;
            }
        });
    }
}

class BandAreaPaneView implements IPrimitivePaneView {
    private _source: BandAreaPrimitive;

    constructor(source: BandAreaPrimitive) {
        this._source = source;
    }

    renderer(): IPrimitivePaneRenderer | null {
        return this._source.renderer();
    }
}

interface BandPoint {
    time: number;
    upper: number;
    lower: number;
    isBullish: boolean;
}

class BandAreaPrimitive implements ISeriesPrimitive {
    private _chart: any;
    private _series: any;
    private _data: BandPoint[] = [];
    private _paneView: BandAreaPaneView;
    private _visible: boolean = true;

    constructor(chart: any, series: any) {
        this._chart = chart;
        this._series = series;
        this._paneView = new BandAreaPaneView(this);
    }

    setData(data: BandPoint[]) {
        this._data = data;
    }

    setVisible(visible: boolean) {
        this._visible = visible;
    }

    updateAllViews() {}

    paneViews() {
        return [this._paneView];
    }

    renderer(): IPrimitivePaneRenderer | null {
        if (!this._visible || this._data.length === 0) return null;

        const timeScale = this._chart.timeScale();
        const upperPoints: any[] = [];
        const lowerPoints: any[] = [];
        const trends: boolean[] = [];

        for (let i = 0; i < this._data.length; i++) {
            const item = this._data[i];
            const x = timeScale.timeToCoordinate(item.time);
            const yUpper = this._series.priceToCoordinate(item.upper);
            const yLower = this._series.priceToCoordinate(item.lower);

            if (x !== null && yUpper !== null && yLower !== null) {
                upperPoints.push({ x, y: yUpper });
                lowerPoints.push({ x, y: yLower });
                trends.push(item.isBullish);
            }
        }

        return new BandAreaPaneRenderer(upperPoints, lowerPoints, trends);
    }
}

// Tính toán Bollinger Bands
function calculateBollingerBands(data: any[], period = 20, multiplier = 2) {
    const upper: any[] = [];
    const lower: any[] = [];
    
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            continue;
        }
        
        let sum = 0;
        for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
        }
        const avg = sum / period;
        
        let variance = 0;
        for (let j = 0; j < period; j++) {
            variance += Math.pow(data[i - j].close - avg, 2);
        }
        const stdDev = Math.sqrt(variance / period);
        
        upper.push({ time: data[i].time, value: avg + multiplier * stdDev });
        lower.push({ time: data[i].time, value: avg - multiplier * stdDev });
    }
    return { upper, lower };
}

// Hàm tính toán Simple Moving Average (SMA)
function calculateSMA(data: any[], period: number) {
    const result = [];
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i].close;
        if (i >= period) {
            sum -= data[i - period].close;
            result.push({ time: data[i].time, value: sum / period });
        } else if (i === period - 1) {
            result.push({ time: data[i].time, value: sum / period });
        }
    }
    return result;
}

// Tính EMA cho MACD
function calculateEMA(data: any[], period: number, sourceKey: string = 'close') {
    const k = 2 / (period + 1);
    let emaData = [];
    let ema = data.length > 0 ? data[0][sourceKey] : 0;
    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            emaData.push({ time: data[i].time, value: ema });
        } else {
            ema = (data[i][sourceKey] - ema) * k + ema;
            emaData.push({ time: data[i].time, value: ema });
        }
    }
    return emaData;
}

// Tính MACD
function calculateMACD(data: any[]) {
    const ema12 = calculateEMA(data, 12);
    const ema26 = calculateEMA(data, 26);
    let macd = [];
    for (let i = 0; i < data.length; i++) {
        macd.push({ time: data[i].time, value: ema12[i].value - ema26[i].value, close: ema12[i].value - ema26[i].value }); // map close để dùng cho EMA9
    }
    
    // signal = EMA 9 của MACD
    const signal = calculateEMA(macd, 9, 'close');
    
    // Histogram
    let hist = [];
    for (let i = 0; i < macd.length; i++) {
        const val = macd[i].value - signal[i].value;
        hist.push({ 
            time: macd[i].time, 
            value: val,
            color: val >= 0 ? '#26a69a' : '#ef5350'
        });
    }
    return { macd: macd.map(d=>({time:d.time, value:d.value})), signal, hist };
}

interface IndicatorsState {
    sma10: boolean;
    sma20: boolean;
    macd: boolean;
    volume: boolean;
    bollinger: boolean;
}

interface TVChartProps {
    data: any[];
    indicators: IndicatorsState;
    markers?: any[];
    chartId?: string;
}

export const TVChart: React.FC<TVChartProps> = ({ data, indicators, markers = [], chartId = '' }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<any>(null);
    const volumeRef = useRef<any>(null);
    const sma10Ref = useRef<any>(null);
    const sma20Ref = useRef<any>(null);
    const markersPluginRef = useRef<any>(null);
    
    // Bollinger Bands refs
    const bbUpperRef = useRef<any>(null);
    const bbLowerRef = useRef<any>(null);
    const bbFillPrimitiveRef = useRef<any>(null);
    
    // MACD refs
    const macdLineRef = useRef<any>(null);
    const macdSignalRef = useRef<any>(null);
    const macdHistRef = useRef<any>(null);

    // Track Chart ID để tránh reset trạng thái biểu đồ
    const currentChartIdRef = useRef<string>('');

    // Khởi tạo Chart
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'white' },
                textColor: '#333',
            },
            grid: {
                vertLines: { color: '#f0f3fa' },
                horzLines: { color: '#f0f3fa' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
            rightPriceScale: {
                borderColor: '#dfebf0',
            }
        });
        chartRef.current = chart;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        seriesRef.current = candlestickSeries;

        const markersPlugin = createSeriesMarkers(candlestickSeries, []);
        markersPluginRef.current = markersPlugin;

        // Khởi tạo Bollinger Bands Series
        const bbUpper = chart.addSeries(LineSeries, {
            color: 'rgba(38, 166, 154, 0.4)', // Màu xanh mờ cho dải trên
            lineWidth: 1,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });
        bbUpperRef.current = bbUpper;

        const bbLower = chart.addSeries(LineSeries, {
            color: 'rgba(239, 83, 80, 0.4)', // Màu đỏ mờ cho dải dưới
            lineWidth: 1,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });
        bbLowerRef.current = bbLower;

        // Khởi tạo Canvas Primitive để vẽ màu nền xanh đỏ cho dải Bollinger
        const bbFillPrimitive = new BandAreaPrimitive(chart, candlestickSeries);
        candlestickSeries.attachPrimitive(bbFillPrimitive);
        bbFillPrimitiveRef.current = bbFillPrimitive;

        const volumeSeries = chart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        
        // Volume 15% đáy và nâng lên một chút để tránh bị che bởi thanh điều hướng di động / watermark
        chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0.08 },
            visible: false,
        });
        volumeRef.current = volumeSeries;

        const sma10 = chart.addSeries(LineSeries, {
            color: '#2962FF', // Xanh dương cho MA10
            lineWidth: 2,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });
        sma10Ref.current = sma10;

        const sma20 = chart.addSeries(LineSeries, {
            color: '#FF6D00', // Cam cho MA20
            lineWidth: 2,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });
        sma20Ref.current = sma20;

        const macdLine = chart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 2, priceScaleId: 'macd', priceLineVisible: false });
        const macdSignal = chart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 2, priceScaleId: 'macd', priceLineVisible: false });
        const macdHist = chart.addSeries(HistogramSeries, { priceScaleId: 'macd', priceLineVisible: false });
        
        // Cấu hình priceScale 'macd' và nâng lên một chút để tránh bị che khuất
        chart.priceScale('macd').applyOptions({
            scaleMargins: { top: 0.65, bottom: 0.08 },
            visible: false,
        });

        macdLineRef.current = macdLine;
        macdSignalRef.current = macdSignal;
        macdHistRef.current = macdHist;

        // Use ResizeObserver for responsive chart sizing (fixes container flex/sidebar resizing issues)
        const resizeObserver = new ResizeObserver(() => {
            if (chartContainerRef.current && chart) {
                chart.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight,
                });
            }
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
            markersPluginRef.current = null;
            bbUpperRef.current = null;
            bbLowerRef.current = null;
            bbFillPrimitiveRef.current = null;
        };
    }, []);

    // Cập nhật Dữ liệu
    useEffect(() => {
        if (data.length > 0 && seriesRef.current) {
            const candleData = data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
            const volumeData = data.map(d => ({ 
                time: d.time, 
                value: d.value, 
                color: d.close > d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)' 
            }));
            
            seriesRef.current.setData(candleData);
            volumeRef.current.setData(volumeData);
            
            // Tính toán SMA
            const sma10Data = calculateSMA(data, 10);
            const sma20Data = calculateSMA(data, 20);
            sma10Ref.current.setData(sma10Data);
            sma20Ref.current.setData(sma20Data);

            // Tính toán Bollinger Bands
            const { upper: bbUpperData, lower: bbLowerData } = calculateBollingerBands(data, 20, 2);
            bbUpperRef.current.setData(bbUpperData);
            bbLowerRef.current.setData(bbLowerData);

            // Thiết lập dữ liệu dải màu Bollinger Bands Fill dựa trên MA 10-20 trend
            const sma10Map = new Map();
            sma10Data.forEach(d => sma10Map.set(d.time, d.value));

            const sma20Map = new Map();
            sma20Data.forEach(d => sma20Map.set(d.time, d.value));

            const bbFillData: BandPoint[] = [];
            for (let i = 0; i < bbUpperData.length; i++) {
                const time = bbUpperData[i].time;
                const upperVal = bbUpperData[i].value;
                const lowerVal = bbLowerData[i].value;

                const s10 = sma10Map.get(time);
                const s20 = sma20Map.get(time);
                const isBullish = s10 !== undefined && s20 !== undefined ? s10 > s20 : true;

                bbFillData.push({
                    time,
                    upper: upperVal,
                    lower: lowerVal,
                    isBullish
                });
            }
            bbFillPrimitiveRef.current.setData(bbFillData);

            // Tính toán MACD
            const { macd, signal, hist } = calculateMACD(data);
            macdLineRef.current.setData(macd);
            macdSignalRef.current.setData(signal);
            macdHistRef.current.setData(hist);

            // Thay vì zoom out toàn bộ làm nến bị tí hon (fitContent), ta set hiển thị khoảng nến tối ưu dựa trên kích thước màn hình
            if (chartRef.current) {
                // CHỈ reset lại khung nhìn (Zoom/Pan) nếu mã chứng khoán hoặc khung thời gian thay đổi.
                // Nếu chỉ là polling cập nhật của cùng một mã, tuyệt đối giữ nguyên khung nhìn của người dùng!
                if (currentChartIdRef.current !== chartId) {
                    const isMobile = window.innerWidth < 768;
                    const count = Math.min(data.length, isMobile ? 50 : 100);
                    
                    const chartInstance = chartRef.current;
                    const dataLength = data.length;
                    
                    setTimeout(() => {
                        if (chartRef.current === chartInstance) {
                            try {
                                chartInstance.timeScale().setVisibleLogicalRange({
                                    from: dataLength - count,
                                    to: dataLength + 4, // Thêm 4 nến trống bên phải làm lề giống TradingView
                                });
                            } catch (e) {
                                console.error("Lỗi set visible logical range:", e);
                            }
                        }
                    }, 50);
                    currentChartIdRef.current = chartId;
                }
            }
        }
    }, [data]);

    // Cập nhật Markers
    useEffect(() => {
        if (markersPluginRef.current && Array.isArray(markers)) {
            markersPluginRef.current.setMarkers(markers);
        }
    }, [markers]);

    // Cập nhật hiển thị (bật tắt Indicators)
    useEffect(() => {
        if (sma10Ref.current) sma10Ref.current.applyOptions({ visible: indicators.sma10 });
        if (sma20Ref.current) sma20Ref.current.applyOptions({ visible: indicators.sma20 });
        
        // Bật tắt Bollinger Bands
        if (bbUpperRef.current) bbUpperRef.current.applyOptions({ visible: indicators.bollinger });
        if (bbLowerRef.current) bbLowerRef.current.applyOptions({ visible: indicators.bollinger });
        if (bbFillPrimitiveRef.current) {
            bbFillPrimitiveRef.current.setVisible(indicators.bollinger);
            // KHI BẬT TẮT CHỈ BÁO, KHÔNG ĐƯỢC THAY ĐỔI TIMESCALE CỦA BIỂU ĐỒ (không gọi fitContent hay setVisibleLogicalRange)
            // Chỉ gọi applyOptions rỗng trên series để force Lightweight Charts redraw primitive
            if (seriesRef.current) seriesRef.current.applyOptions({});
        }

        if (volumeRef.current) volumeRef.current.applyOptions({ visible: indicators.volume });
        if (macdLineRef.current) macdLineRef.current.applyOptions({ visible: indicators.macd });
        if (macdSignalRef.current) macdSignalRef.current.applyOptions({ visible: indicators.macd });
        if (macdHistRef.current) macdHistRef.current.applyOptions({ visible: indicators.macd });
    }, [indicators, data]);

    return (
        <div 
            ref={chartContainerRef} 
            className="absolute top-0 left-0 right-0 bottom-12 md:bottom-0" 
        />
    );
};
