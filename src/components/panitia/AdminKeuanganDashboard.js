'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCcw, LayoutDashboard } from 'lucide-react';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import { getPesertaLunas, getFormWajibAll, getFormRegisterAll } from '@/api/supabase/admin/peserta';
import { getTransactionFinance } from '@/api/supabase/admin/finance';
import KeuanganDashboardHeader from '@/components/panitia/KeuanganDashboardHeader';
import KeuanganAreaChart from '@/components/panitia/KeuanganAreaChart';
import KeuanganDonutChart from '@/components/panitia/KeuanganDonutChart';
import KeuanganTabelVerifikasi from '@/components/panitia/KeuanganTabelVerifikasi';
import { formatDateTime } from '@/lib/dashboardUtils';

export default function AdminKeuanganDashboard({ siteType = 'all', adminRole = '' }) {
    const [activeSite, setActiveSite] = useState(siteType);
    const [dataPesertaLunas, setDataPesertaLunas] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [formWajibMap, setFormWajibMap] = useState({});
    const [formRegisterMap, setFormRegisterMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);

    const isSuperAdmin = adminRole === 'super_admin';

    // If siteType from props changes (unlikely unless role changes), update activeSite
    useEffect(() => {
        if (!isSuperAdmin) {
            setActiveSite(siteType);
        }
    }, [siteType, isSuperAdmin]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch participants, transactions & forms
            const [peserta, txData, formWajib, formRegister] = await Promise.all([
                getPesertaLunas(activeSite),
                getTransactionFinance(activeSite),
                getFormWajibAll(),
                getFormRegisterAll()
            ]);

            // Create Maps for O(1) lookup
            const wajibMap = {};
            if (formWajib) {
                formWajib.forEach(form => {
                    if (form.kode_form) wajibMap[form.kode_form] = form;
                });
            }

            const registerMap = {};
            if (formRegister) {
                formRegister.forEach(form => {
                    if (form.kode_form) registerMap[form.kode_form] = form;
                });
            }

            setDataPesertaLunas(peserta || []);
            setTransactions(txData || []);
            setFormWajibMap(wajibMap);
            setFormRegisterMap(registerMap);
            setLastSyncedAt(Date.now());
        } catch (error) {
            console.error("Error fetching dashboard keuangan data:", error);
        } finally {
            setLoading(false);
        }
    }, [activeSite]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header section with Site Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                        <LayoutDashboard className="text-emerald-500" />
                        Dashboard Keuangan
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Rekapitulasi keuangan dari peserta dan transaksi terverifikasi.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto relative z-10">
                    {lastSyncedAt && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium px-2 text-center sm:text-right">
                            Sync terakhir: {formatDateTime(new Date(lastSyncedAt).toISOString())}
                        </span>
                    )}

                    <div className="w-full sm:w-48">
                        <DashboardSelect
                            value={activeSite}
                            onChange={(e) => setActiveSite(e.target.value)}
                            disabled={!isSuperAdmin}
                            options={[
                                { value: 'all', label: 'Semua Site' },
                                { value: 'pkkmb', label: 'PKKMB' },
                                { value: 'pose', label: 'POSE' }
                            ]}
                        />
                    </div>
                    
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all disabled:opacity-50"
                        title="Refresh Data"
                    >
                        <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                        <span className="sm:hidden">Refresh Data</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Memuat data keuangan...</p>
                </div>
            ) : (
                <>
                    {/* Header Cards */}
                    <KeuanganDashboardHeader 
                        transactions={transactions}
                        pesertaLunas={dataPesertaLunas}
                        formWajibMap={formWajibMap}
                        formRegisterMap={formRegisterMap}
                    />

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2">
                            <KeuanganAreaChart 
                                pesertaLunas={dataPesertaLunas}
                                formWajibMap={formWajibMap}
                                formRegisterMap={formRegisterMap}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <KeuanganDonutChart 
                                pesertaLunas={dataPesertaLunas}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <KeuanganTabelVerifikasi 
                        pesertaLunas={dataPesertaLunas}
                        formWajibMap={formWajibMap}
                        formRegisterMap={formRegisterMap}
                        adminRole={adminRole}
                        activeSite={activeSite}
                    />
                </>
            )}
        </div>
    );
}
