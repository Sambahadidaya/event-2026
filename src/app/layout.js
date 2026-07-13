import './globals.css';
import { ThemeProvider } from 'next-themes';
import ClientTracker from '@/components/ClientTracker';
import DynamicFavicon from '@/components/DynamicFavicon';

export const metadata = {
    title: 'Portal Kampus 2026',
    description: 'Portal PKKMB & PORAK 2026',
};

export default function RootLayout({ children }) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body>
                <DynamicFavicon />
                <ClientTracker />
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
