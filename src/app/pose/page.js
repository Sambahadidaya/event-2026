import HomeLanding from '@/components/public/HomeLanding';
import { getSiteContent, getLogoSlides, getMascotInfo, getLombaList, getLombaKategori } from '@/api/logic/homeLandingLogic';

export default async function PoseHome() {
    const [content, logoSlides, mascotInfo, lombaList, lombaKategori] = await Promise.all([
        getSiteContent('pose'),
        getLogoSlides('pose'),
        getMascotInfo('pose'),
        getLombaList(),
        getLombaKategori()
    ]);

    return (
        <HomeLanding
            site="pose"
            content={content}
            logoSlides={logoSlides}
            mascotInfo={mascotInfo}
            lombaList={lombaList}
            lombaKategori={lombaKategori}
        />
    );
}


