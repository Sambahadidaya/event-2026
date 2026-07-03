import { MessageCircle } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';

export default function PoseContact() {
    return (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500">
            <PageHero
                site="pose"
                icon={MessageCircle}
                title="Kontak Panitia POSE"
                subtitle="Punya pertanyaan seputar pendaftaran atau jadwal? Hubungi kami di sini."
            />
            <ContactForm site="pose" />

        </div>
    );
}
