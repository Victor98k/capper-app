export type User = {
  id: string;
  firstName: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export interface UserRegistrationData {
  username: string;
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
