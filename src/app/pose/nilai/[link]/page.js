'use client';

import { useState, useEffect, use } from 'react';
import { Trophy, UserCheck, Star, CheckCircle2, AlertCircle, Sparkles, Send } from 'lucide-react';
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
            <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-500">Memuat Form Penilaian Juri...</p>
            </div>
        );
    }

    if (!formNilai) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
                <AlertCircle size={48} className="mx-auto text-red-500" />
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
        // <ScheduleBarrier pageType="penilaian">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500 space-y-8 pb-20">
            <PageHero
                site="pose"
                icon={Trophy}
                title={`Form Penilaian: ${formNilai.nama_lomba}`}
                subtitle={`Portal resmi penilain juri oleh ${formNilai.nama_juri}`}
            />

            {/* Info Card */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-orange-100 text-xs font-bold uppercase tracking-wider mb-1">
                        <UserCheck size={16} />
                        Juri Terdaftar
                    </div>
                    <h2 className="text-2xl font-extrabold">{formNilai.nama_juri}</h2>
                    <p className="text-sm text-orange-100 mt-1">Lomba Kreativitas — {formNilai.nama_lomba}</p>
                </div>

                <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/30 text-right">
                    <div className="text-xs font-medium text-orange-100">Jumlah Kriteria</div>
                    <div className="text-xl font-black">{judulList.length} Indikator</div>
                </div>
            </div>

            {/* Success Alert */}
            {successMessage && (
                <div className="p-4 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-green-600 shrink-0" />
                    <span className="font-bold text-sm">{successMessage}</span>
                </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
                <div className="p-4 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-2xl flex items-center gap-3">
                    <AlertCircle size={24} className="text-red-600 shrink-0" />
                    <span className="font-bold text-sm">{errorMessage}</span>
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <Sparkles className="text-orange-500" />
                    Lembar Penilaian Karya Tim
                </h3>

                {/* Select Team */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        1. Pilih Tim Peserta ({formNilai.nama_lomba})
                    </label>
                    <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        required
                        className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-base outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                    >
                        <option value="">-- Pilih Tim yang Dinilai --</option>
                        {teams.map(t => {
                            const isEvaluated = evaluatedTeamIds.includes(t.id);
                            return (
                                <option key={t.id} value={t.id} disabled={isEvaluated}>
                                    {t.title} {isEvaluated ? ' (Sudah Dinilai)' : ''}
                                </option>
                            );
                        })}
                    </select>
                    
                    {teams.length === 0 && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1.5 italic">
                            Belum ada tim terverifikasi untuk perlombaan {formNilai.nama_lomba}.
                        </p>
                    )}
                    {teams.length > 0 && availableTeamsCount === 0 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 font-bold">
                            Semua tim telah selesai Anda nilai! 🎉
                        </p>
                    )}

                    {selectedTeamId && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Link / File Hasil Pengumpulan Tim
                            </div>
                            {loadingSubmission ? (
                                <div className="text-sm text-gray-400 animate-pulse">Memuat data pengumpulan...</div>
                            ) : selectedTeamSubmission?.file_link ? (
                                <div className="space-y-2">
                                    <a
                                        href={selectedTeamSubmission.file_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline break-all"
                                    >
                                        Buka Hasil Pengumpulan
                                    </a>
                                    {selectedTeamSubmission.keterangan && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                            Keterangan: "{selectedTeamSubmission.keterangan}"
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">Tim ini belum mengumpulkan karya.</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Dynamic Score Inputs */}
                <div className="space-y-4 pt-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                        2. Input Nilai per Kriteria (Skala 0 - 100)
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                        {judulList.map((judul, idx) => {
                            const bobot = bobotList[idx] || '0';
                            return (
                                <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-base text-gray-900 dark:text-white">{judul}</h4>
                                        <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-0.5">Bobot Nilai: {bobot}%</p>
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
                                            className="w-32 p-3 text-center font-extrabold text-lg rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                        />
                                        <span className="text-sm font-bold text-gray-400">/ 100</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Kritik & Saran */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            3. Catatan Kritik (Opsional)
                        </label>
                        <textarea
                            rows="3"
                            value={kritik}
                            onChange={(e) => setKritik(e.target.value)}
                            placeholder="Tuliskan masukan kritik untuk karya tim ini..."
                            className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500"
                        ></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            4. Catatan Saran (Opsional)
                        </label>
                        <textarea
                            rows="3"
                            value={saran}
                            onChange={(e) => setSaran(e.target.value)}
                            placeholder="Tuliskan saran perbaikan karya..."
                            className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-orange-500"
                        ></textarea>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                    <Send size={18} />
                    <span>{submitting ? 'Mengirim Penilaian...' : 'Kirim Penilaian Karya'}</span>
                </button>
            </form>

            {/* Submitted Scores List */}
            {submittedList.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        <Star className="text-yellow-500" size={18} />
                        Riwayat Penilaian yang Telah Dikirim ({submittedList.length})
                    </h4>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {submittedList.map((item) => (
                            <div key={item.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-gray-900 dark:text-white">{item.team?.title || 'Tim Peserta'}</div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-extrabold text-sm rounded-full">
                                        Nilai: {item.nilai_akhir !== null ? Number(item.nilai_akhir).toFixed(2) : '-'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        // </ScheduleBarrier>
    );
}
