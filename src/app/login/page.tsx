'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { FaEnvelope, FaLock, FaGoogle } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/tasks');
    } catch (error) {
      setError('Falha ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      router.push('/tasks');
    } catch (error) {
      setError('Falha ao fazer login com Google.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-wood-50/80 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-wood-200 w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-charcoal-800 mb-6 text-center">Bem-vindo de volta</h2>
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-charcoal-700 mb-2" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-charcoal-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-wood-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-charcoal-700 mb-2" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-charcoal-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-wood-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 bg-white"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-forest-600 text-white py-2 rounded-lg hover:bg-forest-700 transition-colors ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-wood-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-wood-50 text-charcoal-500">
                Ou continue com
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="mt-4 w-full flex items-center justify-center space-x-2 bg-white text-charcoal-700 border border-wood-200 py-2 rounded-lg hover:bg-wood-50 transition-colors"
          >
            <FaGoogle />
            <span>Google</span>
          </button>
        </div>

        <p className="mt-8 text-center text-charcoal-600">
          Não tem uma conta?{' '}
          <Link href="/signup" className="text-forest-600 hover:text-forest-700">
            Criar conta
          </Link>
        </p>
      </motion.div>
    </div>
  );
} 