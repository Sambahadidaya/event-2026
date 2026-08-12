import HomeLanding from '@/components/public/HomeLanding';
import { getSiteContent, getLogoSlides, getMascotInfo } from '@/api/logic/homeLandingLogic';

export default async function PkkmbHome() {
    const [content, logoSlides, mascotInfo] = await Promise.all([
        getSiteContent('pkkmb'),
        getLogoSlides('pkkmb'),
        getMascotInfo('pkkmb')
    ]);

    return (
        <HomeLanding
            site="pkkmb"
            content={content}
            logoSlides={logoSlides}
            mascotInfo={mascotInfo}
        />
    );
}

