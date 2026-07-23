'use client';

import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Define brand colors
const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#6366f1', // indigo-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#8b5cf6', // violet-500
  '#f43f5e', // rose-500
];

export default function KeuanganDonutChart({ pesertaLunas = [] }) {
  const chartData = useMemo(() => {
    // Group participants by campus
    const kampusCount = {};
    
    pesertaLunas.forEach(peserta => {
      // Normalize campus name
      const kampus = (peserta.kampus || 'Tidak Diketahui').trim();
      kampusCount[kampus] = (kampusCount[kampus] || 0) + 1;
    });

    // Sort by count (descending)
    const sortedKampus = Object.entries(kampusCount).sort((a, b) => b[1] - a[1]);

    // Keep top 6, group the rest as 'Lainnya'
    const MAX_ITEMS = 6;
    const labels = [];
    const data = [];

    if (sortedKampus.length <= MAX_ITEMS + 1) {
      sortedKampus.forEach(([k, count]) => {
        labels.push(k);
        data.push(count);
      });
    } else {
      let othersCount = 0;
      sortedKampus.forEach(([k, count], index) => {
        if (index < MAX_ITEMS) {
          labels.push(k);
          data.push(count);
        } else {
          othersCount += count;
        }
      });
      if (othersCount > 0) {
        labels.push('Lainnya');
        data.push(othersCount);
      }
    }

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: CHART_COLORS.slice(0, labels.length),
          borderWidth: 0,
          hoverOffset: 4
        },
      ],
    };
  }, [pesertaLunas]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 15,
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, family: "'Inter', sans-serif" },
        bodyFont: { size: 13, family: "'Inter', sans-serif" },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += context.parsed + ' Peserta';
            }
            return label;
          }
        }
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Distribusi Kampus</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Asal kampus dari peserta terverifikasi</p>
      </div>
      
      {pesertaLunas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 min-h-[250px]">
           <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center mb-3">
             <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700"></div>
           </div>
           <p className="text-sm font-medium">Belum ada data peserta terverifikasi</p>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-[250px] relative">
          <Doughnut data={chartData} options={options} />
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4 lg:pr-32">
             <span className="text-3xl font-bold text-slate-800 dark:text-white leading-none">
                 {pesertaLunas.length}
             </span>
             <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Lunas</span>
          </div>
        </div>
      )}
    </div>
  );
}
