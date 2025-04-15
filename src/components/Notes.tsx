'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, query, onSnapshot, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  userId: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const notesRef = collection(db, 'notes');
    const q = query(
      notesRef,
      where('userId', '==', user.uid)
      // Temporariamente removido até o índice ser criado
      // orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notesData: Note[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notesData.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt.toDate(),
          userId: data.userId,
        });
      });
      // Ordenar os dados no cliente temporariamente
      notesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setNotes(notesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (!newNoteTitle.trim()) return;

    try {
      await addDoc(collection(db, 'notes'), {
        title: newNoteTitle,
        content: newNoteContent,
        createdAt: new Date(),
        userId: user.uid,
      });
      
      setNewNoteTitle('');
      setNewNoteContent('');
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const noteRef = doc(db, 'notes', noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-6">Minhas Notas</h2>
        
        <form onSubmit={addNote} className="mb-6">
          <div className="mb-4">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Título da nota"
              className="input"
              required
            />
          </div>
          <div className="mb-4">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Conteúdo da nota"
              className="input h-32 resize-none"
              required
            ></textarea>
          </div>
          <button type="submit" className="btn-primary">
            Adicionar Nota
          </button>
        </form>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gray-50 p-4 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{note.title}</h3>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{note.content}</p>
                <div className="text-sm text-gray-400 mt-2">
                  {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 