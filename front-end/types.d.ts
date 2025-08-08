interface Children {
  children: React.ReactNode;
}

interface media {
  public_id: string;
  url: string;
}

interface User {
  id: number;
  email: string;
  images?: media[];
  videos?: media[];
  last_seen?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  id: number;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
  last_seen: string;
  images: media[];
  videos: media[];
}

interface Admin {
  id: number;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

interface Domain {
  id: number;
  name: string;
  description: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  user_id: number;
  user: User;
  images: media[];
  videos: media[];
}

interface DomainResponse {
  currentPage: number;
  data: Domain[];
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface AdminToken {
  id: number;
  token: string;
  admin_id: number;
  createdAt: string;
}

interface UserToken {
  id: number;
  token: string;
  user_id: number;
  createdAt: string;
}

interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  currentPage: number;
  data: Notification[];
  limit: number;
  totalItems: number;
  totalPages: number;
  unseenCount: number;
}

interface UpdateOneUserValues {
  email: string;
  password: string;
  repeatPassword: string;
  images: media[];
  videos: media[];
  newImages: [] | File[];
  newVideos: [] | File[];
}

interface ForgotResetState {
  email: string;
  code: string;
  newPassword: string;
  repeatNewPassword: string;
}
