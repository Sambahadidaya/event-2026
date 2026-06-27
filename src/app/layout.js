import './globals.css';
import { ThemeProvider } from 'next-themes';
import ClientTracker from '@/components/ClientTracker';

export const metadata = {
    title: 'Portal Kampus 2026',
    description: 'Portal PKKMB & PORAK 2026',
};

export default function RootLayout({ children }) {
    return (
        <html lang="id" suppressHydrationWarning>
            <body>
                <ClientTracker />
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
