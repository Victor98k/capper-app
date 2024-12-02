export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isCapper?: boolean;
}

export type UserLoginData = {
  email: string;
  password: string;
};
