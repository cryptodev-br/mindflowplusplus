'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import TodoList from '@/components/TodoList';
import Notes from '@/components/Notes';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { FaCalendarCheck, FaFlag, FaStar, FaListUl, FaChartLine, FaArrowRight, FaLightbulb, FaUser, FaQuoteLeft, FaTasks } from 'react-icons/fa';
import Link from 'next/link';
import { format } from 'date-fns';

// Registrar os componentes do Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Lista de frases motivacionais
const motivationalQuotes = [
  "A persistência é o caminho do êxito.",
  "No meio da dificuldade encontra-se a oportunidade.",
  "O sucesso normalmente vem para quem está ocupado demais para procurar por ele.",
  "Não é a força, mas a constância dos bons resultados que conduz os homens à felicidade.",
  "Só se pode alcançar um grande êxito quando nos mantemos fiéis a nós mesmos.",
  "O sucesso parece ser em grande parte uma questão de continuar depois que outros desistiram.",
  "O verdadeiro sucesso não é o sucesso financeiro, mas o sucesso em ajudar outras pessoas.",
  "Não existe um caminho para a felicidade. A felicidade é o caminho.",
  "A maior glória em viver não está em nunca cair, mas em nos levantarmos toda vez que caímos.",
  "É melhor você tentar algo, vê-lo não funcionar e aprender com isso, do que não fazer nada.",
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalGoals: 0,
    completedGoals: 0,
    dailyTasks: 0,
    completedDailyTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentGoals, setRecentGoals] = useState<any[]>([]);
  const [randomQuote, setRandomQuote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    // Selecionar uma frase aleatória
    const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
    setRandomQuote(motivationalQuotes[randomIndex]);
  }, []);

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchRecentTasks();
      fetchRecentGoals();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const todosRef = collection(db, 'todos');
      const todosQuery = query(todosRef, where('userId', '==', user.uid));
      const todosSnapshot = await getDocs(todosQuery);
      
      const goalsRef = collection(db, 'goals');
      const goalsQuery = query(goalsRef, where('userId', '==', user.uid));
      const goalsSnapshot = await getDocs(goalsQuery);
      
      let totalTasks = 0;
      let completedTasks = 0;
      let dailyTasks = 0;
      let completedDailyTasks = 0;
      
      // Função para verificar se uma tarefa diária foi concluída hoje
      const isCompletedToday = (lastCompletedAt: any): boolean => {
        if (!lastCompletedAt) return false;
        
        const today = new Date();
        const lastCompleted = lastCompletedAt.toDate ? lastCompletedAt.toDate() : new Date(lastCompletedAt);
        
        return (
          today.getDate() === lastCompleted.getDate() &&
          today.getMonth() === lastCompleted.getMonth() &&
          today.getFullYear() === lastCompleted.getFullYear()
        );
      };
      
      todosSnapshot.forEach((doc) => {
        const data = doc.data();
        totalTasks++;
        
        if (data.isDaily) {
          dailyTasks++;
          // Para tarefas diárias, verificar se foi concluída hoje
          if (data.lastCompletedAt && isCompletedToday(data.lastCompletedAt)) {
            completedTasks++; // Conta para completedTasks somente se foi concluída hoje
            completedDailyTasks++;
          }
        } else if (data.completed) {
          // Para tarefas regulares, usar o campo completed como sempre
          completedTasks++;
        }
      });
      
      const totalGoals = goalsSnapshot.size;
      let completedGoals = 0;
      
      goalsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.completed || data.status === 'completed' || data.progress === 100) {
          completedGoals++;
        }
      });
      
      setStats({
        totalTasks,
        completedTasks,
        totalGoals,
        completedGoals, // Usar o contador de objetivos completos
        dailyTasks,
        completedDailyTasks
      });
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentTasks = async () => {
    if (!user) return;

    try {
      const todosRef = collection(db, 'todos');
      const q = query(
        todosRef, 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      
      const snapshot = await getDocs(q);
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      }));
      
      setRecentTasks(tasksData);
    } catch (error) {
      console.error('Erro ao buscar tarefas recentes:', error);
    }
  };

  const fetchRecentGoals = async () => {
    if (!user) return;

    try {
      const goalsRef = collection(db, 'goals');
      const q = query(
        goalsRef, 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      
      const snapshot = await getDocs(q);
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      }));
      
      setRecentGoals(goalsData);
    } catch (error) {
      console.error('Erro ao buscar objetivos recentes:', error);
    }
  };

  // Calcular taxas de conclusão
  const taskCompletionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;
    
  const goalCompletionRate = stats.totalGoals > 0
    ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
    : 0;
    
  const dailyTaskCompletionRate = stats.dailyTasks > 0 
    ? Math.round((stats.completedDailyTasks / stats.dailyTasks) * 100) 
    : 0;

  // Cálculo do nível e progresso para o próximo nível
  const currentLevel = Math.floor(stats.completedTasks / 5) + 1;
  const tasksForNextLevel = 5; // Tarefas necessárias para subir de nível
  const tasksInCurrentLevel = stats.completedTasks % tasksForNextLevel;
  const levelProgress = Math.min(100, Math.round((tasksInCurrentLevel / tasksForNextLevel) * 100));

  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9c6550]"></div>
      </div>
    );
  }

  // Dados para o gráfico de rosca (Tarefas por Status)
  const doughnutData = {
    labels: ['Planejado', 'Em Progresso', 'Concluído'],
    datasets: [
      {
        data: [stats.totalTasks - stats.completedTasks, stats.completedTasks, stats.completedTasks],
        backgroundColor: [
          'rgba(107, 114, 128, 0.6)',
          'rgba(14, 165, 233, 0.6)',
          'rgba(34, 197, 94, 0.6)',
        ],
        borderColor: [
          'rgba(107, 114, 128, 1)',
          'rgba(14, 165, 233, 1)',
          'rgba(34, 197, 94, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Dados para o gráfico de barras (Taxa de Conclusão)
  const barData = {
    labels: ['Taxa de Conclusão'],
    datasets: [
      {
        label: 'Concluído',
        data: [stats.completedTasks],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
      },
      {
        label: 'Em Progresso',
        data: [stats.totalTasks - stats.completedTasks],
        backgroundColor: 'rgba(14, 165, 233, 0.6)',
      },
    ],
  };

  const barOptions = {
    responsive: true,
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
      },
    },
  };

  return (
    <div className="py-4">
      <header className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#5b3a35]">Dashboard</h1>
        <p className="text-sm sm:text-base text-[#6c443c] mt-2">
          Bem-vindo de volta! Aqui está um resumo do seu progresso.
        </p>
      </header>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-8">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm sm:text-base font-medium text-[#5b3a35]">Tarefas Totais</h3>
            <FaTasks className="text-[#c19474] w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#5b3a35]">{stats.totalTasks}</p>
          <div className="mt-2">
            <div className="h-1.5 sm:h-2 bg-[#f2e8df] rounded-full">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
              />
            </div>
            <p className="text-xs sm:text-sm text-[#6c443c] mt-1">
              {stats.completedTasks} concluídas ({Math.round((stats.completedTasks / stats.totalTasks) * 100)}%)
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm sm:text-base font-medium text-[#5b3a35]">Tarefas Diárias</h3>
            <FaCalendarCheck className="text-[#c19474] w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#5b3a35]">{stats.completedDailyTasks}/{stats.dailyTasks}</p>
          <div className="mt-2">
            <div className="h-1.5 sm:h-2 bg-[#f2e8df] rounded-full">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${(stats.completedDailyTasks / stats.dailyTasks) * 100}%` }}
              />
            </div>
            <p className="text-xs sm:text-sm text-[#6c443c] mt-1">
              {dailyTaskCompletionRate}% concluídas
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm sm:text-base font-medium text-[#5b3a35]">Objetivos</h3>
            <FaFlag className="text-[#c19474] w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#5b3a35]">{stats.completedGoals}/{stats.totalGoals}</p>
          <div className="mt-2 w-full">
            <div className="h-1.5 sm:h-2 bg-[#f2e8df] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#9c6550] rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, goalCompletionRate)}%` }}
              />
            </div>
            <p className="text-xs sm:text-sm text-[#6c443c] mt-1">
              {Math.min(100, goalCompletionRate)}% concluídos
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm sm:text-base font-medium text-[#5b3a35]">Nível</h3>
            <FaUser className="text-[#c19474] w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#5b3a35]">{currentLevel}</p>
          <div className="mt-2 w-full">
            <div className="h-1.5 sm:h-2 bg-[#f2e8df] rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="text-xs sm:text-sm text-[#6c443c] mt-1">
              {levelProgress}% para o próximo nível ({tasksInCurrentLevel}/{tasksForNextLevel} tarefas)
            </p>
          </div>
          <div className="mt-2 text-right">
            <Link href="/performance" className="text-xs text-[#9c6550] hover:underline flex items-center justify-end">
              Ver detalhes <FaArrowRight className="ml-1 text-xs" />
            </Link>
          </div>
        </div>
      </div>

      {/* Seção Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        {/* Tarefas Recentes */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4">
            Tarefas Recentes
          </h2>
          <div className="space-y-3">
            {recentTasks.map((task) => {
              // Verificar se é uma tarefa diária concluída hoje
              const isDaily = task.isDaily;
              const completedToday = isDaily && task.lastCompletedAt ? 
                // Verificar se a data de conclusão é de hoje
                new Date(task.lastCompletedAt.toDate().setHours(0,0,0,0)).getTime() === 
                new Date(new Date().setHours(0,0,0,0)).getTime() : false;
              
              // Determinar o status de conclusão com base no tipo de tarefa
              const isCompleted = isDaily ? completedToday : task.completed;
              
              return (
                <div key={task.id} className="flex items-center p-3 bg-[#f7eee3] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-sm sm:text-base font-medium ${isCompleted ? 'text-[#4d944d]' : 'text-[#5b3a35]'}`}>
                        {task.title}
                      </h3>
                      {isDaily && (
                        <span className="text-xs px-1.5 py-0.5 bg-[#f0e2d3] rounded-full text-[#9c6550]">
                          Diária
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-[#6c443c]">
                      {isDaily && task.lastCompletedAt ? 
                        (completedToday ? 'Concluída hoje' : `Última conclusão: ${format(task.lastCompletedAt.toDate(), 'dd/MM/yyyy')}`) :
                        (task.dueDate ? format(task.dueDate.toDate(), 'dd/MM/yyyy') : 'Sem data')}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Objetivos em Progresso */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4">
            Objetivos em Progresso
          </h2>
          <div className="space-y-3">
            {recentGoals.map((goal) => (
              <div key={goal.id} className="p-3 bg-[#f7eee3] rounded-lg">
                <h3 className="text-sm sm:text-base font-medium text-[#5b3a35] mb-1">{goal.title}</h3>
                <div className="w-full h-1.5 sm:h-2 bg-[#e6d1bf] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#9c6550] rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress || 0}%` }}
                  />
                </div>
                <p className="text-xs sm:text-sm text-[#6c443c] mt-1">{goal.progress || 0}% concluído</p>
              </div>
            ))}
            {recentGoals.length === 0 && (
              <p className="text-center text-[#6c443c] py-2">
                Nenhum objetivo em andamento.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dicas e Motivação */}
      <div className="mt-4 sm:mt-8 bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
        <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4 flex items-center">
          <FaLightbulb className="text-[#c19474] w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Dica do Dia
        </h2>
        <p className="text-sm sm:text-base text-[#6c443c]">
          {randomQuote}
        </p>
      </div>
    </div>
  );
} 