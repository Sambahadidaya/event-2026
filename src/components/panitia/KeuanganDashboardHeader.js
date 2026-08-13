'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export default function KeuanganDashboardHeader({ transactions = [], pesertaLunas = [], formWajibMap = {}, formRegisterMap = {} }) {
  // Calculate totals and group by month for mini charts
  const { totalIncome, totalExpense, totalLaba, incomeByMonth, expenseByMonth } = useMemo(() => {
    let income = 0;
    let expense = 0;
    const monthlyIncome = new Array(12).fill(0);
    const monthlyExpense = new Array(12).fill(0);

    if (transactions && transactions.length > 0) {
      transactions.forEach(item => {
        const isExpense = item.kategori?.type_transaksi === 'expense' || item.kode_payer?.startsWith('EXP');
        const val = Number(item.nominal || 0);
        const dateStr = item.tanggal_transaksi || item.created_at;
        const date = dateStr ? new Date(dateStr) : new Date();
        const month = date.getMonth();

        if (isExpense) {
          expense += val;
          if (!isNaN(month)) monthlyExpense[month] += val;
        } else {
          income += val;
          if (!isNaN(month)) monthlyIncome[month] += val;
          
          const comm = Number(item.potongan_sales || 0);
          if (comm > 0) {
            expense += comm;
            if (!isNaN(month)) monthlyExpense[month] += comm;
          }
        }
      });
    } else {
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
        
        income += nominal;
        
        if (peserta.created_at) {
          const date = new Date(peserta.created_at);
          const month = date.getMonth();
          if (!isNaN(month)) monthlyIncome[month] += nominal;
        }
      });
    }

    return {
      totalIncome: income,
      totalExpense: expense,
      totalLaba: income - expense,
      incomeByMonth: monthlyIncome,
      expenseByMonth: monthlyExpense
    };
  }, [transactions, pesertaLunas, formWajibMap, formRegisterMap]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const currentMonthIndex = new Date().getMonth();
  // Get last 6 months for sparklines
  const sparklineLabels = Array.from({length: 6}, (_, i) => {
      const d = new Date();
      d.setMonth(currentMonthIndex - 5 + i);
      return d.toLocaleDateString('id-ID', { month: 'short' });
  });

  const sparklineIncomeData = useMemo(() => {
      const data = [];
      for (let i = 5; i >= 0; i--) {
          let m = currentMonthIndex - i;
          if (m < 0) m += 12;
          data.push(incomeByMonth[m]);
      }
      return data;
  }, [incomeByMonth, currentMonthIndex]);
  
  const sparklineExpenseData = useMemo(() => {
      const data = [];
      for (let i = 5; i >= 0; i--) {
          let m = currentMonthIndex - i;
          if (m < 0) m += 12;
          data.push(expenseByMonth[m]);
      }
      return data;
  }, [expenseByMonth, currentMonthIndex]);

  const sparklineLabaData = sparklineIncomeData.map((inc, i) => inc - sparklineExpenseData[i]);

  const createSparklineOptions = (color) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false, min: 0 }
    },
    elements: {
      point: { radius: 0, hitRadius: 10, hoverRadius: 4 },
      line: { tension: 0.4, borderWidth: 2 }
    },
    layout: { padding: 0 }
  });

  const createSparklineData = (dataArray, color, bgColor) => ({
    labels: sparklineLabels,
    datasets: [
      {
        data: dataArray,
        borderColor: color,
        backgroundColor: bgColor,
        fill: true,
      }
    ]
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-6">
      <div className="flex flex-col lg:flex-row">
        
        {/* Total Income */}
        <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp size={64} className="text-emerald-500" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Income</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">
              {formatCurrency(totalIncome)}
            </p>
            <div className="h-12 w-full mt-auto">
              <Line 
                data={createSparklineData(sparklineIncomeData, '#10b981', 'rgba(16, 185, 129, 0.1)')} 
                options={createSparklineOptions()} 
              />
            </div>
          </div>
        </div>

        {/* Total Expense */}
        <div className="flex-1 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <TrendingDown size={64} className="text-red-500" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <TrendingDown size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expense</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">
              {formatCurrency(totalExpense)}
            </p>
            <div className="h-12 w-full mt-auto">
              <Line 
                data={createSparklineData(sparklineExpenseData, '#ef4444', 'rgba(239, 68, 68, 0.1)')} 
                options={createSparklineOptions()} 
              />
            </div>
          </div>
        </div>

        {/* Total Laba Bersih */}
        <div className="flex-1 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-300">
            <DollarSign size={64} className="text-blue-500" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <DollarSign size={20} />
              </div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Laba Bersih</h3>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-4">
              {formatCurrency(totalLaba)}
            </p>
            <div className="h-12 w-full mt-auto">
              <Line 
                data={createSparklineData(sparklineLabaData, '#3b82f6', 'rgba(59, 130, 246, 0.1)')} 
                options={createSparklineOptions()} 
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
