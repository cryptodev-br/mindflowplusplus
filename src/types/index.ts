export type TodoStatus = 'planejado' | 'em_progresso' | 'concluido';

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  userId: string;
  createdAt: Date;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  isDaily: boolean;
  goalId?: string;
  userId: string;
  createdAt: Date;
  lastCompletedAt?: Date;
  dueDate?: Date;
}

export interface UserProgress {
  id: string;
  userId: string;
  level: number;
  experience: number;
  dailyStreak: number;
  lastLoginDate: Date;
  avatarType: 'tree' | 'character';
  avatarLevel: number;
  achievements: string[];
} 