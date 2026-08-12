import PanduanPage from '@/components/public/PanduanPage';
import { getPanduanBySite } from '@/api/logic/panduanLogic';

export default async function PosePanduan() {
    const data = await getPanduanBySite('pose');

    return (
        <PanduanPage
            site="pose"
            data={data}
        />
    );
}
