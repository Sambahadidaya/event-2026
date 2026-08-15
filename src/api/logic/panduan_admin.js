'use server';

import { panduanAdminData } from '@/data/panduan_admin';

// Import admin update assets
import adminPkkmbUpdate11 from '@/assets/update/admin_pkkmb/versi1.1.png';
import adminPkkmbUpdate12 from '@/assets/update/admin_pkkmb/versi1.2.png';

import adminPoseUpdate11 from '@/assets/update/admin_pose/versi1.1.png';
import adminPoseUpdate12 from '@/assets/update/admin_pose/versi1.2.png';

const updateAdminImageMap = {
    pkkmb: {
        'versi1.1': adminPkkmbUpdate11,
        'versi1.2': adminPkkmbUpdate12,
    },
    pose: {
        'versi1.1': adminPoseUpdate11,
        'versi1.2': adminPoseUpdate12,
    }
};

export async function getPanduanAdminBySite(site) {
    const targetSite = site === 'pkkmb' ? 'pkkmb' : 'pose';
    const rawData = panduanAdminData[targetSite] || { sections: [], updateVersi: [] };

    const updateVersiWithImages = (rawData.updateVersi || []).map(item => {
        const image = updateAdminImageMap[targetSite]?.[item.imageKey] || null;
        return {
            ...item,
            image
        };
    });

    return {
        site: targetSite,
        sections: rawData.sections || [],
        updateVersi: updateVersiWithImages
    };
}
