import { User, Paper } from '@/types';

const USERS_KEY = 'exam_system_users';
const PAPERS_KEY = 'exam_system_papers';
const CURRENT_USER_KEY = 'exam_system_current_user';

// Initialize with demo data if empty
const initializeDemoData = () => {
  const users = getUsers();
  if (users.length === 0) {
    const demoUsers: User[] = [
      {
        id: 'demo-lecturer-1',
        email: 'lecturer@cs.edu',
        password: 'password123',
        fullName: 'Dr. John Smith',
        role: 'lecturer',
        department: 'Computer Science',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-examiner-1',
        email: 'examiner@cs.edu',
        password: 'password123',
        fullName: 'Dr. Sarah Johnson',
        role: 'examiner',
        department: 'Computer Science',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'demo-hod-1',
        email: 'hod@cs.edu',
        password: 'password123',
        fullName: 'Prof. Michael Brown',
        role: 'hod',
        department: 'Computer Science',
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
  }
};

// Users
export const getUsers = (): User[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const findUserByEmail = (email: string): User | undefined => {
  return getUsers().find(u => u.email === email);
};

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(CURRENT_USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Papers
export const getPapers = (): Paper[] => {
  const data = localStorage.getItem(PAPERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const savePaper = (paper: Paper): void => {
  const papers = getPapers();
  const index = papers.findIndex(p => p.id === paper.id);
  if (index >= 0) {
    papers[index] = paper;
  } else {
    papers.push(paper);
  }
  localStorage.setItem(PAPERS_KEY, JSON.stringify(papers));
};

export const getPaperById = (id: string): Paper | undefined => {
  return getPapers().find(p => p.id === id);
};

export const getPapersByLecturer = (lecturerId: string): Paper[] => {
  return getPapers().filter(p => p.lecturerId === lecturerId);
};

export const getPapersByExaminer = (examinerId: string, department: string): Paper[] => {
  return getPapers().filter(p => 
    p.department === department && 
    (p.status === 'pending_moderation' || p.examinerId === examinerId)
  );
};

export const getPapersByDepartment = (department: string): Paper[] => {
  return getPapers().filter(p => p.department === department);
};

export const getPapersForHOD = (department: string): Paper[] => {
  return getPapers().filter(p => 
    p.department === department && 
    (p.status === 'pending_approval' || p.status === 'approved' || p.status === 'printed')
  );
};

export const getRepositoryPapers = (department: string): Paper[] => {
  return getPapers().filter(p => 
    p.department === department && 
    (p.status === 'approved' || p.status === 'printed')
  );
};

// Initialize
initializeDemoData();
