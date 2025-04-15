import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MindFlow++',
  description: 'Organize suas tarefas e alcance seus objetivos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-[#f2e8df]`}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#f2e8df] to-[#e6d1bf]">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
              <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-xl p-6 min-h-[calc(100vh-12rem)] border border-[#d4b397]">
                {children}
              </div>
            </main>
            <footer className="bg-[#6c443c] text-white py-4">
              <div className="container mx-auto px-4 text-center text-sm">
                <p>MindFlow++ &copy; {new Date().getFullYear()} - Organize suas tarefas com estilo</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 