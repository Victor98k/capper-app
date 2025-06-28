interface Capper {
  id: string;
  userId: string;
  bio: string | null;
  initialWinrate: number | null;
  initialRoi: number | null;
  tags: string[];
  socials: {
    instagram: string;
    x: string;
    discord: string;
    whatsapp: string;
    youtube: string;
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
  };
  subscriberCount: number;
}

export type SidebarCapper = {
  id: string;
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    username: string;
  };
  imageUrl?: string;
  tags: string[];
};

export interface CapperCarouselCard {
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    username: string;
  };
  bio?: string;
  tags: string[];
  subscriberIds: string[];
  isVerified: boolean;
  profileImage?: string;
  imageUrl?: string;
}

export interface DisplayCapperCardPropsExplorePage {
  username: string;
  imageUrl?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  sport?: string;
  likes?: number;
}
