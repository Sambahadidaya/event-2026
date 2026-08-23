'use client';

import { useState, useMemo } from 'react';
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
import { ChevronLeft, ChevronRight, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';

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

function getWibDate(dateInput) {
  if (!dateInput) return null;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [y, m, dayStr] = dateInput.trim().split('-').map(Number);
    return new Date(y, m - 1, dayStr, 12, 0, 0);
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(d);
    let year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0;
    for (const p of parts) {
      if (p.type === 'year') year = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10) - 1;
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'hour') hour = parseInt(p.value, 10);
      if (p.type === 'minute') minute = parseInt(p.value, 10);
      if (p.type === 'second') second = parseInt(p.value, 10);
    }
    return new Date(year, month, day, hour, minute, second);
  } catch (e) {
    return d;
  }
}

export default function KeuanganAreaChart({
  transactions = [],
  pesertaLunas = [],
  formWajibMap = {},
  formRegisterMap = {}
}) {
  const [filterType, setFilterType] = useState('month'); // 'day' | 'week' | 'month'
  const [offset, setOffset] = useState(0); // 0 = current period, 1 = previous period, etc.

  // Extract all standardized financial entries
  const allEntries = useMemo(() => {
    const list = [];
    if (transactions && transactions.length > 0) {
      transactions.forEach(item => {
        const isExpense = item.kategori?.type_transaksi === 'expense' || item.kode_payer?.startsWith('EXP');
        const val = Number(item.nominal || 0);
        const dateStr = item.tanggal_transaksi || item.created_at;
        const date = getWibDate(dateStr);
        if (date && !isNaN(date.getTime())) {
          list.push({ date, nominal: val, type: isExpense ? 'expense' : 'income' });

          const comm = Number(item.potongan_sales || 0);
          if (comm > 0) {
            list.push({ date, nominal: comm, type: 'expense' });
          }
        }
      });
    } else {
      pesertaLunas.forEach(peserta => {
        let nominal = peserta.nominal || peserta.nominal_pembayaran || 0;
        if (!nominal && peserta.kode_form) {
          const kodeForm = peserta.kode_form.length > 4 ? peserta.kode_form.slice(0, -4) : peserta.kode_form;
          if (peserta.jenis_form === 'wajib' && formWajibMap[kodeForm]) {
            nominal = formWajibMap[kodeForm].nominal || 0;
          } else if (peserta.jenis_form === 'register' && formRegisterMap[kodeForm]) {
            nominal = formRegisterMap[kodeForm].nominal || 0;
          }
        }
        const date = getWibDate(peserta.created_at);
        if (date && !isNaN(date.getTime())) {
          list.push({ date, nominal, type: 'income' });
        }
      });
    }
    return list;
  }, [transactions, pesertaLunas, formWajibMap, formRegisterMap]);

  // Compute bucketed data based on filterType and offset
  const { labels, incomeData, expenseData, periodTitle, periodSubtitle, totalPeriodIncome, totalPeriodExpense } = useMemo(() => {
    const today = new Date();

    if (filterType === 'day') {
      // 7 days window
      const daysCount = 7;
      const bucketLabels = [];
      const bucketIncomes = new Array(daysCount).fill(0);
      const bucketExpenses = new Array(daysCount).fill(0);

      // Base anchor date
      const anchorDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (offset * daysCount));
      const dates = [];

      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate() - i);
        dates.push(d);
        bucketLabels.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }));
      }

      const startDate = dates[0];
      const endDate = dates[dates.length - 1];

      allEntries.forEach(entry => {
        const eDate = new Date(entry.date.getFullYear(), entry.date.getMonth(), entry.date.getDate());
        dates.forEach((d, idx) => {
          if (eDate.getTime() === d.getTime()) {
            if (entry.type === 'income') {
              bucketIncomes[idx] += entry.nominal;
            } else {
              bucketExpenses[idx] += entry.nominal;
            }
          }
        });
      });

      const sTitle = `${startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      const sSubtitle = offset === 0 ? 'Tren harian (7 hari terakhir)' : `Periode ${sTitle}`;

      const totalInc = bucketIncomes.reduce((a, b) => a + b, 0);
      const totalExp = bucketExpenses.reduce((a, b) => a + b, 0);

      return {
        labels: bucketLabels,
        incomeData: bucketIncomes,
        expenseData: bucketExpenses,
        periodTitle: sTitle,
        periodSubtitle: sSubtitle,
        totalPeriodIncome: totalInc,
        totalPeriodExpense: totalExp
      };
    }

    if (filterType === 'week') {
      // 5 weeks window
      const weeksCount = 5;
      const bucketLabels = [];
      const bucketIncomes = new Array(weeksCount).fill(0);
      const bucketExpenses = new Array(weeksCount).fill(0);

      const anchorDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (offset * weeksCount * 7));
      const weekRanges = [];

      for (let i = weeksCount - 1; i >= 0; i--) {
        const endW = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate() - (i * 7), 23, 59, 59, 999);
        const startW = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate() - (i * 7) - 6, 0, 0, 0, 0);
        weekRanges.push({ start: startW, end: endW });
        bucketLabels.push(`${startW.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${endW.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`);
      }

      const overallStart = weekRanges[0].start;
      const overallEnd = weekRanges[weekRanges.length - 1].end;

      allEntries.forEach(entry => {
        const time = entry.date.getTime();
        weekRanges.forEach((range, idx) => {
          if (time >= range.start.getTime() && time <= range.end.getTime()) {
            if (entry.type === 'income') {
              bucketIncomes[idx] += entry.nominal;
            } else {
              bucketExpenses[idx] += entry.nominal;
            }
          }
        });
      });

      const sTitle = `${overallStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${overallEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      const sSubtitle = offset === 0 ? 'Tren mingguan (5 minggu terakhir)' : `Periode ${sTitle}`;

      const totalInc = bucketIncomes.reduce((a, b) => a + b, 0);
      const totalExp = bucketExpenses.reduce((a, b) => a + b, 0);

      return {
        labels: bucketLabels,
        incomeData: bucketIncomes,
        expenseData: bucketExpenses,
        periodTitle: sTitle,
        periodSubtitle: sSubtitle,
        totalPeriodIncome: totalInc,
        totalPeriodExpense: totalExp
      };
    }

    // Default: 'month' (12 months for target year)
    const targetYear = today.getFullYear() - offset;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const bucketIncomes = new Array(12).fill(0);
    const bucketExpenses = new Array(12).fill(0);

    allEntries.forEach(entry => {
      if (entry.date.getFullYear() === targetYear) {
        const m = entry.date.getMonth();
        if (entry.type === 'income') {
          bucketIncomes[m] += entry.nominal;
        } else {
          bucketExpenses[m] += entry.nominal;
        }
      }
    });

    const sTitle = `Tahun ${targetYear}`;
    const sSubtitle = offset === 0 ? `Tren bulanan (Januari - Desember ${targetYear})` : `Tren bulanan tahun ${targetYear}`;

    const totalInc = bucketIncomes.reduce((a, b) => a + b, 0);
    const totalExp = bucketExpenses.reduce((a, b) => a + b, 0);

    return {
      labels: monthNames,
      incomeData: bucketIncomes,
      expenseData: bucketExpenses,
      periodTitle: sTitle,
      periodSubtitle: sSubtitle,
      totalPeriodIncome: totalInc,
      totalPeriodExpense: totalExp
    };
  }, [filterType, offset, allEntries]);

  const handlePrev = () => {
    setOffset(prev => prev + 1);
  };

  const handleNext = () => {
    setOffset(prev => prev - 1);
  };

  const handleReset = () => {
    setOffset(0);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: incomeData,
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Expense',
        data: expenseData,
        borderColor: '#ef4444', // red-500
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: 'bold'
          },
          padding: 15
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        titleFont: { size: 13, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
        boxPadding: 4,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: {
          font: { size: 11, weight: '500' },
          color: '#94a3b8'
        }
      },
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
          drawBorder: false,
        },
        ticks: {
          font: { size: 11 },
          color: '#94a3b8',
          callback: function (value) {
            if (value === 0) return 'Rp 0';
            if (value >= 1000000000) return 'Rp ' + (value / 1000000000).toFixed(1) + 'B';
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
    <div className="relative bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col overflow-hidden">

      {/* Header with Title, Period Info, and Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
              Cash Flow
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {periodTitle}
            </span>
            {offset !== 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
                title="Kembali ke periode sekarang"
              >
                <RotateCcw size={11} /> Periode Sekarang
              </button>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {periodSubtitle}
          </p>
        </div>

        {/* Filter Switcher: Per Hari, Per Minggu, Per Bulan */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 self-start sm:self-auto border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => { setFilterType('day'); setOffset(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === 'day'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
          >
            Perminggu
          </button>
          <button
            type="button"
            onClick={() => { setFilterType('week'); setOffset(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === 'week'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
          >
            Perbulan
          </button>
          <button
            type="button"
            onClick={() => { setFilterType('month'); setOffset(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterType === 'month'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
          >
            Pertahun
          </button>
        </div>
      </div>

      {/* Mini Summary Strip for Selected Period */}
      <div className="flex items-center gap-4 mb-2 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
          <TrendingUp size={14} />
          <span>Income: {formatCurrency(totalPeriodIncome)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
          <TrendingDown size={14} />
          <span>Expense: {formatCurrency(totalPeriodExpense)}</span>
        </div>
      </div>

      {/* Chart Canvas Area with Left and Right Navigation Buttons */}
      <div className="relative flex-1 w-full min-h-[300px] flex items-center">

        {/* Tombol < (Pojok Kiri Tengah) */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-0 sm:-left-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-600 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-md hover:shadow-lg border border-slate-200/90 dark:border-slate-700/90 hover:border-emerald-500/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group backdrop-blur-xs cursor-pointer"
          title="Periode Sebelumnya"
          aria-label="Periode Sebelumnya"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>

        {/* Chart Line Container */}
        <div className="w-full h-full px-7 sm:px-9">
          <Line data={chartData} options={options} />
        </div>

        {/* Tombol > (Pojok Kanan Tengah) */}
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-0 sm:-right-1 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-slate-800/95 text-slate-600 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-md hover:shadow-lg border border-slate-200/90 dark:border-slate-700/90 hover:border-emerald-500/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group backdrop-blur-xs cursor-pointer"
          title="Periode Berikutnya"
          aria-label="Periode Berikutnya"
        >
          <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

    </div>
  );
}

