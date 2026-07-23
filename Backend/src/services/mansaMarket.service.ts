
import axios from "axios";

const MANSA_API_KEY = process.env.MANSA_API_KEY;
const MANSA_BASE_URL = "https://mansaapi.com";

if (!MANSA_API_KEY) {
  throw new Error("MANSA_API_KEY is missing");
}



export interface MansaStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  scraped_at: string; 
}

export interface MansaStocksMeta {
  exchange: string;
  currency: string; 
  updated_at: string;
  data_freshness: string; // e.g. "30_minutes"
  source: string; // e.g. "mansa_api"
}

export interface MansaStocksPagination {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface MansaStocksResponse {
  success: boolean;
  data: MansaStock[];
  meta: MansaStocksMeta;
  pagination: MansaStocksPagination;
}

// --- Public API --------------------------------------------------------

export async function fetchNgxStocks(): Promise<MansaStocksResponse> {
  const response = await axios.get(
    `${MANSA_BASE_URL}/api/v1/markets/exchanges/NGX/stocks`,
    {
      headers: {
        Authorization: `Bearer ${MANSA_API_KEY}`,
      },
      params: {
        limit: 200,
      },
    }
  );

  if (!response.data?.success) {
    throw new Error("Mansa API returned success: false for NGX stocks batch call");
  }

  return response.data;
}

export async function isNgxOpen(): Promise<boolean> {
  const response = await axios.get(
    `${MANSA_BASE_URL}/api/v1/markets/calendar/NGX/is-open`,
    {
      headers: {
        Authorization: `Bearer ${MANSA_API_KEY}`,
      },
    }
  );

  if (!response.data?.success) {
    throw new Error("Mansa API returned success: false for NGX is-open check");
  }

  return response.data.data.is_open;
}