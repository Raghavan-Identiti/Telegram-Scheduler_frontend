// components/Navbar.jsx
'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

const navItems = [
  { label: 'Manual Schedule', href: '/manual-schedule' },
  { label: 'Auto Schedule', href: '/auto-schedule' },
  { label: 'Logs', href: '/logs' }, // Optional
//   { label: 'Settings', href: '/settings' } // Optional
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600">
        Telegram Scheduler
      </div>
      <ul className="flex space-x-6 text-sm font-medium text-gray-700">
        {navItems.map(({ label, href }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "hover:text-blue-600 transition-colors",
                pathname === href ? "text-blue-600 underline" : ""
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
