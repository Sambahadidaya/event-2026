'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, FileText } from 'lucide-react';
import TablePagination from '@/components/panitia/TablePagination';
import { formatDateTime } from '@/lib/dashboardUtils';

const ITEMS_PER_PAGE = 10;

export default function KeuanganTabelVerifikasi({ 
  pesertaLunas = [], 
  formWajibMap = {}, 
  formRegisterMap = {}, 
  adminRole = '',
  activeSite = 'all' 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('wajib'); // 'wajib' | 'register'
  const [currentPage, setCurrentPage] = useState(1);
  const [nimSortOrder, setNimSortOrder] = useState('none');

  const isPkkmbAdmin = Boolean(adminRole && adminRole.includes('pkkmb'));

  // Ensure pkkmb admin only sees 'wajib'
  useEffect(() => {
    if (isPkkmbAdmin) {
      setActiveTab('wajib');
    }
  }, [isPkkmbAdmin]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, nimSortOrder]);

  const filteredData = useMemo(() => {
    const result = pesertaLunas.filter(item => {
      // Filter by activeTab (wajib vs register)
      if (activeTab === 'wajib' && item.jenis_form !== 'wajib') return false;
      if (activeTab === 'register' && item.jenis_form !== 'register') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        const matchNama = item.nama && item.nama.toLowerCase().includes(searchLower);
        const matchNim = item.nim && item.nim.toLowerCase().includes(searchLower);
        const matchKampus = item.kampus && item.kampus.toLowerCase().includes(searchLower);
        const matchKategori = item.kategori && item.kategori.toLowerCase().includes(searchLower);
        return matchNama || matchNim || matchKampus || matchKategori;
      }

      return true;
    });

    if (nimSortOrder !== 'none') {
      result.sort((a, b) => {
        const nimA = a.nim || '';
        const nimB = b.nim || '';
        if (nimSortOrder === 'asc') return nimA.localeCompare(nimB, undefined, { numeric: true });
        if (nimSortOrder === 'desc') return nimB.localeCompare(nimA, undefined, { numeric: true });
        return 0;
      });
    }

    return result;
  }, [pesertaLunas, activeTab, searchQuery, nimSortOrder]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getNominal = (peserta) => {
    if (peserta.nominal !== undefined && peserta.nominal !== null && peserta.nominal !== '') {
      return Number(peserta.nominal) || 0;
    }
    if (peserta.nominal_pembayaran) return peserta.nominal_pembayaran;
    
    if (!peserta.kode_form) return 0;
    const kodeFormFull = peserta.kode_form;
    const kodeFormBase = peserta.kode_form.length > 4 ? peserta.kode_form.slice(0, -4) : peserta.kode_form;
    
    if (peserta.jenis_form === 'wajib') {
      const match = formWajibMap[kodeFormFull] || formWajibMap[kodeFormBase];
      if (match) return match.nominal || 0;
    }
    
    return 0;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
      
      {/* Header & Filters */}
      <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FileText size={20} className="text-emerald-500" />
              Data Peserta Lunas
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Daftar transaksi yang masuk ke total income
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('wajib')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${activeTab === 'wajib' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Form Wajib
            </button>
            <button
              onClick={() => setActiveTab('register')}
              disabled={isPkkmbAdmin}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${isPkkmbAdmin ? 'opacity-50 cursor-not-allowed' : ''} ${activeTab === 'register' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
              title={isPkkmbAdmin ? "Akses dibatasi untuk Admin PKKMB" : ""}
            >
              Form Register
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, nim, kategori, atau kampus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800 dark:text-white placeholder:text-slate-400"
            />
          </div>

          <div className="relative w-full sm:w-52 shrink-0">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={nimSortOrder}
              onChange={(e) => setNimSortOrder(e.target.value)}
              className="w-full pl-9 pr-7 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xs sm:text-sm text-slate-800 dark:text-white appearance-none cursor-pointer font-medium"
            >
              <option value="none">Urutan NIM: Default</option>
              <option value="asc">NIM: Terkecil → Terbesar</option>
              <option value="desc">NIM: Terbesar → Terkecil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto min-h-[300px]">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-12">
            <Filter size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-base font-medium">Tidak ada data ditemukan</p>
            <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-semibold rounded-tl-xl w-16">No</th>
                <th className="px-6 py-4 font-semibold">Peserta</th>
                <th className="px-6 py-4 font-semibold">Kampus</th>
                <th className="px-6 py-4 font-semibold">Jenis Form</th>
                <th className="px-6 py-4 font-semibold text-right">Nominal (Rp)</th>
                <th className="px-6 py-4 font-semibold">Tanggal Pembayaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800 dark:text-white capitalize">
                      {item.nama || '-'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex gap-2">
                      <span className="uppercase">{item.nim || '-'}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 self-center"></span>
                      <span className="capitalize">{item.kategori || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-slate-700 dark:text-slate-300">{item.kampus || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize border border-slate-200 dark:border-slate-700">
                      {item.jenis_form || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-800 dark:text-white">
                     {formatCurrency(getNominal(item))}
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-slate-600 dark:text-slate-400 text-sm">{formatDateTime(item.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <TablePagination 
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredData.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
