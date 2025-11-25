export interface User {
  user: string;
  email: string;
}

export interface Project {
  _id: string;
  name: string;
  createdAt?: string;
}

export interface ProjectResponse {
  list: Project[];
  count: number;
}

export interface ProjectsState {
  list: Project[];
  count: number;
  loading: boolean;
  error?: string | null;
}

export enum TicketStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
}

export interface Ticket {
  id: string;
  projectId: string;
  description: string;
  status: TicketStatus;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: number;
  updatedAt?: number;
  type: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error?: string | null;
}

export interface TicketsState {
  tickets: Ticket[];
  loading: boolean;
  error?: string | null;
}

export interface NotificationsState {
  notifications: Notification[];
  loading: boolean;
  error?: string | null;
}

export interface UiState {
  isSuperUser: boolean;
  lastSeen: number;
}

export interface ApiResponse<T> {
  data: T;
  status: string;
  message?: string;
}

export interface LoginProps {
  email: string;
  setEmail: (email: string) => void;
  onSendOTP: () => void;
}

export interface OTPVerificationProps {
  email: string;
  onSuccess: () => void;
  onBack?: () => void;
}
