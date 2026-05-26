import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarketStore } from '../store/marketStore';
import StockDetail from '../components/Stock/StockDetail';

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { stocks, isLoaded, loadMarket } = useMarketStore();

  useEffect(() => {
    if (!isLoaded) loadMarket();
  }, [isLoaded, loadMarket]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stock = stocks.find(s => s.symbol === symbol);
  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-slate-400">Stock "{symbol}" not found.</p>
        <button onClick={() => navigate('/market')} className="text-indigo-400 hover:text-indigo-300 text-sm underline">
          Back to FTSE 100
        </button>
      </div>
    );
  }

  return <StockDetail stock={stock} />;
}
