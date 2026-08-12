import KetentuanPage from '@/components/public/KetentuanPage';
import { getKetentuanBySite } from '@/api/logic/ketentuanLogic';
import PengembangBarrier from '@/components/public/PengembangBarrier';

export default async function PkkmbKetentuan() {
    const data = await getKetentuanBySite('pkkmb');

    return (
        <PengembangBarrier>
            <KetentuanPage
                site="pkkmb"
                data={data}
            />
        </PengembangBarrier>
    );
}

