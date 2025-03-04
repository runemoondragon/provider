export interface TokenAssociation {
  walletAddress: string;
  tokenName: string;
  requiredBalance: number;
  associatedUrl?: string;
  createdAt: Date;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  totalSupply: string;
  maxSupply: string;
  holders: string;
  mintStatus: string;
  contractAddress: string;
  lastUpdated: string;
  additionalInfo: {
    divisibility: string;
    etched: string;
    mintStartBlock: string;
    mintEndBlock: string;
    completedMints: string;
    pendingMints: string;
    remainingMints: string;
  };
}

export type VotingSessionStatus = 'active' | 'completed' | 'archived';

export interface VotingQuestion {
  id: string;
  question: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'archived';
  createdBy: string;
  options: ['yes', 'no'];
  results?: VotingResults;
}

export interface VotingQuestionsData {
  questions: VotingQuestion[];
}

export interface Vote {
  questionId: string;
  walletAddress: string;
  choice: 'yes' | 'no';
  tokenBalance: number;
  timestamp: string;
}

export interface VotingResults {
  yesVotes: number;
  noVotes: number;
  totalVoters: number;
  totalVotingPower: number;
  winningChoice?: 'yes' | 'no';
  hasEnded: boolean;
}

export interface VotingSession {
  question: string;
  options: string[];
  results?: {
    votes: Record<string, number>;
    votingPower: Record<string, number>;
    totalVotes: number;
    totalVotingPower: number;
    winningOption: string;
  };
}

export interface VotingInputData {
  questions: Array<{
    id: string;
    token: string;
    question: string;
    startTime: string;
    endTime: string;
    status: 'active' | 'completed' | 'archived';
    createdBy: string;
    results: {
      yesVotes: number;
      noVotes: number;
      totalVoters: number;
      totalVotingPower: number;
      winningChoice?: 'yes' | 'no';
      hasEnded: boolean;
    };
  }>;
}

export interface VotingFormData {
  question: string;
  description: string;
  startDate: string;
  endDate: string;
}