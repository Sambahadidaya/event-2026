'use client';

import { useState, useEffect, use } from 'react';
import { Trophy, UserCheck, Star, CheckCircle2, AlertCircle, Sparkles, Send, ExternalLink, FileText, MessageSquare, Layers } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';
import { getFormNilaiByLink, insertPublicNilaiLomba, getPublicNilaiLombaByForm, getSubmissionByTeamAndLomba } from '@/api/supabase/public/penilaian';
import { getTeams } from '@/api/supabase/public/team';

export default function JuriNilaiPage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const linkId = params.link;

    const [formNilai, setFormNilai] = useState(null);
    const [teams, setTeams] = useState([]);
    const [submittedList, setSubmittedList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedTeamId, setSelectedTeamId] = useState('');
    const [scores, setScores] = useState({});
    const [kritik, setKritik] = useState('');
    const [saran, setSaran] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const [selectedTeamSubmission, setSelectedTeamSubmission] = useState(null);
    const [loadingSubmission, setLoadingSubmission] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!linkId) return;
            setLoading(true);

            const formObj = await getFormNilaiByLink(linkId);
            if (formObj) {
                setFormNilai(formObj);
                const [allTeams, publicNilais] = await Promise.all([
                    getTeams('pose'),
                    getPublicNilaiLombaByForm(formObj.id)
                ]);

                if (allTeams) {
                    const verifiedKreativitas = allTeams.filter(
                        t => t.verivikasi === true &&
                            t.nama_lomba?.toLowerCase().trim() === formObj.nama_lomba?.toLowerCase().trim()
                    );
                    setTeams(verifiedKreativitas);
                }

                if (publicNilais) {
                    setSubmittedList(publicNilais);
                }
            }

            setLoading(false);
        };

        loadData();
    }, [linkId]);

    useEffect(() => {
        if (!selectedTeamId || !formNilai?.nama_lomba) {
            setSelectedTeamSubmission(null);
            return;
        }

        const fetchSubmission = async () => {
            setLoadingSubmission(true);
            const sub = await getSubmissionByTeamAndLomba(selectedTeamId, formNilai.nama_lomba);
            setSelectedTeamSubmission(sub);
            setLoadingSubmission(false);
        };

        fetchSubmission();
    }, [selectedTeamId, formNilai?.nama_lomba]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage(null);
        setErrorMessage(null);

        if (!selectedTeamId) {
            setErrorMessage('Pilih tim peserta yang akan dinilai.');
            return;
        }

        if (!formNilai) return;

        const judulArr = (formNilai.judul_nilai || '').split(',').map(s => s.trim()).filter(Boolean);
        const bobotArr = (formNilai.bobot_nilai || '').split(',').map(s => s.trim()).filter(Boolean);

        const detailPayloads = [];
        for (let i = 0; i < judulArr.length; i++) {
            const scoreVal = scores[i];
            if (scoreVal === undefined || scoreVal === '' || isNaN(scoreVal)) {
                setErrorMessage(`Mohon isi nilai untuk kriteria "${judulArr[i]}".`);
                return;
            }
            detailPayloads.push({
                judul_nilai: judulArr[i],
                bobot_nilai: bobotArr[i] || '0',
                nilai: parseInt(scoreVal, 10) || 0
            });
        }

        setSubmitting(true);

        const nilaiPayload = {
            team_id: selectedTeamId,
            form_nilai_lomba_id: formNilai.id,
            kritik: kritik.trim(),
            saran: saran.trim()
        };

        const res = await insertPublicNilaiLomba(nilaiPayload, detailPayloads);
        setSubmitting(false);

        if (res.success) {
            setSuccessMessage(`Penilaian berhasil disimpan! Nilai Akhir: ${res.nilai_akhir}`);
            setSelectedTeamId('');
            setScores({});
            setKritik('');
            setSaran('');

            // Reload submitted list
            const updated = await getPublicNilaiLombaByForm(formNilai.id);
            if (updated) setSubmittedList(updated);
        } else {
            setErrorMessage(res.error || 'Terjadi kesalahan saat mengirim penilaian.');
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500 font-medium">Memuat Form Penilaian Juri...</p>
            </div>
        );
    }

    if (!formNilai) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
                <AlertCircle size={48} className="mx-auto text-orange-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Form Nilai Tidak Ditemukan</h2>
                <p className="text-gray-500">Tautan form penilaian ini tidak valid atau telah dihapus oleh panitia.</p>
            </div>
        );
    }

    const judulList = (formNilai.judul_nilai || '').split(',').map(s => s.trim()).filter(Boolean);
    const bobotList = (formNilai.bobot_nilai || '').split(',').map(s => s.trim()).filter(Boolean);

    const evaluatedTeamIds = submittedList.map(n => n.team_id);
    const availableTeamsCount = teams.filter(t => !evaluatedTeamIds.includes(t.id)).length;

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500 space-y-8 pb-24">
            <PageHero
                site="pose"
                icon={Trophy}
                title={`Form Penilaian: ${formNilai.nama_lomba}`}
                subtitle={`Portal resmi penilaian juri oleh ${formNilai.nama_juri}`}
            />

            {/* Header Info Card Juri */}
            <div className="bg-slate-950 dark:bg-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800 dark:border-gray-800">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-wider px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                        <UserCheck size={14} />
                        <span>Juri Terdaftar</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{formNilai.nama_juri}</h2>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                        <span>Lomba Kreativitas —</span>
                        <span className="text-orange-500 font-bold px-2 py-0.5 bg-orange-500/10 rounded-md border border-orange-500/20">{formNilai.nama_lomba}</span>
                    </p>
                </div>

                <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-right shrink-0">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kriteria Penilaian</div>
                    <div className="text-2xl font-black text-white mt-0.5">{judulList.length} Indikator</div>
                </div>
            </div>

            {/* Success Alert */}
            {successMessage && (
                <div className="p-4.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl flex items-center gap-3.5 shadow-xs animate-in fade-in duration-300">
                    <CheckCircle2 size={22} className="text-gray-900 dark:text-white shrink-0" />
                    <span className="font-bold text-sm">{successMessage}</span>
                </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
                <div className="p-4.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl flex items-center gap-3.5 shadow-xs animate-in fade-in duration-300">
                    <AlertCircle size={22} className="text-orange-500 shrink-0" />
                    <span className="font-bold text-sm">{errorMessage}</span>
                </div>
            )}

            {/* Main Evaluation Input Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-7">
                <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-5">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                        <Sparkles className="text-orange-500" size={22} />
                        <span>Lembar Penilaian Karya Tim</span>
                    </h3>
                    <span className="text-xs font-semibold px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 border border-gray-200 dark:border-gray-700">
                        {availableTeamsCount} Tim Tersisa
                    </span>
                </div>

                {/* Step 1: Select Team */}
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                        <span>Pilih Tim Peserta ({formNilai.nama_lomba})</span>
                    </label>
                    <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        required
                        className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-bold text-base outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-xs"
                    >
                        <option value="">-- Pilih Tim Peserta yang Akan Dinilai --</option>
                        {teams.map(t => {
                            const isEvaluated = evaluatedTeamIds.includes(t.id);
                            return (
                                <option key={t.id} value={t.id} disabled={isEvaluated}>
                                    {t.title} {isEvaluated ? '✓ (Sudah Dinilai)' : ''}
                                </option>
                            );
                        })}
                    </select>

                    {teams.length === 0 && (
                        <p className="text-xs text-orange-500 dark:text-orange-400 font-medium italic pt-1">
                            Belum ada tim terverifikasi untuk perlombaan {formNilai.nama_lomba}.
                        </p>
                    )}
                    {teams.length > 0 && availableTeamsCount === 0 && (
                        <p className="text-xs text-gray-900 dark:text-gray-100 font-bold pt-1">
                            Semua tim peserta telah selesai Anda nilai! 🎉
                        </p>
                    )}

                    {/* Selected Team Submission Preview Box */}
                    {selectedTeamId && (
                        <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-2.5">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <FileText size={14} className="text-slate-900 dark:text-white" />
                                <span>Hasil Pengumpulan Karya Tim</span>
                            </div>
                            {loadingSubmission ? (
                                <div className="text-sm text-gray-400 animate-pulse py-1">Memuat data pengumpulan karya...</div>
                            ) : selectedTeamSubmission?.file_link ? (
                                <div className="space-y-2">
                                    <a
                                        href={selectedTeamSubmission.file_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 dark:hover:bg-gray-100 transition-all group"
                                    >
                                        <span>Buka Link / File Pengumpulan Karya</span>
                                        <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                    </a>
                                    {selectedTeamSubmission.keterangan && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 italic bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                                            Catatan Pengumpulan: "{selectedTeamSubmission.keterangan}"
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-xs text-orange-500 font-bold py-1">Tim ini belum mengunggah berkas pengumpulan karya.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Step 2: Dynamic Criteria Score Inputs */}
                <div className="space-y-4 pt-2">
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                        <span>Input Nilai per Kriteria (Skala 0 - 100)</span>
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                        {judulList.map((judul, idx) => {
                            const bobot = bobotList[idx] || '0';
                            return (
                                <div key={idx} className="p-4 sm:p-5 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200/80 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-base text-gray-900 dark:text-white">{judul}</h4>
                                        <div className="inline-flex items-center gap-1.5 text-xs text-orange-500 font-semibold mt-1">
                                            <Layers size={13} />
                                            <span>Bobot Penilaian: {bobot}%</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            required
                                            placeholder="0 - 100"
                                            value={scores[idx] !== undefined ? scores[idx] : ''}
                                            onChange={(e) => setScores({ ...scores, [idx]: e.target.value })}
                                            className="w-32 p-3 text-center font-black text-lg rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-xs"
                                        />
                                        <span className="text-sm font-bold text-gray-400">/ 100</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step 3 & 4: Kritik & Saran */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-black">3</span>
                            <span>Catatan Kritik (Opsional)</span>
                        </label>
                        <textarea
                            rows="3"
                            value={kritik}
                            onChange={(e) => setKritik(e.target.value)}
                            placeholder="Tuliskan masukan kritik untuk karya tim ini..."
                            className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center text-[10px] font-black">4</span>
                            <span>Catatan Saran (Opsional)</span>
                        </label>
                        <textarea
                            rows="3"
                            value={saran}
                            onChange={(e) => setSaran(e.target.value)}
                            placeholder="Tuliskan saran perbaikan karya..."
                            className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
                        ></textarea>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-slate-950 font-bold text-base rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 shrink-0"
                >
                    <Send size={18} className="text-orange-500" />
                    <span>{submitting ? 'Mengirim Penilaian...' : 'Kirim Penilaian Karya'}</span>
                </button>
            </form>

            {/* Submitted Scores History List */}
            {submittedList.length > 0 && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-7 border border-gray-200/80 dark:border-gray-800 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3">
                        <h4 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                            <Star className="text-orange-500 fill-orange-500" size={18} />
                            <span>Riwayat Penilaian Dikirim ({submittedList.length})</span>
                        </h4>
                        <span className="text-xs font-semibold text-gray-400">Status Terverifikasi</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {submittedList.map((item) => (
                            <div key={item.id} className="py-3.5 flex justify-between items-center gap-4">
                                <div className="space-y-0.5">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white">{item.team?.title || 'Tim Peserta'}</div>
                                    <div className="text-xs text-gray-400">
                                        {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="px-3.5 py-1.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-sm rounded-xl border border-slate-800 dark:border-gray-200 shadow-xs inline-block">
                                        Nilai: {item.nilai_akhir !== null ? Number(item.nilai_akhir).toFixed(2) : '-'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
