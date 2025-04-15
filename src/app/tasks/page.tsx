'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TodoList from '@/components/TodoList';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { FaTasks, FaClock, FaLeaf, FaChevronLeft, FaChevronRight, FaLightbulb } from 'react-icons/fa';
import type { Goal } from '@/types';

export default function TasksPage() {
  const { user, loading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  const [activeView, setActiveView] = useState<'daily' | 'goals' | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Buscar objetivos
      const goalsQuery = query(
        collection(db, 'goals'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const goalsSnapshot = await getDocs(goalsQuery);
      const goalsData = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Goal[];
      
      setGoals(goalsData);
      
    } catch (error) {
      console.error('Erro ao buscar objetivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextGoal = () => {
    if (!goals.length) return;
    setCurrentGoalIndex((prev) => 
      prev === goals.length - 1 ? 0 : prev + 1
    );
  };

  const prevGoal = () => {
    if (!goals.length) return;
    setCurrentGoalIndex((prev) => 
      prev === 0 ? goals.length - 1 : prev - 1
    );
  };

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

  return (
    <div className="py-4 px-3 sm:px-4 md:px-6 max-w-[1400px] mx-auto">
      <header className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#5b3a35]">Tarefas e Objetivos</h1>
        <p className="text-sm sm:text-base text-[#6c443c] mt-2">
          Gerencie suas tarefas diárias e acompanhe seu progresso em direção aos seus objetivos.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Lista de Tarefas */}
        <div className="md:col-span-1 lg:col-span-2 bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4">
            Suas Tarefas
          </h2>
          <TodoList />
        </div>

        {/* Objetivos */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4 flex items-center justify-between">
            <span>Seus Objetivos</span>
            {goals.length > 1 && (
              <div className="flex space-x-2">
                <button 
                  onClick={prevGoal} 
                  className="p-1.5 bg-[#f7eee3] text-[#5b3a35] rounded-full hover:bg-[#e6d1bf] transition-colors"
                  aria-label="Objetivo anterior"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                <button 
                  onClick={nextGoal} 
                  className="p-1.5 bg-[#f7eee3] text-[#5b3a35] rounded-full hover:bg-[#e6d1bf] transition-colors"
                  aria-label="Próximo objetivo"
                >
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </h2>
          <div className="space-y-3">
            {goals.length > 0 ? (
              <div key={goals[currentGoalIndex].id} className="p-3 bg-[#f7eee3] rounded-lg">
                <h3 className="text-sm sm:text-base font-medium text-[#5b3a35] mb-1">
                  {goals[currentGoalIndex].title}
                </h3>
                <div className="h-1.5 sm:h-2 bg-[#e6d1bf] rounded-full">
                  <div 
                    className="h-full bg-[#9c6550] rounded-full"
                    style={{ width: `${goals[currentGoalIndex].progress || 0}%` }}
                  />
                </div>
                <p className="text-xs sm:text-sm text-[#6c443c] mt-1">
                  {goals[currentGoalIndex].progress || 0}% concluído
                </p>
              </div>
            ) : (
              <p className="text-sm text-[#6c443c] text-center py-4">
                Você ainda não tem objetivos cadastrados.
              </p>
            )}
            
            <div className="mt-4 bg-[#f7eee3] p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-[#6c443c] mb-2">Todos seus objetivos</p>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {goals.map((goal, index) => (
                  <button
                    key={goal.id}
                    onClick={() => setCurrentGoalIndex(index)}
                    className={`w-full text-left p-2 rounded text-xs sm:text-sm truncate ${
                      currentGoalIndex === index 
                        ? 'bg-[#d4b397] text-[#5b3a35] font-medium' 
                        : 'hover:bg-[#e6d1bf] text-[#6c443c]'
                    }`}
                  >
                    {goal.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dicas e Motivação */}
      <div className="mt-4 sm:mt-8 bg-white rounded-xl shadow-md p-4 sm:p-6 border border-[#d4b397]">
        <h2 className="text-lg sm:text-xl font-semibold text-[#5b3a35] mb-4 flex items-center">
          <FaLightbulb className="text-[#c19474] w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Dicas para Produtividade
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
            <h3 className="font-medium text-[#5b3a35] text-sm sm:text-base mb-2">Priorize suas tarefas</h3>
            <p className="text-xs sm:text-sm text-[#6c443c]">
              Comece pelas tarefas mais importantes ou urgentes para maximizar sua produtividade.
            </p>
          </div>
          
          <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
            <h3 className="font-medium text-[#5b3a35] text-sm sm:text-base mb-2">Divida grandes objetivos</h3>
            <p className="text-xs sm:text-sm text-[#6c443c]">
              Quebre objetivos maiores em tarefas menores e mais gerenciáveis.
            </p>
          </div>
          
          <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
            <h3 className="font-medium text-[#5b3a35] text-sm sm:text-base mb-2">Mantenha o foco</h3>
            <p className="text-xs sm:text-sm text-[#6c443c]">
              Concentre-se em uma tarefa por vez para aumentar sua eficiência e qualidade.
            </p>
          </div>
          
          <div className="bg-[#f7eee3] p-3 sm:p-4 rounded-lg">
            <h3 className="font-medium text-[#5b3a35] text-sm sm:text-base mb-2">Celebre o progresso</h3>
            <p className="text-xs sm:text-sm text-[#6c443c]">
              Reconheça suas conquistas diárias, mesmo as pequenas vitórias são importantes.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 md:hidden z-10">
        <button 
          className="bg-[#9c6550] text-white p-4 rounded-full shadow-lg hover:bg-[#5b3a35] transition-colors"
          aria-label="Adicionar tarefa"
        >
          <FaTasks className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 