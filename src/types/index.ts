export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  status: 'active' | 'completed' | 'archived';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  dueDate?: Date;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  projectId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  description: string;
  isActive: boolean;
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  projectId: string;
  date: Date;
  hours: number;
  minutes: number;
  description: string;
}
