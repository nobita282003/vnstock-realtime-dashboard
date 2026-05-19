import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesPrimitive, IPrimitivePaneView, IPrimitivePaneRenderer } from 'lightweight-charts';

// Render Bollinger Bands area color
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
        target.useMediaCoordinateSpace((context: any) => {
            const ctx = context.context;
            if (this._upperPoints.length === 0 || this._lowerPoints.length === 0) return;

            let startIdx = 0;
            while (startIdx < this._upperPoints.length - 1) {
                const currentTrend = this._trends[startIdx];
                let endIdx = startIdx;

                while (endIdx < this._upperPoints.length - 1 && this._trends[endIdx] === currentTrend) {
                    endIdx++;
                }

                ctx.fillStyle = currentTrend ? 'rgba(38, 166, 154, 0.12)' : 'rgba(239, 83, 80, 0.12)';
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

                ctx.strokeStyle = currentTrend ? 'rgba(38, 166, 154, 0.45)' : 'rgba(239, 83, 80, 0.45)';
                ctx.lineWidth = 0.8;
                ctx.beginPath();
                ctx.moveTo(this._upperPoints[startIdx].x, this._upperPoints[startIdx].y);
                for (let i = startIdx + 1; i <= endIdx; i++) {
                    ctx.lineTo(this._upperPoints[i].x, this._upperPoints[i].y);
                }
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(this._lowerPoints[startIdx].x, this._lowerPoints[startIdx].y);
                for (let i = startIdx + 1; i <= endIdx; i++) {
                    ctx.lineTo(this._lowerPoints[i].x, this._lowerPoints[i].y);
                }
                ctx.stroke();

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

    updateAllViews() { }

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

// Vẽ mũi tên MUA/BÁN
class MarkersPaneRenderer implements IPrimitivePaneRenderer {
    private _points: any[] = [];

    constructor(points: any[]) {
        this._points = points;
    }

    draw(target: any) {
        target.useMediaCoordinateSpace((context: any) => {
            const ctx = context.context;
            if (this._points.length === 0) return;

            this._points.forEach(marker => {
                const { x, yLow, yHigh, shape, color, text } = marker;
                const offset = 24;

                ctx.font = 'bold 10px Inter, Arial, sans-serif';
                ctx.textAlign = 'center';

                if (shape === 'arrowUp') {
                    const yTip = yLow + offset;
                    ctx.beginPath();
                    ctx.moveTo(x, yTip);
                    ctx.lineTo(x - 5, yTip + 7);
                    ctx.lineTo(x - 2, yTip + 7);
                    ctx.lineTo(x - 2, yTip + 14);
                    ctx.lineTo(x + 2, yTip + 14);
                    ctx.lineTo(x + 2, yTip + 7);
                    ctx.lineTo(x + 5, yTip + 7);
                    ctx.closePath();

                    ctx.fillStyle = color;
                    ctx.fill();

                    if (text) {
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 3;
                        ctx.textBaseline = 'top';
                        ctx.strokeText(text, x, yTip + 16);
                        ctx.fillStyle = color;
                        ctx.fillText(text, x, yTip + 16);
                    }
                } else if (shape === 'arrowDown') {
                    const yTip = yHigh - offset;
                    ctx.beginPath();
                    ctx.moveTo(x, yTip);
                    ctx.lineTo(x - 5, yTip - 7);
                    ctx.lineTo(x - 2, yTip - 7);
                    ctx.lineTo(x - 2, yTip - 14);
                    ctx.lineTo(x + 2, yTip - 14);
                    ctx.lineTo(x + 2, yTip - 7);
                    ctx.lineTo(x + 5, yTip - 7);
                    ctx.closePath();

                    ctx.fillStyle = color;
                    ctx.fill();

                    if (text) {
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 3;
                        ctx.textBaseline = 'bottom';
                        ctx.strokeText(text, x, yTip - 16);
                        ctx.fillStyle = color;
                        ctx.fillText(text, x, yTip - 16);
                    }
                }
            });
        });
    }
}

class MarkersPaneView implements IPrimitivePaneView {
    private _source: MarkersPrimitive;

    constructor(source: MarkersPrimitive) {
        this._source = source;
    }

    renderer(): IPrimitivePaneRenderer | null {
        return this._source.renderer();
    }
}

class MarkersPrimitive implements ISeriesPrimitive {
    private _chart: any;
    private _series: any;
    private _markers: any[] = [];
    private _ohlcvMap: Map<number, { high: number, low: number }> = new Map();
    private _paneView: MarkersPaneView;
    private _visible: boolean = true;

    constructor(chart: any, series: any) {
        this._chart = chart;
        this._series = series;
        this._paneView = new MarkersPaneView(this);
    }

    setData(markers: any[], data: any[]) {
        this._markers = markers;
        this._ohlcvMap.clear();
        data.forEach(d => {
            this._ohlcvMap.set(d.time, { high: d.high, low: d.low });
        });
    }

    setVisible(visible: boolean) {
        this._visible = visible;
    }

    updateAllViews() { }

    paneViews() {
        return [this._paneView];
    }

    renderer(): IPrimitivePaneRenderer | null {
        if (!this._visible || this._markers.length === 0) return null;

        const timeScale = this._chart.timeScale();
        const points: any[] = [];

        this._markers.forEach(marker => {
            const x = timeScale.timeToCoordinate(marker.time);
            const ohlcv = this._ohlcvMap.get(marker.time);
            if (x !== null && ohlcv) {
                const yLow = this._series.priceToCoordinate(ohlcv.low);
                const yHigh = this._series.priceToCoordinate(ohlcv.high);
                if (yLow !== null && yHigh !== null) {
                    points.push({
                        x,
                        yLow,
                        yHigh,
                        shape: marker.shape,
                        color: marker.color,
                        text: marker.text
                    });
                }
            }
        });

        return new MarkersPaneRenderer(points);
    }
}

// Tính Bollinger Bands
function calculateBollingerBands(data: any[], period = 20, multiplier = 2) {
    const upper: any[] = [];
    const lower: any[] = [];

    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) continue;

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

// Tính SMA
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
    const emaData = [];
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
    const macd = [];
    for (let i = 0; i < data.length; i++) {
        macd.push({ time: data[i].time, value: ema12[i].value - ema26[i].value, close: ema12[i].value - ema26[i].value });
    }

    const signal = calculateEMA(macd, 9, 'close');
    const hist = [];
    for (let i = 0; i < macd.length; i++) {
        const val = macd[i].value - signal[i].value;
        hist.push({
            time: macd[i].time,
            value: val,
            color: val >= 0 ? '#26a69a' : '#ef5350'
        });
    }
    return { macd: macd.map(d => ({ time: d.time, value: d.value })), signal, hist };
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
    const mainContainerRef = useRef<HTMLDivElement>(null);
    const volumeContainerRef = useRef<HTMLDivElement>(null);
    const macdContainerRef = useRef<HTMLDivElement>(null);

    const mainChartRef = useRef<IChartApi | null>(null);
    const volumeChartRef = useRef<IChartApi | null>(null);
    const macdChartRef = useRef<IChartApi | null>(null);

    const seriesRef = useRef<any>(null);
    const volumeRef = useRef<any>(null);
    const sma10Ref = useRef<any>(null);
    const sma20Ref = useRef<any>(null);
    const markersPrimitiveRef = useRef<any>(null);

    const bbUpperRef = useRef<any>(null);
    const bbLowerRef = useRef<any>(null);
    const bbFillPrimitiveRef = useRef<any>(null);

    const macdLineRef = useRef<any>(null);
    const macdSignalRef = useRef<any>(null);
    const macdHistRef = useRef<any>(null);

    const dataRef = useRef<any[]>([]);
    const macdDataRef = useRef<any[]>([]);
    const currentChartIdRef = useRef<string>('');

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [volumeHeight, setVolumeHeight] = useState(isMobile ? 80 : 120);
    const [macdHeight, setMacdHeight] = useState(isMobile ? 100 : 150);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setVolumeHeight(isMobile ? 80 : 120);
        setMacdHeight(isMobile ? 100 : 150);
    }, [isMobile]);

    // Thao tác kéo giãn chiều cao khung Volume
    const startDragVolume = (e: React.MouseEvent | React.TouchEvent) => {
        const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const startVal = volumeHeight;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            if ('touches' in moveEvent) {
                moveEvent.preventDefault();
            }
            const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
            const delta = currentY - startY;
            const nextHeight = Math.max(40, Math.min(250, startVal - delta));
            setVolumeHeight(nextHeight);
        };

        const handleEnd = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    };

    // Thao tác kéo giãn chiều cao khung MACD
    const startDragMacd = (e: React.MouseEvent | React.TouchEvent) => {
        const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const startVal = macdHeight;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            if ('touches' in moveEvent) {
                moveEvent.preventDefault();
            }
            const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
            const delta = currentY - startY;
            const nextHeight = Math.max(40, Math.min(250, startVal - delta));
            setMacdHeight(nextHeight);
        };

        const handleEnd = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
    };

    // Khởi tạo các biểu đồ và thiết lập đồng bộ hóa
    useEffect(() => {
        if (!mainContainerRef.current || !volumeContainerRef.current || !macdContainerRef.current) return;

        // Cấu hình ngôn ngữ tiếng Việt cho trục ngày tháng
        const vietnameseLocalization = {
            locale: 'vi-VN',
            dateFormat: 'dd/MM/yyyy',
        };

        // 1. Biểu đồ chính (Giá)
        const mainChart = createChart(mainContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'white' },
                textColor: '#333',
                fontSize: 11,
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: '#f0f3fa' },
                horzLines: { color: '#f0f3fa' },
            },
            localization: vietnameseLocalization,
            width: mainContainerRef.current.clientWidth,
            height: mainContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#dfebf0',
            },
            rightPriceScale: {
                borderColor: '#dfebf0',
                scaleMargins: {
                    top: 0.08,
                    bottom: 0.08,
                },
                minimumWidth: 62,
            }
        });
        mainChartRef.current = mainChart;

        const candlestickSeries = mainChart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });
        seriesRef.current = candlestickSeries;

        const markersPrimitive = new MarkersPrimitive(mainChart, candlestickSeries);
        candlestickSeries.attachPrimitive(markersPrimitive);
        markersPrimitiveRef.current = markersPrimitive;

        const bbUpper = mainChart.addSeries(LineSeries, {
            color: 'transparent',
            lineWidth: 1,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });
        bbUpperRef.current = bbUpper;

        const bbLower = mainChart.addSeries(LineSeries, {
            color: 'transparent',
            lineWidth: 1,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });
        bbLowerRef.current = bbLower;

        const bbFillPrimitive = new BandAreaPrimitive(mainChart, candlestickSeries);
        candlestickSeries.attachPrimitive(bbFillPrimitive);
        bbFillPrimitiveRef.current = bbFillPrimitive;

        const sma10 = mainChart.addSeries(LineSeries, {
            color: '#2962FF',
            lineWidth: 1,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });
        sma10Ref.current = sma10;

        const sma20 = mainChart.addSeries(LineSeries, {
            color: '#FF6D00',
            lineWidth: 1,
            crosshairMarkerVisible: false,
            priceLineVisible: false,
        });
        sma20Ref.current = sma20;

        // 2. Biểu đồ khối lượng (Volume)
        const volumeChart = createChart(volumeContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'white' },
                textColor: '#666',
                fontSize: 11,
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: '#f0f3fa' },
                horzLines: { color: '#f0f3fa' },
            },
            localization: vietnameseLocalization,
            width: volumeContainerRef.current.clientWidth,
            height: volumeContainerRef.current.clientHeight,
            rightPriceScale: {
                borderColor: '#dfebf0',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.02,
                },
                minimumWidth: 62,
            },
            timeScale: {
                visible: false,
                borderColor: '#dfebf0',
            },
        });
        volumeChartRef.current = volumeChart;

        const volumeSeries = volumeChart.addSeries(HistogramSeries, {
            color: '#26a69a',
            priceFormat: { type: 'volume' },
        });
        volumeRef.current = volumeSeries;

        // 3. Biểu đồ MACD
        const macdChart = createChart(macdContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'white' },
                textColor: '#666',
                fontSize: 11,
                attributionLogo: false,
            },
            grid: {
                vertLines: { color: '#f0f3fa' },
                horzLines: { color: '#f0f3fa' },
            },
            localization: vietnameseLocalization,
            width: macdContainerRef.current.clientWidth,
            height: macdContainerRef.current.clientHeight,
            rightPriceScale: {
                borderColor: '#dfebf0',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
                minimumWidth: 62,
            },
            timeScale: {
                visible: false,
                borderColor: '#dfebf0',
            },
        });
        macdChartRef.current = macdChart;

        const macdLine = macdChart.addSeries(LineSeries, { color: '#2962FF', lineWidth: 1, priceLineVisible: false });
        const macdSignal = macdChart.addSeries(LineSeries, { color: '#FF6D00', lineWidth: 1, priceLineVisible: false });
        const macdHist = macdChart.addSeries(HistogramSeries, { priceLineVisible: false });

        macdLineRef.current = macdLine;
        macdSignalRef.current = macdSignal;
        macdHistRef.current = macdHist;

        // Đồng bộ hóa khoảng thời gian (Zoom và Pan)
        const isSyncingTimeScaleRef = { current: false };
        const syncTimeScale = (getTargets: () => (IChartApi | null)[]) => {
            return (range: any) => {
                if (isSyncingTimeScaleRef.current || !range) return;
                isSyncingTimeScaleRef.current = true;
                getTargets().forEach(target => {
                    if (target) {
                        target.timeScale().setVisibleLogicalRange(range);
                    }
                });
                isSyncingTimeScaleRef.current = false;
            };
        };

        const onMainTimeChange = syncTimeScale(() => [volumeChartRef.current, macdChartRef.current]);
        mainChart.timeScale().subscribeVisibleLogicalRangeChange(onMainTimeChange);

        const onVolumeTimeChange = syncTimeScale(() => [mainChartRef.current, macdChartRef.current]);
        volumeChart.timeScale().subscribeVisibleLogicalRangeChange(onVolumeTimeChange);

        const onMacdTimeChange = syncTimeScale(() => [mainChartRef.current, volumeChartRef.current]);
        macdChart.timeScale().subscribeVisibleLogicalRangeChange(onMacdTimeChange);

        // Đồng bộ hóa con trỏ chéo (Crosshair)
        const syncCrosshairs = (getTargets: () => { chart: IChartApi | null; series: any }[]) => {
            return (param: any) => {
                if (!param.sourceEvent) return;

                const targets = getTargets();
                if (!param.time) {
                    targets.forEach(t => {
                        if (t.chart) t.chart.clearCrosshairPosition();
                    });
                    return;
                }

                const time = param.time;
                targets.forEach(t => {
                    if (!t.chart || !t.series) return;

                    let price = 0;
                    const dataIndex = dataRef.current.findIndex(d => d.time === time);
                    if (dataIndex !== -1) {
                        const dataPoint = dataRef.current[dataIndex];
                        if (t.series === volumeRef.current) {
                            price = dataPoint.value;
                        } else if (t.series === macdLineRef.current) {
                            if (macdDataRef.current && macdDataRef.current[dataIndex]) {
                                price = macdDataRef.current[dataIndex].value;
                            }
                        } else if (t.series === seriesRef.current) {
                            price = dataPoint.close;
                        }
                    }

                    t.chart.setCrosshairPosition(price, time, t.series);
                });
            };
        };

        const onMainCrosshairMove = syncCrosshairs(() => [
            { chart: volumeChartRef.current, series: volumeRef.current },
            { chart: macdChartRef.current, series: macdLineRef.current }
        ]);
        mainChart.subscribeCrosshairMove(onMainCrosshairMove);

        const onVolumeCrosshairMove = syncCrosshairs(() => [
            { chart: mainChartRef.current, series: seriesRef.current },
            { chart: macdChartRef.current, series: macdLineRef.current }
        ]);
        volumeChart.subscribeCrosshairMove(onVolumeCrosshairMove);

        const onMacdCrosshairMove = syncCrosshairs(() => [
            { chart: mainChartRef.current, series: seriesRef.current },
            { chart: volumeChartRef.current, series: volumeRef.current }
        ]);
        macdChart.subscribeCrosshairMove(onMacdCrosshairMove);

        const resizeObserver = new ResizeObserver(() => {
            if (mainContainerRef.current && mainChartRef.current) {
                mainChartRef.current.applyOptions({
                    width: mainContainerRef.current.clientWidth,
                    height: mainContainerRef.current.clientHeight,
                });
            }
            if (volumeContainerRef.current && volumeChartRef.current) {
                volumeChartRef.current.applyOptions({
                    width: volumeContainerRef.current.clientWidth,
                    height: volumeContainerRef.current.clientHeight,
                });
            }
            if (macdContainerRef.current && macdChartRef.current) {
                macdChartRef.current.applyOptions({
                    width: macdContainerRef.current.clientWidth,
                    height: macdContainerRef.current.clientHeight,
                });
            }
        });

        resizeObserver.observe(mainContainerRef.current);

        return () => {
            resizeObserver.disconnect();

            mainChart.timeScale().unsubscribeVisibleLogicalRangeChange(onMainTimeChange);
            volumeChart.timeScale().unsubscribeVisibleLogicalRangeChange(onVolumeTimeChange);
            macdChart.timeScale().unsubscribeVisibleLogicalRangeChange(onMacdTimeChange);

            mainChart.unsubscribeCrosshairMove(onMainCrosshairMove);
            volumeChart.unsubscribeCrosshairMove(onVolumeCrosshairMove);
            macdChart.unsubscribeCrosshairMove(onMacdCrosshairMove);

            mainChart.remove();
            volumeChart.remove();
            macdChart.remove();

            markersPrimitiveRef.current = null;
            bbUpperRef.current = null;
            bbLowerRef.current = null;
            bbFillPrimitiveRef.current = null;

            mainChartRef.current = null;
            volumeChartRef.current = null;
            macdChartRef.current = null;
        };
    }, []);

    // Cập nhật dữ liệu cho các series
    useEffect(() => {
        if (data.length > 0 && seriesRef.current && volumeRef.current && macdLineRef.current) {
            dataRef.current = data;
            const candleData = data.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }));
            const volumeData = data.map(d => ({
                time: d.time,
                value: d.value,
                color: d.close > d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
            }));

            seriesRef.current.setData(candleData);
            volumeRef.current.setData(volumeData);

            const sma10Data = calculateSMA(data, 10);
            const sma20Data = calculateSMA(data, 20);
            sma10Ref.current.setData(sma10Data);
            sma20Ref.current.setData(sma20Data);

            const { upper: bbUpperData, lower: bbLowerData } = calculateBollingerBands(data, 20, 2);
            bbUpperRef.current.setData(bbUpperData);
            bbLowerRef.current.setData(bbLowerData);

            const bbFillData: BandPoint[] = [];
            for (let i = 0; i < bbUpperData.length; i++) {
                const time = bbUpperData[i].time;
                const upperVal = bbUpperData[i].value;
                const lowerVal = bbLowerData[i].value;

                let isBullish = false;
                if (Array.isArray(markers) && markers.length > 0) {
                    let lastActiveMarker = null;
                    for (let m = 0; m < markers.length; m++) {
                        if (markers[m].time <= time) {
                            lastActiveMarker = markers[m];
                        } else {
                            break;
                        }
                    }
                    if (lastActiveMarker) {
                        isBullish = lastActiveMarker.shape === 'arrowUp';
                    }
                }

                bbFillData.push({
                    time,
                    upper: upperVal,
                    lower: lowerVal,
                    isBullish
                });
            }
            bbFillPrimitiveRef.current.setData(bbFillData);

            const { macd, signal, hist } = calculateMACD(data);
            macdDataRef.current = macd;
            macdLineRef.current.setData(macd);
            macdSignalRef.current.setData(signal);
            macdHistRef.current.setData(hist);

            if (mainChartRef.current) {
                if (currentChartIdRef.current !== chartId) {
                    const count = Math.min(data.length, isMobile ? 50 : 100);
                    const chartInstance = mainChartRef.current;
                    const dataLength = data.length;

                    setTimeout(() => {
                        if (mainChartRef.current === chartInstance) {
                            try {
                                chartInstance.timeScale().setVisibleLogicalRange({
                                    from: dataLength - count,
                                    to: dataLength + 4,
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
    }, [data, markers, chartId]);

    // Cập nhật Markers vẽ lại series
    useEffect(() => {
        if (markersPrimitiveRef.current && Array.isArray(markers)) {
            markersPrimitiveRef.current.setData(markers, data);
            if (seriesRef.current) seriesRef.current.applyOptions({});
        }
    }, [markers, data]);

    // Bật tắt và co giãn các khung
    useEffect(() => {
        if (sma10Ref.current) sma10Ref.current.applyOptions({ visible: indicators.sma10 });
        if (sma20Ref.current) sma20Ref.current.applyOptions({ visible: indicators.sma20 });

        if (bbUpperRef.current) bbUpperRef.current.applyOptions({ visible: indicators.bollinger });
        if (bbLowerRef.current) bbLowerRef.current.applyOptions({ visible: indicators.bollinger });
        if (bbFillPrimitiveRef.current) {
            bbFillPrimitiveRef.current.setVisible(indicators.bollinger);
            if (seriesRef.current) seriesRef.current.applyOptions({});
        }

        const isMacdVisible = indicators.macd;
        const isVolumeVisible = indicators.volume;

        if (mainChartRef.current) {
            mainChartRef.current.timeScale().applyOptions({
                visible: !isVolumeVisible && !isMacdVisible,
            });
        }
        if (volumeChartRef.current) {
            volumeChartRef.current.timeScale().applyOptions({
                visible: isVolumeVisible && !isMacdVisible,
            });
        }
        if (macdChartRef.current) {
            macdChartRef.current.timeScale().applyOptions({
                visible: isMacdVisible,
            });
        }

        setTimeout(() => {
            if (mainContainerRef.current && mainChartRef.current) {
                mainChartRef.current.applyOptions({
                    width: mainContainerRef.current.clientWidth,
                    height: mainContainerRef.current.clientHeight,
                });
            }
            if (volumeContainerRef.current && volumeChartRef.current) {
                volumeChartRef.current.applyOptions({
                    width: volumeContainerRef.current.clientWidth,
                    height: volumeContainerRef.current.clientHeight,
                });
            }
            if (macdContainerRef.current && macdChartRef.current) {
                macdChartRef.current.applyOptions({
                    width: macdContainerRef.current.clientWidth,
                    height: macdContainerRef.current.clientHeight,
                });
            }
        }, 50);

    }, [indicators, volumeHeight, macdHeight]);

    return (
        <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col p-0 bg-white select-none gap-0">
            {/* Vùng đồ thị giá */}
            <div
                ref={mainContainerRef}
                className="flex-grow w-full overflow-hidden relative bg-white"
            />

            {/* Thanh phân cách siêu mỏng như chỉ (Giá - Volume) */}
            {indicators.volume && (
                <div
                    onMouseDown={startDragVolume}
                    onTouchStart={startDragVolume}
                    className="h-[1px] w-full bg-gray-200 relative select-none z-20"
                >
                    <div className="absolute -top-1.5 -bottom-1.5 left-0 right-0 cursor-row-resize" />
                </div>
            )}

            {/* Vùng đồ thị Volume */}
            <div
                className={`relative w-full overflow-hidden bg-white ${indicators.volume ? 'block' : 'hidden'
                    }`}
                style={{
                    height: indicators.volume ? `${volumeHeight}px` : '0px',
                }}
            >
                <div ref={volumeContainerRef} className="w-full h-full" />
            </div>

            {/* Thanh phân cách siêu mỏng như chỉ (Volume/Giá - MACD) */}
            {indicators.macd && (
                <div
                    onMouseDown={startDragMacd}
                    onTouchStart={startDragMacd}
                    className="h-[1px] w-full bg-gray-200 relative select-none z-20"
                >
                    <div className="absolute -top-1.5 -bottom-1.5 left-0 right-0 cursor-row-resize" />
                </div>
            )}

            {/* Vùng đồ thị MACD */}
            <div
                className={`relative w-full overflow-hidden bg-white ${indicators.macd ? 'block' : 'hidden'
                    }`}
                style={{
                    height: indicators.macd ? `${macdHeight}px` : '0px',
                }}
            >
                <div ref={macdContainerRef} className="w-full h-full" />
            </div>
        </div>
    );
};
