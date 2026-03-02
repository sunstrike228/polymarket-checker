export interface Profile {
  createdAt: string;
  proxyWallet: string;
  profileImage: string | null;
  pseudonym: string;
  name: string | null;
  bio: string | null;
  xUsername: string | null;
  verifiedBadge: boolean;
}

export interface LeaderboardEntry {
  rank: string;
  proxyWallet: string;
  userName: string;
  xUsername: string;
  verifiedBadge: boolean;
  vol: number;
  pnl: number;
  profileImage: string | null;
}

export interface Position {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  endDate: string;
}

export interface ClosedPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  avgPrice: number;
  totalBought: number;
  realizedPnl: number;
  curPrice: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  endDate: string;
  timestamp: number;
}

export interface Activity {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: string;
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset: string;
  side: string;
  outcomeIndex: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
}

export interface WalletData {
  address: string;
  profile: Profile | null;
  leaderboard: {
    all: LeaderboardEntry | null;
    day: LeaderboardEntry | null;
    week: LeaderboardEntry | null;
    month: LeaderboardEntry | null;
  };
  positions: Position[];
  closedPositions: ClosedPosition[];
  portfolioValue: number;
  marketsTraded: number;
  recentActivity: Activity[];
  usdcVolume: number;
  usdcVolumeTruncated: boolean;
  error?: string;
}
