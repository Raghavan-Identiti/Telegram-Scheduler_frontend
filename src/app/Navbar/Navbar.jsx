// components/Navbar.jsx
'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import telegramIcon from '../../assests/telegram-icon.png';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const navItems = [
  // { label: 'Manual Schedule', href: '/manual-schedule' },
  // { label: 'Calendar-AutoScheduler', href: '/calender' },
  { label: 'Auto Schedule', href: '/auto-schedule' },
  { label: 'Post Reader', href: '/post-reader' },
  // { label: 'Logs', href: '/logs' },
//   { label: 'Settings', href: '/settings' } // Optional
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold text-[#29b6f6] w-10 h-10 flex items-center text-nowrap">
            <Image src={telegramIcon} alt="Telegram" />
        Telegram Scheduler
      </div>
      <ul className="flex space-x-6 text-sm font-medium text-black-700">
        {navItems.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "hover:text-[#29b6f6]-600 transition-colors",
                pathname === href ? "text-[#29b6f6]-600 underline" : ""
              )}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
