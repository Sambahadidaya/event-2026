import KetentuanPage from '@/components/public/KetentuanPage';
import { getKetentuanBySite } from '@/api/logic/ketentuanLogic';
import PengembangBarrier from '@/components/public/PengembangBarrier';

export default async function PoseKetentuan() {
    const data = await getKetentuanBySite('pose');

    return (
        <PengembangBarrier>
            <KetentuanPage
                site="pose"
                data={data}
            />
        </PengembangBarrier>
    );
}

