interface Capper {
  id: string;
  userId: string;
  bio: string | null;
  tags: string[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
  subscriberCount: number;
}
