'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaChartLine, FaListAlt, FaBullseye, FaUserAlt } from 'react-icons/fa';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9c6550]"></div>
      </div>
    );
  }

  // Se o usuário já estiver logado, o redirecionamento acima tratará disso
  // Esta renderização só ocorre para usuários não logados
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16">
          <motion.h1 
            className="text-4xl font-bold text-[#5b3a35] mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            MindFlow++
          </motion.h1>
          <motion.p
            className="text-xl text-[#6c443c] max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Organize suas tarefas, estabeleça objetivos e cultive hábitos positivos em uma plataforma única e integrada.
          </motion.p>
        </header>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d4b397] text-center">
            <div className="w-16 h-16 bg-[#f7eee3] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaChartLine className="text-[#9c6550] text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-[#5b3a35] mb-2">Dashboard Intuitivo</h3>
            <p className="text-[#6c443c]">Visualize seu progresso e mantenha-se motivado com estatísticas claras.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d4b397] text-center">
            <div className="w-16 h-16 bg-[#f7eee3] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaListAlt className="text-[#9c6550] text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-[#5b3a35] mb-2">Tarefas Organizadas</h3>
            <p className="text-[#6c443c]">Gerencie suas tarefas diárias e projetos com facilidade e em um só lugar.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d4b397] text-center">
            <div className="w-16 h-16 bg-[#f7eee3] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBullseye className="text-[#9c6550] text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-[#5b3a35] mb-2">Objetivos Claros</h3>
            <p className="text-[#6c443c]">Defina objetivos, acompanhe seu progresso e comemore suas conquistas.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-[#d4b397] text-center">
            <div className="w-16 h-16 bg-[#f7eee3] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUserAlt className="text-[#9c6550] text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-[#5b3a35] mb-2">Experiência Personalizada</h3>
            <p className="text-[#6c443c]">Adapte a plataforma ao seu estilo de trabalho e necessidades específicas.</p>
          </div>
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-2xl font-bold text-[#5b3a35] mb-6">Pronto para começar?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="btn btn-primary px-8 py-3"
            >
              Entrar
            </Link>
            <Link 
              href="/register" 
              className="btn btn-outline px-8 py-3"
            >
              Criar Conta
            </Link>
          </div>
        </motion.div>
      </div>

      <footer className="mt-24 py-8 bg-[#f7eee3]">
        <div className="max-w-7xl mx-auto px-4 text-center text-[#6c443c]">
          <p className="text-sm">© {new Date().getFullYear()} MindFlow++ | Organização e produtividade ao seu alcance</p>
        </div>
      </footer>
    </div>
  );
} 