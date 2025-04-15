'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  getDoc, 
  onSnapshot, 
  setDoc, 
  updateDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { FaCalendarCheck, FaFlag, FaStar, FaListUl, FaChartLine, FaAward, FaTrophy, FaCrown, FaUserAstronaut, FaLightbulb } from 'react-icons/fa';
import type { UserProgress as UserProgressType } from '@/types';

// Registrar componentes do Chart.js
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement,
  LineElement,
  Title
);

const LEVEL_THRESHOLD = 100; // Pontos necessários para subir de nível
const AVATAR_EVOLUTION_LEVELS = [
  { level: 1, name: 'Semente', description: 'Você está começando sua jornada de produtividade' },
  { level: 2, name: 'Broto', description: 'Continue completando tarefas para crescer mais' },
  { level: 3, name: 'Árvore Jovem', description: 'Você está desenvolvendo bons hábitos' },
  { level: 4, name: 'Árvore Florescente', description: 'Suas conquistas começam a dar frutos' },
  { level: 5, name: 'Árvore Frutífera', description: 'Sua produtividade está em um excelente nível' },
  { level: 6, name: 'Árvore Majestosa', description: 'Você se tornou um mestre em gerenciar suas tarefas' },
  { level: 7, name: 'Árvore Ancestral', description: 'Sua dedicação é inspiradora' }
];

// Simulação de dados históricos (em uma implementação real, isso viria do banco de dados)
const generateHistoricalData = (totalDays = 14) => {
  const today = new Date();
  const data = [];
  
  for (let i = 0; i < totalDays; i++) {
    const date = new Date();
    date.setDate(today.getDate() - (totalDays - 1 - i));
    data.push({
      date: date.toISOString().split('T')[0],
      tasksCompleted: Math.floor(Math.random() * 8) + 1, // 1-8 tarefas completadas
    });
  }
  
  return data;
};

export default function PerformancePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalGoals: 0,
    completedGoals: 0,
    dailyTasks: 0,
    completedDailyTasks: 0
  });
  const [progress, setProgress] = useState<UserProgressType | null>(null);
  const [historicalData] = useState(generateHistoricalData());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      // Primeiro buscar o progresso do usuário, depois as estatísticas
      fetchUserProgress().then(() => {
        fetchStats();
      });
    }
  }, [user]);

  const fetchUserProgress = async () => {
    if (!user) return;

    // Buscar dados do progresso atual
    try {
      const progressDoc = await getDoc(doc(db, 'userProgress', user.uid));
      
      if (progressDoc.exists()) {
        const data = progressDoc.data() as UserProgressType;
        // Resolver problema de timestamp
        const lastLoginDate = data.lastLoginDate instanceof Timestamp 
          ? data.lastLoginDate.toDate() 
          : data.lastLoginDate;
        
        setProgress({
          ...data,
          lastLoginDate
        });
      } else {
        // Se não existir progresso, criar um novo
        const initialProgress = {
          userId: user.uid,
          level: 1,
          experience: 0,
          avatarLevel: 1,
          avatarType: 'tree',
          lastLoginDate: new Date(),
          streak: 0,
          // Adicionando campos obrigatórios faltantes
          id: user.uid,
          dailyStreak: 0,
          achievements: []
        };
        // @ts-ignore - Type mismatch in initial progress
        setProgress(initialProgress);
        // Salvar no Firestore
        await setDoc(doc(db, 'userProgress', user.uid), initialProgress);
      }
    } catch (error) {
      console.error('Erro ao buscar progresso:', error);
    } finally {
      setIsLoading(false);
    }

    // Configurar listener para mudanças em tempo real
    const unsubscribe = onSnapshot(
      doc(db, 'userProgress', user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as UserProgressType;
          // Resolver problema de timestamp
          const lastLoginDate = data.lastLoginDate instanceof Timestamp 
            ? data.lastLoginDate.toDate() 
            : data.lastLoginDate;
          
          setProgress({
            ...data,
            lastLoginDate
          });
        }
      }
    );

    return unsubscribe;
  };

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
        if (data.status === 'completed') {
          completedGoals++;
        }
      });
      
      setStats({
        totalTasks,
        completedTasks,
        totalGoals,
        completedGoals,
        dailyTasks,
        completedDailyTasks
      });

      // Atualizar experiência e nível - SEMPRE que as estatísticas forem buscadas
      await updateProgressFromStats(completedTasks);
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Nova função separada para atualizar progresso com base nas tarefas completadas
  const updateProgressFromStats = async (completedTasks: number) => {
    if (!user) return;
    
    try {
      // Buscar progresso atual diretamente do Firestore para garantir dados atualizados
      const userProgressRef = doc(db, 'userProgress', user.uid);
      const progressSnapshot = await getDoc(userProgressRef);
      
      if (progressSnapshot.exists()) {
        const currentProgress = progressSnapshot.data() as UserProgressType;
        
        // Calcular novas métricas
        const newExperience = completedTasks * 10; // 10 XP por tarefa completada
        const newLevel = Math.floor(newExperience / LEVEL_THRESHOLD) + 1;
        const newAvatarLevel = Math.min(Math.floor(newLevel / 2) + 1, AVATAR_EVOLUTION_LEVELS.length);
        
        // Verificar se há alterações
        if (newLevel !== currentProgress.level || 
            newExperience !== currentProgress.experience || 
            newAvatarLevel !== currentProgress.avatarLevel) {
          
          console.log('Atualizando progresso:', { 
            level: newLevel, 
            experience: newExperience, 
            avatarLevel: newAvatarLevel 
          });
          
          // Atualizar no Firestore
          await updateDoc(userProgressRef, {
            level: newLevel,
            experience: newExperience,
            avatarLevel: newAvatarLevel
          });
          
          // O listener onSnapshot irá atualizar a UI
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
    }
  };

  const getAvatarImage = () => {
    if (!progress) return null;

    // Definir características do avatar baseado no nível
    const treeHeight = 24 + (progress.avatarLevel * 4); // Crescimento do tronco
    const treeWidth = 6 + Math.min(progress.avatarLevel, 3); // Engrossamento do tronco
    const leafSize = 40 + (progress.avatarLevel * 5); // Crescimento da copa
    const fruitCount = progress.avatarLevel > 3 ? progress.avatarLevel : 0; // Frutos aparecem a partir do nível 4

    if (progress.avatarType === 'tree') {
      return (
        <div className="relative w-48 h-48 mx-auto">
          {/* Tronco da árvore - cresce com o nível */}
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-[#8B4513] rounded-sm transition-all duration-700"
            style={{ 
              width: `${treeWidth}px`, 
              height: `${treeHeight}px` 
            }}
          ></div>
          
          {/* Raízes visíveis em níveis mais altos */}
          {progress.avatarLevel >= 5 && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={`root-${i}`}
                  className="absolute bg-[#8B4513] rounded-sm"
                  style={{
                    width: '4px',
                    height: '8px',
                    transform: `rotate(${(i * 60) - 60}deg) translate(${5 + i}px, ${i+2}px)`,
                    bottom: '0px',
                  }}
                ></div>
              ))}
            </div>
          )}
          
          {/* Copa da árvore - aumenta com o nível */}
          <div 
            className={`absolute left-1/2 transform -translate-x-1/2 rounded-full transition-all duration-700 ${
              progress.avatarLevel <= 2 ? 'bg-green-300' :
              progress.avatarLevel <= 4 ? 'bg-green-400' :
              progress.avatarLevel <= 6 ? 'bg-green-500' :
              'bg-green-600'
            }`}
            style={{
              width: `${leafSize}px`,
              height: `${leafSize}px`,
              bottom: `${treeHeight}px`,
            }}
          ></div>
          
          {/* Flores ou frutos baseados no nível */}
          {fruitCount > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(Math.min(fruitCount * 2, 12))].map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-500 ${
                    progress.avatarLevel >= 6 ? 'bg-yellow-400' : 'bg-pink-400'
                  }`}
                  style={{
                    width: `${4 + Math.min(progress.avatarLevel - 3, 3)}px`,
                    height: `${4 + Math.min(progress.avatarLevel - 3, 3)}px`,
                    transform: `rotate(${i * (360/Math.min(fruitCount * 2, 12))}deg) translate(${leafSize/2 - 5}px)`,
                    opacity: 0.8 + (i % 3) * 0.1,
                  }}
                ></div>
              ))}
            </div>
          )}
          
          {/* Brilho ou aura em níveis mais altos */}
          {progress.avatarLevel >= 7 && (
            <div 
              className="absolute rounded-full bg-yellow-100 opacity-20 transition-all duration-700"
              style={{
                width: `${leafSize + 20}px`,
                height: `${leafSize + 20}px`,
                bottom: `${treeHeight - 10}px`,
                left: '50%',
                transform: 'translateX(-50%)',
              }}
            ></div>
          )}
        </div>
      );
    }

    return null;
  };

  const getCurrentAvatarLevel = () => {
    if (!progress) return AVATAR_EVOLUTION_LEVELS[0];
    
    const actualLevel = Math.min(progress.avatarLevel, AVATAR_EVOLUTION_LEVELS.length);
    return AVATAR_EVOLUTION_LEVELS[actualLevel - 1];
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

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#d4b397] border-t-[#9c6550]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6c443c]">Você precisa estar logado para ver esta página.</p>
      </div>
    );
  }

  const avatarLevel = getCurrentAvatarLevel();
  // @ts-ignore - experience calculation, TypeScript verificação desnecessária
  const experiencePercentage = progress ? Math.min(100, (progress.experience % LEVEL_THRESHOLD) / LEVEL_THRESHOLD * 100) : 0;
  const currentLevel = progress?.level || 1;
  // @ts-ignore - experience calculation, TypeScript verificação desnecessária
  const experienceToNextLevel = LEVEL_THRESHOLD - (progress?.experience % LEVEL_THRESHOLD || 0);

  // Dados para os gráficos
  const doughnutData = {
    labels: ['Completas', 'Pendentes'],
    datasets: [
      {
        data: [stats.completedTasks, stats.totalTasks - stats.completedTasks],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(107, 114, 128, 0.6)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const progressByType = {
    labels: ['Tarefas Diárias', 'Tarefas de Objetivos', 'Todas as Tarefas'],
    datasets: [
      {
        label: 'Taxa de Conclusão (%)',
        data: [dailyTaskCompletionRate, goalCompletionRate, taskCompletionRate],
        backgroundColor: [
          'rgba(110, 180, 110, 0.6)',
          'rgba(156, 101, 80, 0.6)',
          'rgba(193, 148, 116, 0.6)',
        ],
        borderColor: [
          'rgba(110, 180, 110, 1)',
          'rgba(156, 101, 80, 1)',
          'rgba(193, 148, 116, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const activityTrendData = {
    labels: historicalData.map(item => item.date.substring(5)),
    datasets: [
      {
        label: 'Tarefas Concluídas',
        data: historicalData.map(item => item.tasksCompleted),
        borderColor: 'rgba(156, 101, 80, 1)',
        backgroundColor: 'rgba(156, 101, 80, 0.5)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="py-4">
      <header className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#5b3a35]">Seu Desempenho</h1>
        <p className="text-sm sm:text-base text-[#6c443c] mt-2">
          Acompanhe seu progresso e evolução enquanto você completa tarefas e alcança seus objetivos.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-12">
        {/* Seção do Avatar */}
        <div className="col-span-1 bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4 text-center">
            Seu Avatar de Progresso
          </h2>
          
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-6"
          >
            {getAvatarImage()}
          </motion.div>

          <div className="text-center mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-[#6c443c]">{avatarLevel.name}</h3>
            <p className="text-xs sm:text-sm text-[#6c443c] mt-1">{avatarLevel.description}</p>
            <p className="text-sm sm:text-base text-[#6c443c] font-medium mt-2">Nível {currentLevel}</p>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3 mb-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${experiencePercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-[#9c6550] h-2 sm:h-3 rounded-full"
            ></motion.div>
          </div>
          <p className="text-xs sm:text-sm text-[#6c443c] text-center">
            {experienceToNextLevel} XP para o próximo nível
          </p>
        </div>

        {/* Estatísticas de Progresso */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4">
            Estatísticas de Progresso
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaListUl className="text-[#9c6550] w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <h3 className="text-[#5b3a35] text-sm sm:text-base font-medium">Tarefas</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#5b3a35]">{stats.completedTasks}/{stats.totalTasks}</p>
              <p className="text-xs sm:text-sm text-[#6c443c]">
                <span className="font-medium">{taskCompletionRate}%</span> de conclusão
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-2">
                <div 
                  className="bg-[#9c6550] h-1.5 sm:h-2 rounded-full"
                  style={{ width: `${taskCompletionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaCalendarCheck className="text-[#6eb46e] w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <h3 className="text-[#5b3a35] text-sm sm:text-base font-medium">Tarefas Diárias</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#5b3a35]">{stats.completedDailyTasks}/{stats.dailyTasks}</p>
              <p className="text-xs sm:text-sm text-[#6c443c]">
                <span className="font-medium">{dailyTaskCompletionRate}%</span> de conclusão
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-2">
                <div 
                  className="bg-[#6eb46e] h-1.5 sm:h-2 rounded-full"
                  style={{ width: `${dailyTaskCompletionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaFlag className="text-[#b17b5d] w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <h3 className="text-[#5b3a35] text-sm sm:text-base font-medium">Objetivos</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#5b3a35]">{stats.completedGoals}/{stats.totalGoals}</p>
              <p className="text-xs sm:text-sm text-[#6c443c]">
                <span className="font-medium">{goalCompletionRate}%</span> de conclusão
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-2">
                <div 
                  className="bg-[#b17b5d] h-1.5 sm:h-2 rounded-full"
                  style={{ width: `${goalCompletionRate}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FaTrophy className="text-[#c19474] w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <h3 className="text-[#5b3a35] text-sm sm:text-base font-medium">Conquistas</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#5b3a35]">{progress?.achievements?.length || 0}</p>
              <p className="text-xs sm:text-sm text-[#6c443c]">desbloqueadas</p>
              
              {progress?.achievements && progress.achievements.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-2">
                  {progress.achievements.slice(0, 3).map((achievement, index) => (
                    <span key={index} className="text-xs bg-white text-[#6c443c] px-2 py-1 rounded-full">
                      {achievement}
                    </span>
                  ))}
                  {progress.achievements.length > 3 && (
                    <span className="text-xs bg-white text-[#6c443c] px-2 py-1 rounded-full">
                      +{progress.achievements.length - 3} mais
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#6c443c] mt-2 italic">
                  Complete mais tarefas para desbloquear conquistas!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Desempenho */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-4 sm:mb-8">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4">
            Distribuição de Tarefas
          </h2>
          <div className="h-48 sm:h-64">
            <Doughnut 
              data={doughnutData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4">
            Progresso por Categoria
          </h2>
          <div className="h-48 sm:h-64">
            <Bar 
              data={progressByType} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    max: 100,
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return value + '%';
                      },
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  },
                  x: {
                    ticks: {
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Tendência de Atividade */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397] mb-4 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4">
          Atividade nas Últimas 2 Semanas
        </h2>
        <div className="h-48 sm:h-64">
          <Line 
            data={activityTrendData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: {
                      size: window.innerWidth < 640 ? 10 : 12
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Tarefas Concluídas',
                    font: {
                      size: window.innerWidth < 640 ? 10 : 12
                    }
                  },
                  ticks: {
                    font: {
                      size: window.innerWidth < 640 ? 10 : 12
                    }
                  }
                },
                x: {
                  ticks: {
                    font: {
                      size: window.innerWidth < 640 ? 10 : 12
                    }
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Dicas e Próximos Passos */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
        <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4 flex items-center">
          <FaLightbulb className="text-[#c19474] w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Dicas para Melhorar seu Desempenho
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
            <h3 className="font-medium text-[#5b3a35] text-sm sm:text-base mb-2">Consistência é a chave</h3>
            <p className="text-xs sm:text-sm text-[#6c443c]">
              Complete suas tarefas diárias regularmente para manter o progresso constante e evoluir seu avatar mais rapidamente.
            </p>
          </div>
          
          <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
            <h3 className="font-medium text-[#5b3a35] text-sm sm:text-base mb-2">Equilibre seus objetivos</h3>
            <p className="text-xs sm:text-sm text-[#6c443c]">
              Trabalhe em diferentes tipos de objetivos para ter um desenvolvimento mais equilibrado e maior motivação.
            </p>
          </div>
          
          <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
            <h3 className="font-medium text-[#5b3a35] text-sm sm:text-base mb-2">Comemore conquistas</h3>
            <p className="text-xs sm:text-sm text-[#6c443c]">
              Reconheça suas conquistas, mesmo as pequenas. Cada tarefa completada é um passo em direção ao seu progresso.
            </p>
          </div>
          
          <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
            <h3 className="font-medium text-[#5b3a35] text-sm sm:text-base mb-2">Revise regularmente</h3>
            <p className="text-xs sm:text-sm text-[#6c443c]">
              Visite esta página de desempenho semanalmente para acompanhar seu progresso e identificar áreas para melhorar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 