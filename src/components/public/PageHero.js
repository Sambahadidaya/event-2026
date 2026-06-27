import { getTheme } from '@/lib/siteThemes';

export default function PageHero({ site, icon: Icon, title, subtitle }) {
    const theme = getTheme(site);

    return (
        <div className="relative mb-10 md:mb-12">
            <div className="glass rounded-3xl p-6 md:p-10 relative overflow-hidden">
                <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[60px] ${theme.blob1}`} />
                <div className={`absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-[50px] ${theme.blob2}`} />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
                    {Icon && (
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${theme.iconBg}`}>
                            <Icon size={28} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">{subtitle}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
