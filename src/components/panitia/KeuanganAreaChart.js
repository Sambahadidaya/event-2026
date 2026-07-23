'use client';

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function KeuanganAreaChart({ pesertaLunas = [], formWajibMap = {}, formRegisterMap = {} }) {
  const { labels, incomeData, expenseData } = useMemo(() => {
    // Generate labels for last 12 months including current month
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth();
    
    const monthlyLabels = [];
    const monthlyIncome = new Array(12).fill(0);
    const monthlyExpense = new Array(12).fill(0); // placeholder
    
    for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(currentMonthIndex - i);
        monthlyLabels.push(d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }));
    }

    pesertaLunas.forEach(peserta => {
      let nominal = 0;
      if (peserta.kode_form) {
        const kodeForm = peserta.kode_form.slice(0, -4);
        if (peserta.jenis_form === 'wajib' && formWajibMap[kodeForm]) {
          nominal = formWajibMap[kodeForm].nominal || 0;
        } else if (peserta.jenis_form === 'register' && formRegisterMap[kodeForm]) {
          nominal = formRegisterMap[kodeForm].nominal || 0;
        }
      }
      
      if (peserta.created_at) {
        const date = new Date(peserta.created_at);
        // Calculate difference in months from current month
        const diffMonths = (currentDate.getFullYear() - date.getFullYear()) * 12 + (currentDate.getMonth() - date.getMonth());
        
        // If it's within the last 12 months (0 to 11)
        if (diffMonths >= 0 && diffMonths < 12) {
            // The index in our 12-element array: 11 is current month, 0 is 11 months ago
            const index = 11 - diffMonths;
            monthlyIncome[index] += nominal;
        }
      }
    });

    return {
      labels: monthlyLabels,
      incomeData: monthlyIncome,
      expenseData: monthlyExpense
    };
  }, [pesertaLunas, formWajibMap, formRegisterMap]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: '#10b981',
        pointRadius: 3,
      },
      {
        label: 'Expense',
        data: expenseData,
        borderColor: '#ef4444', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointBackgroundColor: '#ef4444',
        pointRadius: 3,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            font: {
                family: "'Inter', sans-serif",
                size: 12
            }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 11 },
          callback: function(value) {
             if (value === 0) return 'Rp 0';
             if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + 'M';
             if (value >= 1000) return 'Rp ' + (value / 1000).toFixed(0) + 'K';
             return 'Rp ' + value;
          }
        },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cash Flow (12 Bulan)</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Tren income dan expense tahunan</p>
      </div>
      <div className="flex-1 w-full min-h-[300px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
