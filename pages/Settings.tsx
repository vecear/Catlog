import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle } from 'lucide-react';
import { clearAllLogs } from '../services/storage';

export const Settings: React.FC = () => {
  const navigate = useNavigate();

  const handleClearAll = () => {
    if (window.confirm('確定要清除所有紀錄嗎？此動作無法復原！')) {
      clearAllLogs();
      alert('所有紀錄已清除');
      navigate('/');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
       <div className="flex items-center gap-4 mb-2">
        <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
        >
            <ArrowLeft className="w-6 h-6 text-stone-700" />
        </button>
        <h2 className="text-2xl font-bold text-stone-800">設定</h2>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
        <h3 className="text-lg font-bold text-stone-700 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            危險區域
        </h3>
        <p className="text-stone-500 mb-6 text-sm leading-relaxed">
            這裡的操作將會永久影響您的資料，請謹慎使用。清除資料後無法復原。
        </p>
        
        <button
          onClick={handleClearAll}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 active:bg-red-200 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          清除所有紀錄
        </button>
      </section>

      <div className="text-center text-xs text-stone-300 mt-8">
        小賀Log v1.0.0
      </div>
    </div>
  );
};