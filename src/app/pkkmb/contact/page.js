import { MessageCircle } from 'lucide-react';
import ContactForm from '@/components/ContactForm';
import PageHero from '@/components/public/PageHero';

export default function PkkmbContact() {
    return (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500">
            <PageHero
                site="pkkmb"
                icon={MessageCircle}
                title="Kontak Panitia PKKMB"
                subtitle="Ada pertanyaan, masukan, atau kritik? Sampaikan melalui form di bawah ini. Tim PKKMB akan segera menghubungi Anda."
            />
            <ContactForm site="pkkmb" />
        </div>
    );
}
