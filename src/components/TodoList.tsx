'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/utils/firebase';
import { collection, query, where, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaLink, FaClock, FaLeaf, FaRegStar, FaStar, FaPlus, FaFilter, FaCheckCircle, FaTasks } from 'react-icons/fa';
import type { Todo as TodoType, Goal } from '@/types';

interface TodoDisplay extends Omit<TodoType, 'createdAt' | 'lastCompletedAt'> {
  createdAt: Date;
  lastCompletedAt?: Date;
}

interface TodoListProps {
  viewMode?: 'all' | 'daily' | 'goals';
  currentGoalId?: string;
  limit?: number;
}

export default function TodoList({ viewMode = 'all', currentGoalId, limit }: TodoListProps) {
  // Garantir que o TypeScript entenda o tipo correto
  const viewModeValue: 'all' | 'daily' | 'goals' = viewMode;
  
  const [todos, setTodos] = useState<TodoDisplay[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [editingTodo, setEditingTodo] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [isDaily, setIsDaily] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [filterGoal, setFilterGoal] = useState<string>('');
  const [filterCompleted, setFilterCompleted] = useState<'all' | 'completed' | 'pending'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dueDate, setDueDate] = useState<string>('');
  const { user } = useAuth();

  // Efeito para atualizar o objetivo selecionado quando o currentGoalId muda
  useEffect(() => {
    if (currentGoalId) {
      setSelectedGoal(currentGoalId);
      setFilterGoal(currentGoalId);
    }
  }, [currentGoalId]);

  useEffect(() => {
    if (user) {
      fetchTodos();
      fetchGoals();
    }
  }, [user]);

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
      })) as Goal[];
      setGoals(goalsData);
    } catch (error) {
      console.error('Erro ao buscar objetivos:', error);
    }
  };

  // Função para verificar se uma tarefa diária foi concluída hoje
  const isCompletedToday = (lastCompletedAt: Date | undefined): boolean => {
    if (!lastCompletedAt) return false;
    
    const today = new Date();
    const lastCompleted = new Date(lastCompletedAt);
    
    return (
      today.getDate() === lastCompleted.getDate() &&
      today.getMonth() === lastCompleted.getMonth() &&
      today.getFullYear() === lastCompleted.getFullYear()
    );
  };

  // Modificar fetchTodos para verificar e atualizar tarefas diárias
  const fetchTodos = async () => {
    if (!user) return;
    
    const todosQuery = query(
      collection(db, 'todos'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    try {
      const snapshot = await getDocs(todosQuery);
      
      // Verificar tarefas diárias que precisam ser resetadas para o dia atual
      const dailyTodosToUpdate: string[] = [];
      
      const todosData = snapshot.docs.map(doc => {
        const data = doc.data();
        const todo = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          lastCompletedAt: data.lastCompletedAt?.toDate(),
          dueDate: data.dueDate?.toDate()
        } as TodoDisplay;
        
        // Se for tarefa diária, verificar se o status completed está correto para hoje
        if (todo.isDaily) {
          const completedToday = isCompletedToday(todo.lastCompletedAt);
          
          // Se a tarefa está marcada como concluída, mas não foi concluída hoje
          if (todo.completed && !completedToday) {
            dailyTodosToUpdate.push(todo.id);
            // Para a UI, já atualizamos o estado como não concluído
            todo.completed = false;
          }
          // Se a tarefa foi concluída hoje, garantir que esteja marcada como concluída
          else if (!todo.completed && completedToday) {
            todo.completed = true;
          }
        }
        
        return todo;
      }) as TodoDisplay[];
      
      // Atualizar no Firestore as tarefas diárias que precisam ser resetadas
      if (dailyTodosToUpdate.length > 0) {
        console.log(`Resetando ${dailyTodosToUpdate.length} tarefas diárias para o novo dia`);
        
        // Atualizar cada tarefa no Firestore
        const updatePromises = dailyTodosToUpdate.map(todoId => 
          updateDoc(doc(db, 'todos', todoId), {
            completed: false,
            status: 'planejado'
            // Não reseta lastCompletedAt para manter o histórico
          })
        );
        
        await Promise.all(updatePromises);
      }
      
      setTodos(todosData);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim() || !user) return;

    try {
      // Define o objetivo atual se estivermos na visualização por objetivo
      const goalId = viewModeValue === 'goals' && currentGoalId ? currentGoalId : selectedGoal;
      const goalTitle = goalId ? goals.find(g => g.id === goalId)?.title : null;
      
      const todoData = {
        title: newTodo,
        description: '',
        status: 'planejado' as const,
        completed: false,
        isDaily: viewModeValue === 'daily' ? true : isDaily,
        userId: user.uid,
        createdAt: new Date(),
        goalId: goalId || null,
        goalTitle: goalTitle || null,
        dueDate: dueDate ? new Date(dueDate) : null
      };

      await addDoc(collection(db, 'todos'), todoData);
      setNewTodo('');
      setSelectedGoal('');
      setIsDaily(false);
      setDueDate('');
      setShowForm(false);
      fetchTodos();
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
    }
  };

  // Modificar a função toggleTodo para registrar corretamente quando a tarefa diária foi concluída
  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const todoRef = doc(db, 'todos', id);
      const newStatus = !todo.completed ? 'concluido' : 'planejado';
      const now = new Date();
      
      if (todo.isDaily) {
        await updateDoc(todoRef, {
          lastCompletedAt: !todo.completed ? now : null,
          completed: !todo.completed,
          status: newStatus
        });
      } else {
        await updateDoc(todoRef, {
          completed: !todo.completed,
          status: newStatus,
          lastCompletedAt: !todo.completed ? now : null
        });
      }
      
      // Atualizar o progresso do objetivo se a tarefa estiver associada a um objetivo
      if (todo.goalId) {
        // Buscar todas as tarefas do objetivo
        const goalTodosQuery = query(
          collection(db, 'todos'),
          where('goalId', '==', todo.goalId)
        );
        const goalTodosSnapshot = await getDocs(goalTodosQuery);
        
        let totalTasks = 0;
        let completedTasks = 0;
        
        goalTodosSnapshot.forEach((doc) => {
          const data = doc.data();
          totalTasks++;
          if (data.completed || (doc.id === id && !todo.completed)) {
            completedTasks++;
          }
        });
        
        // Calcular a porcentagem de progresso
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Atualizar o progresso no objetivo
        const goalRef = doc(db, 'goals', todo.goalId);
        await updateDoc(goalRef, {
          progress: progress,
          completed: progress === 100
        });
      }
      
      fetchTodos();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const startEditing = (todo: TodoDisplay) => {
    setEditingTodo(todo.id);
    setEditText(todo.title);
    setEditDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '');
  };

  const saveEdit = async () => {
    if (!editingTodo || !editText.trim()) return;

    try {
      const todoRef = doc(db, 'todos', editingTodo);
      const updateData: Record<string, any> = {
        title: editText
      };
      
      // Atualizar a data de vencimento apenas se ela for fornecida
      if (editDueDate) {
        updateData.dueDate = new Date(editDueDate);
      } else {
        // Se o campo de data estiver vazio, remover a data de vencimento
        updateData.dueDate = null;
      }
      
      await updateDoc(todoRef, updateData);
      setEditingTodo(null);
      setEditText('');
      setEditDueDate('');
      fetchTodos();
    } catch (error) {
      console.error('Erro ao editar tarefa:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'todos', id));
      fetchTodos();
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };

  // Filtragem de tarefas com base no modo de visualização e filtros adicionais
  const getFilteredTodos = () => {
    let filtered = todos.map(todo => {
      // Se for uma tarefa diária, ajustar o status completed para refletir se foi concluída hoje
      if (todo.isDaily) {
        return {
          ...todo,
          completed: isCompletedToday(todo.lastCompletedAt)
        };
      }
      return todo;
    });
    
    // Aplicar filtro por modo de visualização
    switch (viewModeValue) {
      case 'daily':
        filtered = filtered.filter(todo => todo.isDaily);
        break;
      case 'goals':
        filtered = filtered.filter(todo => todo.goalId === currentGoalId);
        break;
    }
    
    // Aplicar filtro por objetivo (apenas no modo 'all')
    if (viewModeValue === 'all' && filterGoal) {
      filtered = filtered.filter(todo => todo.goalId === filterGoal);
    }
    
    // Aplicar filtro por status de conclusão
    if (filterCompleted !== 'all') {
      filtered = filtered.filter(todo => 
        filterCompleted === 'completed' ? todo.completed : !todo.completed
      );
    }
    
    // Ordenar por prioridade: tarefas atrasadas primeiro, depois por data de vencimento,
    // depois tarefas sem data de vencimento
    filtered = filtered.sort((a, b) => {
      // Se uma tarefa está completa e a outra não, a incompleta vem primeiro
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const aHasDueDate = !!a.dueDate;
      const bHasDueDate = !!b.dueDate;
      
      // Se apenas uma tem data de vencimento
      if (aHasDueDate !== bHasDueDate) {
        return aHasDueDate ? -1 : 1;
      }
      
      // Se ambas têm data de vencimento
      if (aHasDueDate && bHasDueDate) {
        const aIsOverdue = new Date(a.dueDate!) < today;
        const bIsOverdue = new Date(b.dueDate!) < today;
        
        // Se uma está atrasada e a outra não
        if (aIsOverdue !== bIsOverdue) {
          return aIsOverdue ? -1 : 1;
        }
        
        // Ambas atrasadas ou ambas não atrasadas, ordenar por data
        return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
      }
      
      // Se nenhuma tem data, ordenar pela data de criação (mais recente primeiro)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    // Aplicar limite se especificado
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  };

  const filteredTodos = getFilteredTodos();
  const dailyTodos = filteredTodos.filter(todo => todo.isDaily);
  const regularTodos = filteredTodos.filter(todo => !todo.isDaily);
  
  // Agrupar tarefas por objetivo somente se estamos no modo de visualização 'all'
  const todosByGoal = viewModeValue === 'all' 
    ? regularTodos.reduce((acc, todo) => {
        if (todo.goalId) {
          if (!acc[todo.goalId]) {
            acc[todo.goalId] = {
              goalTitle: todo.goalTitle || 'Sem título',
              todos: []
            };
          }
          acc[todo.goalId].todos.push(todo);
        }
        return acc;
      }, {} as Record<string, { goalTitle: string; todos: TodoDisplay[] }>)
    : {};

  const getProgressByGoal = (goalId: string) => {
    const goalTodos = todos.filter(todo => todo.goalId === goalId);
    const completed = goalTodos.filter(todo => todo.completed).length;
    const total = goalTodos.length;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const ProgressBar = ({ completed, total }: { completed: number; total: number }) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return (
      <div className="progress-bar h-3 mt-2">
        <div 
          className="progress-value"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  // Função para determinar o status de uma tarefa com base em sua data de vencimento
  const getDueDateStatus = (todo: TodoDisplay) => {
    if (!todo.dueDate) return 'none';
    if (todo.completed) return 'completed';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(todo.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 2) return 'soon';
    return 'future';
  };

  const TodoItem = ({ todo }: { todo: TodoDisplay }) => {
    const dueDateStatus = getDueDateStatus(todo);
    
    // Para tarefas diárias, calcular se foi concluída hoje
    const dailyCompleted = todo.isDaily ? isCompletedToday(todo.lastCompletedAt) : todo.completed;
    
    return (
      <motion.div
        key={todo.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`task-item group ${dueDateStatus === 'overdue' && !todo.completed ? 'border-l-4 border-red-400' : ''}`}
      >
        {editingTodo === todo.id ? (
          <div className="flex flex-col space-y-2 flex-1">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="form-input flex-1"
              autoFocus
            />
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
              placeholder="Data de vencimento (opcional)"
            />
            <div className="flex space-x-2">
              <button
                onClick={saveEdit}
                className="task-action-btn text-[#4d944d]"
              >
                <FaCheck />
              </button>
              <button
                onClick={() => {
                  setEditingTodo(null);
                  setEditText('');
                  setEditDueDate('');
                }}
                className="task-action-btn text-[#6c443c]"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 flex-1">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={todo.isDaily ? dailyCompleted : todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  className="task-checkbox"
                />
                {(todo.isDaily ? dailyCompleted : todo.completed) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <FaStar className="text-[#c19474] text-xs" />
                  </motion.div>
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className={`${(todo.isDaily ? dailyCompleted : todo.completed) ? 'task-title-completed' : 'task-title-pending'} task-title`}>
                    {todo.title}
                  </span>
                  {todo.isDaily && (
                    <FaClock className="text-[#b17b5d] text-xs" title="Tarefa Diária" />
                  )}
                </div>
                <div className="flex items-center mt-1 gap-2">
                  {todo.goalTitle && viewModeValue !== 'goals' && (
                    <span className="text-xs text-[#666666] flex items-center">
                      <FaLeaf className="mr-1 text-[#6eb46e] text-xs" /> {todo.goalTitle}
                    </span>
                  )}
                  {todo.isDaily && todo.lastCompletedAt && (
                    <span className="text-xs text-[#666666]">
                      Última conclusão: {todo.lastCompletedAt.toLocaleDateString()}
                      {isCompletedToday(todo.lastCompletedAt) && " (Hoje)"}
                    </span>
                  )}
                  {todo.dueDate && (
                    <span 
                      className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        (todo.isDaily ? dailyCompleted : todo.completed)
                          ? 'bg-green-100 text-green-800' 
                          : dueDateStatus === 'overdue'
                            ? 'bg-red-100 text-red-800' 
                            : dueDateStatus === 'today'
                              ? 'bg-yellow-100 text-yellow-800'
                              : dueDateStatus === 'soon'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <FaClock className="text-xs" />
                      {dueDateStatus === 'today' ? 'Hoje' : new Date(todo.dueDate).toLocaleDateString()}
                      {dueDateStatus === 'overdue' && ' (Atrasada)'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="task-actions opacity-0 group-hover:opacity-100">
              <button
                onClick={() => startEditing(todo)}
                className="task-action-btn"
                aria-label="Editar tarefa"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="task-action-btn"
                aria-label="Excluir tarefa"
              >
                <FaTrash />
              </button>
            </div>
          </>
        )}
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9c6550]"></div>
      </div>
    );
  }

  // Se estiver no componente dashboard, mostrar apenas uma versão reduzida
  if (limit) {
    return (
      <div className="section-container">
        <div className="section-header">
          <div className="section-title">
            <FaTasks className="section-title-icon" />
            <h2 className="section-title-text">Suas Tarefas Recentes</h2>
          </div>
          <a href="/tasks" className="section-link">
            Ver todas <FaLink className="ml-1" />
          </a>
        </div>
        
        <AnimatePresence>
          {filteredTodos.length > 0 ? (
            filteredTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)
          ) : (
            <p className="text-center text-[#666666] py-4">
              Nenhuma tarefa encontrada.
            </p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Botão de adicionar tarefa */}
      <div className="section-container">
        {showForm ? (
          <>
            <h2 className="text-xl font-semibold text-[#5b3a35] mb-4">Nova Tarefa</h2>
            <form onSubmit={addTodo} className="space-y-4">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Adicionar nova tarefa..."
                className="form-input"
                autoFocus
              />
              
              {viewModeValue === 'all' && (
                <div className="flex flex-col gap-4">
                  <select
                    value={selectedGoal}
                    onChange={(e) => setSelectedGoal(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Selecione um objetivo (opcional)</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 text-sm text-[#666666] bg-white px-4 py-2 rounded-lg border border-[#d4b397] flex-1">
                      <input
                        type="checkbox"
                        checked={isDaily || viewModeValue === 'daily'}
                        onChange={(e) => setIsDaily(e.target.checked)}
                        disabled={viewModeValue === 'daily'}
                        className="form-checkbox w-4 h-4"
                      />
                      <span>Tarefa Diária</span>
                    </label>
                    
                    <div className="flex-1">
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="form-input w-full"
                        min={new Date().toISOString().split('T')[0]}
                        placeholder="Data de vencimento (opcional)"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Adicionar Tarefa
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
            <FaPlus className="mr-2" /> Adicionar Nova Tarefa
          </button>
        )}
      </div>

      {/* Filtros - apenas no modo 'all' */}
      {viewModeValue === 'all' && (
        <div className="section-container">
          <div className="section-header mb-2">
            <div className="section-title">
              <FaFilter className="section-title-icon" />
              <h2 className="section-title-text">Filtros</h2>
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm font-medium text-[#9c6550]"
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} filtros
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm text-[#5b3a35] font-medium block mb-1">
                  Filtrar por objetivo:
                </label>
                <select
                  value={filterGoal}
                  onChange={(e) => setFilterGoal(e.target.value)}
                  className="form-select"
                >
                  <option value="">Todos os objetivos</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-[#5b3a35] font-medium block mb-1">
                  Status:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={filterCompleted === 'all'}
                      onChange={() => setFilterCompleted('all')}
                      className="form-checkbox"
                    />
                    <span className="text-sm text-[#5b3a35]">Todas</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={filterCompleted === 'completed'}
                      onChange={() => setFilterCompleted('completed')}
                      className="form-checkbox"
                    />
                    <span className="text-sm text-[#5b3a35]">Concluídas</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={filterCompleted === 'pending'}
                      onChange={() => setFilterCompleted('pending')}
                      className="form-checkbox"
                    />
                    <span className="text-sm text-[#5b3a35]">Pendentes</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumo de Progresso - apenas no modo 'all' */}
      {viewModeValue === 'all' && (
        <div className="section-container">
          <div className="section-header">
            <div className="section-title">
              <FaCheckCircle className="section-title-icon" />
              <h2 className="section-title-text">Seu Progresso</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stats-card">
              <div className="stats-icon-container bg-[#f7eee3]">
                <FaClock className="text-[#b17b5d] text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-[#5b3a35] font-medium text-sm">Tarefas Diárias</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#4d944d] font-bold">
                    {todos.filter(t => t.isDaily && isCompletedToday(t.lastCompletedAt)).length}/{todos.filter(t => t.isDaily).length}
                  </span>
                  <span className="text-xs text-[#666666]">
                    {todos.filter(t => t.isDaily).length > 0 
                      ? Math.round((todos.filter(t => t.isDaily && isCompletedToday(t.lastCompletedAt)).length / todos.filter(t => t.isDaily).length) * 100) 
                      : 0}%
                  </span>
                </div>
                <ProgressBar 
                  completed={todos.filter(t => t.isDaily && isCompletedToday(t.lastCompletedAt)).length} 
                  total={todos.filter(t => t.isDaily).length} 
                />
              </div>
            </div>
            
            <div className="stats-card">
              <div className="stats-icon-container bg-[#f7eee3]">
                <FaLeaf className="text-[#6eb46e] text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-[#5b3a35] font-medium text-sm">Tarefas de Objetivos</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#4d944d] font-bold">
                    {todos.filter(t => t.goalId && t.completed).length}/{todos.filter(t => t.goalId).length}
                  </span>
                  <span className="text-xs text-[#666666]">
                    {todos.filter(t => t.goalId).length > 0 
                      ? Math.round((todos.filter(t => t.goalId && t.completed).length / todos.filter(t => t.goalId).length) * 100) 
                      : 0}%
                  </span>
                </div>
                <ProgressBar 
                  completed={todos.filter(t => t.goalId && t.completed).length} 
                  total={todos.filter(t => t.goalId).length} 
                />
              </div>
            </div>
            
            <div className="stats-card">
              <div className="stats-icon-container bg-[#f7eee3]">
                <FaTasks className="text-[#9c6550] text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-[#5b3a35] font-medium text-sm">Total</h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#4d944d] font-bold">
                    {todos.filter(t => t.completed).length}/{todos.length}
                  </span>
                  <span className="text-xs text-[#666666]">
                    {todos.length > 0 
                      ? Math.round((todos.filter(t => t.completed).length / todos.length) * 100) 
                      : 0}%
                  </span>
                </div>
                <ProgressBar 
                  completed={todos.filter(t => t.completed).length} 
                  total={todos.length} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Tarefas - adaptada conforme a visualização selecionada */}
      {viewModeValue === 'daily' && (
        <div className="section-container">
          <div className="section-header">
            <div className="section-title">
              <FaClock className="section-title-icon" />
              <h2 className="section-title-text">Tarefas Diárias</h2>
            </div>
          </div>
          
          <AnimatePresence>
            {dailyTodos.length > 0 ? (
              dailyTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)
            ) : (
              <p className="text-center text-[#666666] py-4">
                Nenhuma tarefa diária encontrada.
              </p>
            )}
          </AnimatePresence>
        </div>
      )}

      {viewModeValue === 'goals' && currentGoalId && (
        <div className="section-container">
          <div className="section-header">
            <div className="section-title">
              <FaLeaf className="section-title-icon" />
              <h2 className="section-title-text">Tarefas deste Objetivo</h2>
            </div>
          </div>
          
          {regularTodos.length > 0 ? (
            <AnimatePresence>
              {regularTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
            </AnimatePresence>
          ) : (
            <p className="text-center text-[#666666] py-4">
              Nenhuma tarefa encontrada para este objetivo.
            </p>
          )}
        </div>
      )}

      {viewModeValue === 'all' && !filterGoal && (
        <>
          {/* Tarefas Diárias */}
          {dailyTodos.length > 0 && (
            <div className="section-container">
              <div className="section-header">
                <div className="section-title">
                  <FaClock className="section-title-icon" />
                  <h2 className="section-title-text">Tarefas Diárias</h2>
                </div>
              </div>
              
              <AnimatePresence>
                {dailyTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
              </AnimatePresence>
            </div>
          )}

          {/* Tarefas por Objetivo */}
          {Object.entries(todosByGoal).map(([goalId, { goalTitle, todos }]) => {
            const progress = getProgressByGoal(goalId);
            return (
              <div key={goalId} className="section-container">
                <div className="section-header">
                  <div className="section-title">
                    <FaLeaf className="section-title-icon" />
                    <h2 className="section-title-text">{goalTitle}</h2>
                  </div>
                  <span className="text-[#4d944d] font-bold">{progress.completed}/{progress.total}</span>
                </div>
                <ProgressBar completed={progress.completed} total={progress.total} />
                <div className="mt-4">
                  <AnimatePresence>
                    {todos.map(todo => <TodoItem key={todo.id} todo={todo} />)}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}

          {/* Tarefas sem Objetivo */}
          {regularTodos.filter(todo => !todo.goalId).length > 0 && (
            <div className="section-container">
              <div className="section-header">
                <div className="section-title">
                  <FaTasks className="section-title-icon" />
                  <h2 className="section-title-text">Outras Tarefas</h2>
                </div>
              </div>
              <AnimatePresence>
                {regularTodos
                  .filter(todo => !todo.goalId)
                  .map(todo => <TodoItem key={todo.id} todo={todo} />)}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {viewModeValue === 'all' && filterGoal && (
        <div className="section-container">
          <div className="section-header">
            <div className="section-title">
              <FaLeaf className="section-title-icon" />
              <h2 className="section-title-text">
                {goals.find(g => g.id === filterGoal)?.title || 'Objetivo Selecionado'}
              </h2>
            </div>
          </div>
          
          <AnimatePresence>
            {filteredTodos.length > 0 ? (
              filteredTodos.map(todo => <TodoItem key={todo.id} todo={todo} />)
            ) : (
              <p className="text-center text-[#666666] py-4">
                Nenhuma tarefa encontrada para este objetivo.
              </p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Mensagem se não houver tarefas */}
      {filteredTodos.length === 0 && (
        <div className="bg-[#f2e8df] rounded-lg p-8 text-center">
          <p className="text-[#6c443c] mb-4">Nenhuma tarefa encontrada para esta visualização.</p>
          <button 
            onClick={() => setShowForm(true)} 
            className="btn btn-primary"
          >
            <FaPlus className="mr-2" /> Adicionar Tarefa
          </button>
        </div>
      )}
    </div>
  );
} 