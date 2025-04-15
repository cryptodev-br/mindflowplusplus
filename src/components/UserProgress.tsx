'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { UserProgress as UserProgressType } from '@/types';

const LEVEL_THRESHOLD = 100; // Pontos necessários para subir de nível
const DAILY_STREAK_BONUS = 10; // Pontos extras por manter sequência diária

export default function UserProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgressType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Inicializar ou carregar o progresso do usuário
    const initializeProgress = async () => {
      const progressRef = doc(db, 'userProgress', user.uid);
      const progressDoc = await getDoc(progressRef);

      if (!progressDoc.exists()) {
        const initialProgress: UserProgressType = {
          id: user.uid,
          userId: user.uid,
          level: 1,
          experience: 0,
          dailyStreak: 0,
          lastLoginDate: new Date(),
          avatarType: 'tree',
          avatarLevel: 1,
          achievements: []
        };
        await setDoc(progressRef, initialProgress);
      }
    };

    initializeProgress();

    // Observar mudanças no progresso
    const unsubscribe = onSnapshot(
      doc(db, 'userProgress', user.uid),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as UserProgressType;
          setProgress({
            ...data,
            lastLoginDate: data.lastLoginDate.toDate(),
          });
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const getAvatarImage = () => {
    if (!progress) return null;

    if (progress.avatarType === 'tree') {
      return (
        <div className="relative w-32 h-32">
          {/* Tronco da árvore */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-16 bg-brown-600 rounded-sm"></div>
          {/* Copa da árvore */}
          <div 
            className={`absolute bottom-12 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full ${
              progress.avatarLevel <= 2 ? 'bg-green-300' :
              progress.avatarLevel <= 4 ? 'bg-green-400' :
              progress.avatarLevel <= 6 ? 'bg-green-500' :
              'bg-green-600'
            }`}
          ></div>
          {/* Flores ou frutos baseados no nível */}
          {progress.avatarLevel > 3 && (
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(Math.min(progress.avatarLevel - 3, 5))].map((_, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full bg-pink-400 m-1"
                  style={{
                    transform: `rotate(${i * 72}deg) translate(30px)`,
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Implementar outros tipos de avatar aqui

    return null;
  };

  if (loading || !progress) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const experiencePercentage = (progress.experience / LEVEL_THRESHOLD) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          {getAvatarImage()}
        </motion.div>

        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold">Nível {progress.level}</h2>
          <p className="text-sm text-gray-600">Sequência Diária: {progress.dailyStreak} dias</p>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${experiencePercentage}%` }}
            transition={{ duration: 0.5 }}
            className="bg-primary-600 h-2.5 rounded-full"
          ></motion.div>
        </div>
        <p className="text-sm text-gray-600">
          {progress.experience}/{LEVEL_THRESHOLD} XP para o próximo nível
        </p>

        {progress.achievements.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Conquistas</h3>
            <div className="flex flex-wrap gap-2">
              {progress.achievements.map((achievement, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                  {achievement}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 