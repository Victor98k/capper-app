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

export type UserRegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  isAdmin: boolean;
};

export type UserLoginData = {
  email: string;
  password: string;
};
