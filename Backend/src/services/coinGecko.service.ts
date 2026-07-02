import axios from "axios";

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const COINGECKO_BASE_URL = process.env.COINGECKO_BASE_URL;

if (!COINGECKO_API_KEY) {
  throw new Error("COINGECKO_API_KEY is missing");
}

if (!COINGECKO_BASE_URL) {
  throw new Error("COINGECKO_BASE_URL is missing");
}

export interface CoinGeckoSearchResult {
  externalId: string;
  symbol: string;
  name: string;
  market: string;
  assetType: string;
  currency: string;
}

export async function searchCryptoAssetsFromCoinGecko(
  query: string
): Promise<CoinGeckoSearchResult[]> {
  const response = await axios.get(`${COINGECKO_BASE_URL}/search`, {
    headers: {
      "x-cg-demo-api-key": COINGECKO_API_KEY,
    },
    params: {
      query,
    },
  });

  const coins = response.data.coins || [];

  const normalizedQuery = query.toLowerCase().trim();

const exactSymbolMatches = coins.filter(
  (coin: any) => coin.symbol?.toLowerCase() === normalizedQuery
);

const selectedCoins =
  exactSymbolMatches.length > 0
    ? exactSymbolMatches.slice(0, 5)
    : coins.slice(0, 10);

return selectedCoins.map((coin: any) => ({
  externalId: coin.id,
  symbol: coin.symbol.toUpperCase(),
  name: coin.name,
  market: "CRYPTO",
  assetType: "crypto",
  currency: "USD",
}));
}

export async function getCryptoPricesFromCoinGecko(
  coinIds: string[],
  currency: string = "usd"
) {
  const response = await axios.get(`${COINGECKO_BASE_URL}/simple/price`, {
    headers: {
      "x-cg-demo-api-key": COINGECKO_API_KEY,
    },
    params: {
      ids: coinIds.join(","),
      vs_currencies: currency,
    },
  });

  return response.data;
}