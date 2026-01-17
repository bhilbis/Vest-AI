import type { Dispatch, SetStateAction } from "react";

export interface AssetProps {
  id: string;
  type: string;
  name: string;
  category: string;
  color: string;
  position?: { x: number; y: number } | null;
  lots: number;
  buyPrice: number;
  currentPrice: number;
  value?: number;
  profit?: number;
  coinId?: string;
}

export interface UsePortfolioAssetsResult {
  assets: AssetProps[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  setAssets: Dispatch<SetStateAction<AssetProps[]>>;
}
