'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaHome, FaTasks, FaBullseye, FaChartLine, FaSignOutAlt, FaUser } from 'react-icons/fa';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/', label: 'Início', icon: FaHome },
    { href: '/tasks', label: 'Tarefas', icon: FaTasks },
    { href: '/goals', label: 'Objetivos', icon: FaBullseye },
    { href: '/performance', label: 'Desempenho', icon: FaChartLine },
  ];

  return (
    <nav className="bg-[#6c443c] text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link 
              href="/"
              className="text-xl font-bold tracking-tight hover:text-[#9ed09e] transition-colors"
            >
              MindFlow++
            </Link>

            {user && (
              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors
                        ${isActive(item.href)
                          ? 'bg-[#5b3a35] text-[#9ed09e]'
                          : 'hover:bg-[#5b3a35] hover:text-[#c8e5c8]'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#5b3a35]">
                <FaUser className="text-[#9ed09e]" />
                <span className="text-white">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-[#5b3a35] transition-colors"
              >
                <FaSignOutAlt />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 