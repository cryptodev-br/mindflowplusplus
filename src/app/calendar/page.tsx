'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Calendar from 'react-calendar';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import 'react-calendar/dist/Calendar.css';

type Todo = {
  id: string;
  title: string;
  description: string;
  status: 'planejado' | 'em_progresso' | 'concluido';
  createdAt: Date;
};

export default function CalendarPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function fetchTodos() {
      if (!user) return;

      try {
        const todosRef = collection(db, 'todos');
        const q = query(todosRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const todosData: Todo[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          todosData.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            status: data.status,
            createdAt: data.createdAt.toDate(),
          });
        });
        
        setTodos(todosData);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        setIsLoading(false);
      }
    }

    fetchTodos();
  }, [user]);

  const getTodosForDate = (date: Date) => {
    return todos.filter(todo => {
      const todoDate = todo.createdAt;
      return (
        todoDate.getDate() === date.getDate() &&
        todoDate.getMonth() === date.getMonth() &&
        todoDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejado':
        return 'bg-gray-100 text-gray-800';
      case 'em_progresso':
        return 'bg-primary-100 text-primary-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Calendário de Tarefas</h1>
            <p className="mt-2 text-gray-600">
              Visualize suas tarefas organizadas por data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <Calendar
                onChange={setSelectedDate}
                value={selectedDate}
                className="w-full"
                tileContent={({ date }) => {
                  const dayTodos = getTodosForDate(date);
                  if (dayTodos.length > 0) {
                    return (
                      <div className="dot-container">
                        <div className="h-1 w-1 bg-primary-600 rounded-full mx-auto"></div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">
                Tarefas para {selectedDate.toLocaleDateString('pt-BR')}
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {getTodosForDate(selectedDate).length > 0 ? (
                    getTodosForDate(selectedDate).map((todo) => (
                      <div
                        key={todo.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{todo.title}</h3>
                            {todo.description && (
                              <p className="mt-1 text-gray-600">{todo.description}</p>
                            )}
                            <div className="mt-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  todo.status
                                )}`}
                              >
                                {todo.status === 'planejado' && 'Planejado'}
                                {todo.status === 'em_progresso' && 'Em Progresso'}
                                {todo.status === 'concluido' && 'Concluído'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      Nenhuma tarefa para esta data.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>

      <style jsx global>{`
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .react-calendar__tile {
          padding: 1em 0.5em;
        }
        .react-calendar__tile--active {
          background: #0ea5e9 !important;
          color: white;
        }
        .react-calendar__tile--active:enabled:hover,
        .react-calendar__tile--active:enabled:focus {
          background: #0284c7 !important;
        }
        .dot-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 4px;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
} 