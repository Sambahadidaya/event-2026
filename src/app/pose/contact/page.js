import { MessageCircle } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import PageHero from '@/components/public/PageHero';
import PjLombaContactSection from '@/components/public/PjLombaContactSection';

export default function PoseContact() {
    return (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500">
            <PageHero
                site="pose"
                icon={MessageCircle}
                title="Kontak Panitia POSE"
                subtitle="Ada pertanyaan, masukan, atau kritik? Sampaikan melalui form di bawah ini. Atau hubungi Kontak Penanggung Jawab (PJ) Lomba dibawah form ini."
            />
            <ContactForm site="pose" />

            <PjLombaContactSection site="pose" />
        </div>
    );
}

