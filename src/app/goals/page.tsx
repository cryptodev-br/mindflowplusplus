'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/utils/firebase';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { FaPlus, FaEdit, FaTrash, FaStar, FaCheck, FaTimes, FaFlag, FaTasks, FaCalendarAlt, FaLink } from 'react-icons/fa';
import Link from 'next/link';

type Goal = {
  id: string;
  title: string;
  description: string;
  userId: string;
  status: 'in_progress' | 'completed';
  createdAt: Date;
  tasksCount?: number;
  completedTasksCount?: number;
};

export default function GoalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState({ title: '', description: '' });
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: '', description: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      fetchGoals();
    }
  }, [user, loading, router]);

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
      let goalsData = goalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        tasksCount: 0,
        completedTasksCount: 0
      })) as Goal[];
      
      // Buscar tarefas para contar associações com objetivos
      const todosQuery = query(
        collection(db, 'todos'),
        where('userId', '==', user.uid)
      );
      
      const todosSnapshot = await getDocs(todosQuery);
      
      // Contar tarefas para cada objetivo
      todosSnapshot.forEach(doc => {
        const todoData = doc.data();
        if (todoData.goalId) {
          const goalIndex = goalsData.findIndex(g => g.id === todoData.goalId);
          if (goalIndex !== -1) {
            goalsData[goalIndex].tasksCount = (goalsData[goalIndex].tasksCount || 0) + 1;
            if (todoData.completed) {
              goalsData[goalIndex].completedTasksCount = (goalsData[goalIndex].completedTasksCount || 0) + 1;
            }
          }
        }
      });
      
      setGoals(goalsData);
      
    } catch (error) {
      console.error('Erro ao buscar objetivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title.trim() || !user) return;

    try {
      const goalData = {
        title: newGoal.title,
        description: newGoal.description,
        userId: user.uid,
        status: 'in_progress' as const,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'goals'), goalData);
      setNewGoal({ title: '', description: '' });
      setShowForm(false);
      fetchGoals();
    } catch (error) {
      console.error('Erro ao adicionar objetivo:', error);
    }
  };

  const startEditing = (goal: Goal) => {
    setEditingGoal(goal.id);
    setEditData({
      title: goal.title,
      description: goal.description
    });
  };

  const saveEdit = async () => {
    if (!editingGoal || !editData.title.trim()) return;

    try {
      const goalRef = doc(db, 'goals', editingGoal);
      await updateDoc(goalRef, {
        title: editData.title,
        description: editData.description
      });
      setEditingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Erro ao editar objetivo:', error);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const goalRef = doc(db, 'goals', id);
      const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
      await updateDoc(goalRef, { status: newStatus });
      fetchGoals();
    } catch (error) {
      console.error('Erro ao atualizar status do objetivo:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este objetivo? Isso não excluirá as tarefas vinculadas a ele.')) return;
    
    try {
      await deleteDoc(doc(db, 'goals', id));
      fetchGoals();
    } catch (error) {
      console.error('Erro ao excluir objetivo:', error);
    }
  };

  const filteredGoals = () => {
    switch (viewMode) {
      case 'active':
        return goals.filter(g => g.status !== 'completed');
      case 'completed':
        return goals.filter(g => g.status === 'completed');
      default:
        return goals;
    }
  };

  const GoalCard = ({ goal }: { goal: Goal }) => (
    <motion.div
      key={goal.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="goal-box"
    >
      {editingGoal === goal.id ? (
        <div className="space-y-4">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="form-input font-medium"
            placeholder="Título do objetivo"
            autoFocus
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="form-input w-full h-24"
            placeholder="Descrição (opcional)"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={saveEdit}
              className="btn btn-success flex items-center"
            >
              <FaCheck className="mr-1" /> Salvar
            </button>
            <button
              onClick={() => setEditingGoal(null)}
              className="btn btn-outline flex items-center"
            >
              <FaTimes className="mr-1" /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="goal-box-header">
            <h3 className="goal-title">{goal.title}</h3>
            {goal.status === 'completed' && (
              <FaStar className="text-[#c19474]" />
            )}
          </div>
          
          {goal.description && (
            <p className="text-[#6c443c] text-sm mb-4">{goal.description}</p>
          )}
          
          <div className="flex items-center justify-between text-sm mt-4 border-t border-[#e6d1bf] pt-4">
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-[#6c443c]">
                <FaTasks className="mr-1 text-[#9c6550]" /> {goal.tasksCount ?? 0}
              </span>
              <span className="flex items-center text-[#6c443c]">
                <FaCalendarAlt className="mr-1 text-[#9c6550]" /> 
                {goal.createdAt.toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex space-x-2">
              <Link href={`/tasks?goal=${goal.id}`} className="text-[#4d944d] hover:text-[#3d783d] p-1.5 rounded-full hover:bg-[#f2e8df] transition-colors">
                <FaLink />
              </Link>
              <button 
                onClick={() => toggleStatus(goal.id, goal.status)} 
                className={`${
                  goal.status === 'completed' 
                    ? 'text-[#c19474] hover:text-[#9c6550]' 
                    : 'text-[#4d944d] hover:text-[#3d783d]'
                } p-1.5 rounded-full hover:bg-[#f2e8df] transition-colors`}
                title={goal.status === 'completed' ? 'Marcar como em progresso' : 'Marcar como concluído'}
              >
                <FaCheck />
              </button>
              <button 
                onClick={() => startEditing(goal)} 
                className="text-[#9c6550] hover:text-[#6c443c] p-1.5 rounded-full hover:bg-[#f2e8df] transition-colors"
              >
                <FaEdit />
              </button>
              <button 
                onClick={() => deleteGoal(goal.id)} 
                className="text-[#b17b5d] hover:text-[#5b3a35] p-1.5 rounded-full hover:bg-[#f2e8df] transition-colors"
              >
                <FaTrash />
              </button>
            </div>
          </div>
          
          {(goal.tasksCount ?? 0) > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center text-xs text-[#6c443c]">
                <span>Progresso:</span>
                <span>{goal.completedTasksCount ?? 0}/{goal.tasksCount ?? 0} tarefas ({Math.round(((goal.completedTasksCount ?? 0) / (goal.tasksCount ?? 1)) * 100)}%)</span>
              </div>
              <div className="progress-bar h-2 mt-1">
                <div 
                  className="progress-value"
                  style={{ width: `${(goal.tasksCount ?? 0) > 0 ? ((goal.completedTasksCount ?? 0) / (goal.tasksCount ?? 1)) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );

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
    <div className="max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5b3a35] mb-2">Objetivos</h1>
        <p className="text-[#6c443c]">
          Defina objetivos claros e acompanhe seu progresso vinculando tarefas a eles.
        </p>
      </div>

      {/* Botão de adicionar e filtros */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center justify-center"
        >
          <FaPlus className="mr-2" /> Novo Objetivo
        </button>

        <div className="bg-white rounded-full shadow-sm border border-[#d4b397] p-1 flex">
          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 py-1.5 px-3 rounded-full flex items-center justify-center transition-colors ${
              viewMode === 'all' 
                ? 'bg-[#e6d1bf] text-[#5b3a35] font-medium' 
                : 'text-[#6c443c] hover:bg-[#f2e8df]'
            }`}
          >
            <FaFlag className="mr-2" /> Todos
          </button>
          <button
            onClick={() => setViewMode('active')}
            className={`flex-1 py-1.5 px-3 rounded-full flex items-center justify-center transition-colors ${
              viewMode === 'active' 
                ? 'bg-[#e6d1bf] text-[#5b3a35] font-medium' 
                : 'text-[#6c443c] hover:bg-[#f2e8df]'
            }`}
          >
            <FaTasks className="mr-2" /> Em Progresso
          </button>
          <button
            onClick={() => setViewMode('completed')}
            className={`flex-1 py-1.5 px-3 rounded-full flex items-center justify-center transition-colors ${
              viewMode === 'completed' 
                ? 'bg-[#e6d1bf] text-[#5b3a35] font-medium' 
                : 'text-[#6c443c] hover:bg-[#f2e8df]'
            }`}
          >
            <FaStar className="mr-2" /> Concluídos
          </button>
        </div>
      </div>

      {/* Formulário para novo objetivo */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="section-container mb-8 overflow-hidden"
          >
            <h2 className="text-xl font-semibold text-[#5b3a35] mb-4">Novo Objetivo</h2>
            <form onSubmit={addGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#6c443c] mb-1">Título</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="O que você deseja alcançar?"
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#6c443c] mb-1">Descrição (opcional)</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  placeholder="Descreva seu objetivo com mais detalhes..."
                  className="form-input h-24"
                />
              </div>
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  <FaPlus className="mr-2" /> Adicionar Objetivo
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Objetivos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredGoals().map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </AnimatePresence>
      </div>

      {/* Mensagem se não houver objetivos */}
      {filteredGoals().length === 0 && (
        <div className="bg-[#f2e8df] rounded-lg p-8 text-center">
          <p className="text-[#6c443c] mb-4">
            {viewMode === 'all' 
              ? 'Você ainda não possui objetivos.' 
              : viewMode === 'active'
                ? 'Não há objetivos em progresso.'
                : 'Não há objetivos concluídos.'}
          </p>
          <button 
            onClick={() => setShowForm(true)} 
            className="btn btn-primary"
          >
            <FaPlus className="mr-2" /> Criar Objetivo
          </button>
        </div>
      )}
    </div>
  );
} 