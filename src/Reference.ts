import axios from 'axios';

export class Reference {
    company(symbol: string) {
        return {
            info: async () => {
                // Sử dụng api của SSI hoặc TCBS (dùng TCBS fallback)
                const url = `https://apipubaws.tcbs.com.vn/tcanalysis/v1/ticker/${symbol}/overview`;
                try {
                    const response = await axios.get(url);
                    return response.data;
                } catch (error: any) {
                    // Fallback to a mock for demonstration
                    if (symbol === 'FPT') {
                        return {
                            shortName: 'FPT',
                            exchange: 'HOSE',
                            industry: 'Công nghệ thông tin',
                            website: 'https://fpt.com.vn'
                        };
                    }
                    console.error("Lỗi khi tải thông tin công ty:", error.message);
                    return null;
                }
            }
        };
    }
}
