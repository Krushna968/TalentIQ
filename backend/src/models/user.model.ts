export interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'recruiter' | 'admin';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
