import PanduanPage from '@/components/public/PanduanPage';
import { getPanduanBySite } from '@/api/logic/panduanLogic';
import PengembangBarrier from '@/components/public/PengembangBarrier';

export default async function PkkmbPanduan() {
    const data = await getPanduanBySite('pkkmb');

    return (
        <PengembangBarrier>

            <PanduanPage
                site="pkkmb"
                data={data}
            />
        </PengembangBarrier>
    );
}
