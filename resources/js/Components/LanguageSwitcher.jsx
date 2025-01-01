import { Link } from '@inertiajs/react';

export default function LanguageSwitcher() {
    return (
        <div className="flex gap-4 items-center">
            <Link
                href={route('language.switch', 'en')}
                className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80"
            >
                English
            </Link>
            <Link
                href={route('language.switch', 'ar')}
                className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80"
            >
                العربية
            </Link>
        </div>
    );
}