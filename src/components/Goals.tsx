'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/utils/firebase';
import { collection, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaStar, FaArrowRight, FaArrowLeft, FaPlus, FaFlag, FaChartLine } from 'react-icons/fa';
import type { Goal as GoalType } from '@/types';

interface GoalWithId extends GoalType {
  id: string;
}

interface GoalsProps {
  onGoalSelect?: (goalId: string) => void;
  selectedGoalId?: string;
  showControls?: boolean;
}

export default function Goals({ onGoalSelect, selectedGoalId, showControls = true }: GoalsProps) {
  const [goals, setGoals] = useState<GoalWithId[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchGoals();
    }
  }, [user]);

  // Atualizar o índice ativo quando o selectedGoalId mudar
  useEffect(() => {
    if (selectedGoalId && goals.length > 0) {
      const index = goals.findIndex(goal => goal.id === selectedGoalId);
      if (index !== -1) {
        setActiveIndex(index);
      }
    }
  }, [selectedGoalId, goals]);

  const fetchGoals = async () => {
    if (!user) return;
    
    const goalsQuery = query(
      collection(db, 'goals'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    try {
      const snapshot = await getDocs(goalsQuery);
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GoalWithId[];
      setGoals(goalsData);
      setLoading(false);
      
      // Se temos objetivos e um callback de seleção, selecionar o primeiro objetivo
      if (goalsData.length > 0 && onGoalSelect && !selectedGoalId) {
        onGoalSelect(goalsData[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar objetivos:', error);
      setLoading(false);
    }
  };

  const addGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim() || !user) return;

    try {
      const goalData = {
        title: newGoal,
        description: '',
        completed: false,
        progress: 0,
        userId: user.uid,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'goals'), goalData);
      setNewGoal('');
      setShowForm(false);
      fetchGoals();
    } catch (error) {
      console.error('Erro ao adicionar objetivo:', error);
    }
  };

  const toggleGoal = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    try {
      const goalRef = doc(db, 'goals', id);
      await updateDoc(goalRef, {
        completed: !goal.completed
      });
      fetchGoals();
    } catch (error) {
      console.error('Erro ao atualizar objetivo:', error);
    }
  };

  const startEditing = (goal: GoalWithId) => {
    setEditingGoal(goal.id);
    setEditText(goal.title);
  };

  const saveEdit = async () => {
    if (!editingGoal || !editText.trim()) return;

    try {
      const goalRef = doc(db, 'goals', editingGoal);
      await updateDoc(goalRef, {
        title: editText
      });
      setEditingGoal(null);
      fetchGoals();
    } catch (error) {
      console.error('Erro ao editar objetivo:', error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'goals', id));
      fetchGoals();
    } catch (error) {
      console.error('Erro ao deletar objetivo:', error);
    }
  };

  const selectGoal = (id: string) => {
    if (onGoalSelect) {
      onGoalSelect(id);
    }
  };

  const nextGoal = () => {
    if (goals.length === 0) return;
    const newIndex = (activeIndex + 1) % goals.length;
    setActiveIndex(newIndex);
    if (onGoalSelect) {
      onGoalSelect(goals[newIndex].id);
    }
  };

  const prevGoal = () => {
    if (goals.length === 0) return;
    const newIndex = (activeIndex - 1 + goals.length) % goals.length;
    setActiveIndex(newIndex);
    if (onGoalSelect) {
      onGoalSelect(goals[newIndex].id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6550]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Botão de adicionar objetivo */}
      <div className="section-container">
        {showForm ? (
          <>
            <h2 className="text-xl font-semibold text-[#5b3a35] mb-4">Novo Objetivo</h2>
            <form onSubmit={addGoal} className="space-y-4">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Digite seu objetivo..."
                className="input"
                autoFocus
              />
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Adicionar Objetivo
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
          </>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            <FaPlus className="mr-2" /> Adicionar Novo Objetivo
          </button>
        )}
      </div>

      {/* Lista de Objetivos */}
      <div className="section-container">
        <div className="section-header">
          <div className="section-title">
            <FaFlag className="section-title-icon" />
            <h2 className="section-title-text">Meus Objetivos</h2>
          </div>
          <div>
            <span className="text-[#4d944d] font-bold">{goals.filter(g => g.completed).length}/{goals.length}</span>
          </div>
        </div>

        {goals.length > 0 ? (
          <>
            {/* Navegação entre objetivos */}
            {showControls && goals.length > 1 && (
              <div className="flex justify-between items-center mb-4">
                <button 
                  onClick={prevGoal}
                  className="btn btn-icon"
                  aria-label="Objetivo anterior"
                >
                  <FaArrowLeft />
                </button>
                <span className="text-sm text-[#666666]">
                  {activeIndex + 1} de {goals.length}
                </span>
                <button 
                  onClick={nextGoal}
                  className="btn btn-icon"
                  aria-label="Próximo objetivo"
                >
                  <FaArrowRight />
                </button>
              </div>
            )}

            {/* Lista de todos os objetivos */}
            <AnimatePresence>
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`card-hover p-4 mb-2 rounded-lg border transition-all ${goal.id === selectedGoalId ? 'bg-[#f2e8df] border-[#b17b5d]' : 'bg-white border-[#e6d1bf]'}`}
                  onClick={() => selectGoal(goal.id)}
                >
                  {editingGoal === goal.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="input flex-1 px-2 py-1"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); saveEdit(); }}
                        className="text-[#4d944d] hover:text-[#3d783d] p-2"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingGoal(null); }}
                        className="text-[#6c443c] hover:text-[#5b3a35] p-2"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={goal.completed}
                            onChange={(e) => { e.stopPropagation(); toggleGoal(goal.id); }}
                            className="checkbox w-5 h-5 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {goal.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1"
                            >
                              <FaStar className="text-[#c19474] text-xs" />
                            </motion.div>
                          )}
                        </div>
                        <span className={`${goal.completed ? 'task-title-completed' : 'task-title-pending'} task-title`}>
                          {goal.title}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditing(goal); }}
                          className="text-[#b17b5d] hover:text-[#9c6550] p-1 rounded-full hover:bg-[#f2e8df]"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                          className="text-[#6c443c] hover:text-[#5b3a35] p-1 rounded-full hover:bg-[#f2e8df]"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        ) : (
          <div className="bg-[#f2e8df] rounded-lg p-8 text-center">
            <p className="text-[#6c443c] mb-4">Nenhum objetivo encontrado. Adicione seu primeiro objetivo!</p>
            <button 
              onClick={() => setShowForm(true)} 
              className="btn btn-primary"
            >
              <FaPlus className="mr-2" /> Adicionar Objetivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 