import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
  Query
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, Task, TimeEntry, TimeLog } from '@/types';

// Helper function to check if db is initialized
const getDb = () => {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized. Please check your configuration.');
  }
  return db;
};

// Projects
export const createProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(getDb(), 'projects'), {
    ...project,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getProjects = async (userId: string) => {
  const q = query(
    collection(getDb(), 'projects'),
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Project[];
};

export const updateProject = async (id: string, updates: Partial<Project>) => {
  const projectRef = doc(getDb(), 'projects', id);
  await updateDoc(projectRef, updates);
};

export const deleteProject = async (id: string) => {
  const projectRef = doc(getDb(), 'projects', id);
  await deleteDoc(projectRef);
};

// Tasks
export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
  const docRef = await addDoc(collection(getDb(), 'tasks'), {
    ...task,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getTasks = async (projectId?: string, userId?: string) => {
  let q: Query = collection(getDb(), 'tasks') as Query;
  
  if (projectId) {
    q = query(q, where('projectId', '==', projectId));
  }
  
  if (userId) {
    q = query(q, where('assignedTo', '==', userId));
  }
  
  q = query(q, orderBy('createdAt', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    dueDate: doc.data().dueDate?.toDate(),
  })) as Task[];
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  const taskRef = doc(getDb(), 'tasks', id);
  await updateDoc(taskRef, updates);
};

export const deleteTask = async (id: string) => {
  const taskRef = doc(getDb(), 'tasks', id);
  await deleteDoc(taskRef);
};

// Time Entries
export const createTimeEntry = async (timeEntry: Omit<TimeEntry, 'id'>) => {
  const docRef = await addDoc(collection(getDb(), 'timeEntries'), {
    ...timeEntry,
    startTime: Timestamp.fromDate(timeEntry.startTime),
    endTime: timeEntry.endTime ? Timestamp.fromDate(timeEntry.endTime) : null,
  });
  return docRef.id;
};

export const getTimeEntries = async (userId: string, taskId?: string) => {
  let q = query(
    collection(getDb(), 'timeEntries'),
    where('userId', '==', userId)
  );
  
  if (taskId) {
    q = query(q, where('taskId', '==', taskId));
  }
  
  q = query(q, orderBy('startTime', 'desc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startTime: doc.data().startTime?.toDate() || new Date(),
    endTime: doc.data().endTime?.toDate(),
  })) as TimeEntry[];
};

export const updateTimeEntry = async (id: string, updates: Partial<TimeEntry>) => {
  const timeEntryRef = doc(getDb(), 'timeEntries', id);
  const updateData = { ...updates } as { [x: string]: unknown };
  
  if (updates.startTime) {
    updateData.startTime = Timestamp.fromDate(updates.startTime);
  }
  if (updates.endTime) {
    updateData.endTime = Timestamp.fromDate(updates.endTime);
  }
  
  await updateDoc(timeEntryRef, updateData);
};

export const getActiveTimeEntry = async (userId: string) => {
  const q = query(
    collection(getDb(), 'timeEntries'),
    where('userId', '==', userId),
    where('isActive', '==', true),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  
  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    startTime: doc.data().startTime?.toDate() || new Date(),
    endTime: doc.data().endTime?.toDate(),
  } as TimeEntry;
};

// Time Logs - Simplified query to avoid complex index requirements
export const createTimeLog = async (timeLog: Omit<TimeLog, 'id'>) => {
  const docRef = await addDoc(collection(getDb(), 'timeLogs'), {
    ...timeLog,
    date: Timestamp.fromDate(timeLog.date),
  });
  return docRef.id;
};

export const getTimeLogs = async (userId: string, startDate?: Date, endDate?: Date) => {
  // Simplified query - get all logs for user and filter in memory
  const q = query(
    collection(getDb(), 'timeLogs'),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  let logs = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate() || new Date(),
  })) as TimeLog[];
  
  // Filter by date range in memory if provided
  if (startDate && endDate) {
    logs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= startDate && logDate <= endDate;
    });
  }
  
  return logs;
};
