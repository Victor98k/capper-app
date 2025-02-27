// Uppload post as capper
export type CapperPost = {
  id: string;
  capperId: string;
  headline: string;
  description: string;
  picture: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Post = {
  _id: string;
  title: string;
  content: string;
  imageUrl: string;
  odds: string[];
  bets: string[];
  tags: string[];
  capperId: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
  likes?: number;
  comments?: number;
  capperInfo?: {
    firstName: string;
    lastName: string;
    username: string;
    imageUrl?: string;
    isVerified?: boolean;
  };
};

export type ExplorePost = {
  _id: string;
  imageUrl: string | null;
  capperId: string;
  title: string;
  content: string;
  tags: string[];
  capperInfo: {
    username: string;
    profileImage?: string;
    firstName?: string;
    lastName?: string;
    subscribersCount?: number;
    sport?: string;
  };
  likes: number;
};
