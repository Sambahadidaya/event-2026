'use server';

import { panduanData } from '@/data/panduanData';

// Import all pose guide assets
import poseDaftar from '@/assets/panduan_pose/daftar.png';
import poseDashboard from '@/assets/panduan_pose/dashboard.png';
import poseFormWajib from '@/assets/panduan_pose/form-wajib.png';
import poseFormDaftar from '@/assets/panduan_pose/form-daftar.png';
import poseFormLanjut from '@/assets/panduan_pose/form-lanjut.png';
import poseJadwal from '@/assets/panduan_pose/jadwal.png';
import poseKetentuan from '@/assets/panduan_pose/ketentuan.png';
import poseKontak from '@/assets/panduan_pose/kontak.png';
import poseLendingPage from '@/assets/panduan_pose/lendingpage.png';
import poseNilai from '@/assets/panduan_pose/nilai.png';
import posePemberitahuan from '@/assets/panduan_pose/pemberitahuan.png';
import poseSubmit from '@/assets/panduan_pose/submit.png';
import poseTeam from '@/assets/panduan_pose/team.png';

// Import all pkkmb guide assets
import pkkmbJadwal from '@/assets/panduan_pkkmb/jadwal.png';
import pkkmbKelompok from '@/assets/panduan_pkkmb/kelompok.png';
import pkkmbKetentuan from '@/assets/panduan_pkkmb/ketentuan.png';
import pkkmbKontak from '@/assets/panduan_pkkmb/kontak.png';
import pkkmbLendingPage from '@/assets/panduan_pkkmb/lendingpage.png';
import pkkmbMateri from '@/assets/panduan_pkkmb/materi.png';
import pkkmbPemberitahuan from '@/assets/panduan_pkkmb/pemberitahuan.png';

// Import update assets
import poseUpdate11 from '@/assets/update/pose/versi1.1.png';
import poseUpdate21 from '@/assets/update/pose/versi2.1.png';
import poseUpdate22 from '@/assets/update/pose/versi2.2.png';
import poseUpdate31 from '@/assets/update/pose/versi3.1.png';

import pkkmbUpdate11 from '@/assets/update/pkkmb/versi1.1.png';
import pkkmbUpdate12 from '@/assets/update/pkkmb/versi1.2.png';

const imageMap = {
    pose: {
        daftar: poseDaftar,
        dashboard: poseDashboard,
        form_wajib: poseFormWajib,
        form_daftar: poseFormDaftar,
        form_lanjut: poseFormLanjut,
        jadwal: poseJadwal,
        ketentuan: poseKetentuan,
        kontak: poseKontak,
        lendingpage: poseLendingPage,
        nilai: poseNilai,
        pemberitahuan: posePemberitahuan,
        submit: poseSubmit,
        team: poseTeam
    },
    pkkmb: {
        jadwal: pkkmbJadwal,
        kelompok: pkkmbKelompok,
        ketentuan: pkkmbKetentuan,
        kontak: pkkmbKontak,
        lendingpage: pkkmbLendingPage,
        materi: pkkmbMateri,
        pemberitahuan: pkkmbPemberitahuan,
        // fallback to pose's register/daftar image if pkkmb doesn't have one
        daftar: poseDaftar
    }
};

const updateImageMap = {
    pose: {
        'versi1.1': poseUpdate11,
        'versi2.1': poseUpdate21,
        'versi2.2': poseUpdate22,
        'versi3.1': poseUpdate31
    },
    pkkmb: {
        'versi1.1': pkkmbUpdate11,
        'versi1.2': pkkmbUpdate12
    }
};

export async function getPanduanBySite(site) {
    if (!site || !panduanData[site]) {
        return { sections: [], updateVersi: [] };
    }

    const rawData = panduanData[site];
    const sectionsWithImages = rawData.sections.map(section => {
        const image = imageMap[site]?.[section.imageKey] || null;
        return {
            ...section,
            image
        };
    });

    const updateVersiWithImages = (rawData.updateVersi || []).map(item => {
        const image = updateImageMap[site]?.[item.imageKey] || null;
        return {
            ...item,
            image
        };
    });

    return {
        sections: sectionsWithImages,
        privacyPolicy: rawData.privacyPolicy || null,
        updateVersi: updateVersiWithImages
    };
}
