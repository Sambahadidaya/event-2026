import PanduanPage from '@/components/public/PanduanPage';
import { getPanduanBySite } from '@/api/logic/panduanLogic';
import PengembangBarrier from '@/components/public/PengembangBarrier';

export default async function PosePanduan() {
    const data = await getPanduanBySite('pose');

    return (
        <PengembangBarrier site="pose" route="/panduan">
            <PanduanPage
                site="pose"
                data={data}
            />
        </PengembangBarrier>
    );
}
