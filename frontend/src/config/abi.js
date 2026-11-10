// BountyFactory ABI
export const BountyFactoryABI = [
  {
    "inputs": [{"internalType": "address", "name": "_bountyImplementation", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "bountyAddress", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "BountyCreated",
    "type": "event"
  },
  {
    "inputs": [
      {"internalType": "string", "name": "_questionIpfsHash", "type": "string"},
      {"internalType": "uint256", "name": "_deadlineDays", "type": "uint256"}
    ],
    "name": "createBounty",
    "outputs": [{"internalType": "address", "name": "bountyAddress", "type": "address"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "bountyCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "bounties",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "getBountyAddress",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getUserBounties",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllBounties",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "isBounty",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "_creator", "type": "address"},
      {"internalType": "string", "name": "_questionIpfsHash", "type": "string"},
      {"internalType": "uint256", "name": "_deadlineDays", "type": "uint256"}
    ],
    "name": "createBountyFor",
    "outputs": [{"internalType": "address", "name": "bountyAddress", "type": "address"}],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Bounty ABI
export const BountyABI = [
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "deadline", "type": "uint256"}
    ],
    "name": "BountyInitialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "solver", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "solutionIpfsHash", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "SolutionSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "solver", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256"}
    ],
    "name": "SolutionApproved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "disputer", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "reasonIpfsHash", "type": "string"}
    ],
    "name": "BountyDisputed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "solver", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "reward", "type": "uint256"}
    ],
    "name": "BountyAutoReleased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "creator", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "refundAmount", "type": "uint256"}
    ],
    "name": "BountyCancelled",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "creator",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "solver",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "questionIpfsHash",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "solutionIpfsHash",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reward",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deadline",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "createdAt",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "submittedAt",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "status",
    "outputs": [{"internalType": "enum Bounty.BountyStatus", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "disputeReasonIpfsHash",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_solutionIpfsHash", "type": "string"}],
    "name": "submitSolution",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "approveSolution",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_reasonIpfsHash", "type": "string"}],
    "name": "rejectSolution",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptRejection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rejectReasonIpfsHash",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_reasonIpfsHash", "type": "string"}],
    "name": "disputeBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "autoRelease",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "cancelBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address[]", "name": "_solvers", "type": "address[]"},
      {"internalType": "uint256[]", "name": "_ratios", "type": "uint256[]"}
    ],
    "name": "splitReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getBountyInfo",
    "outputs": [
      {"internalType": "address", "name": "_creator", "type": "address"},
      {"internalType": "address", "name": "_solver", "type": "address"},
      {"internalType": "string", "name": "_questionIpfsHash", "type": "string"},
      {"internalType": "string", "name": "_solutionIpfsHash", "type": "string"},
      {"internalType": "uint256", "name": "_reward", "type": "uint256"},
      {"internalType": "uint256", "name": "_deadline", "type": "uint256"},
      {"internalType": "uint256", "name": "_createdAt", "type": "uint256"},
      {"internalType": "enum Bounty.BountyStatus", "name": "_status", "type": "uint8"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTimeRemaining",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// ReputationSystem ABI
export const ReputationSystemABI = [
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getReputation",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "solverScore", "type": "uint256"},
          {"internalType": "uint256", "name": "creatorScore", "type": "uint256"},
          {"internalType": "uint256", "name": "totalSolved", "type": "uint256"},
          {"internalType": "uint256", "name": "totalCreated", "type": "uint256"},
          {"internalType": "uint256", "name": "totalDisputed", "type": "uint256"}
        ],
        "internalType": "struct ReputationSystem.UserReputation",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "hasNFT",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "getReputationNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_user", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "userTokenId",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "solverScore", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "creatorScore", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "updateType", "type": "string"}
    ],
    "name": "ReputationUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "ReputationNFTMinted",
    "type": "event"
  }
];

// ArbitrationDAO ABI
export const ArbitrationDAOABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_bountyId", "type": "uint256"},
      {"internalType": "address", "name": "_bountyAddress", "type": "address"},
      {"internalType": "string", "name": "_evidenceIpfsHash", "type": "string"}
    ],
    "name": "createProposal",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_proposalId", "type": "uint256"},
      {"internalType": "bool", "name": "_support", "type": "bool"}
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_proposalId", "type": "uint256"}],
    "name": "executeArbitration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "stakeToBecomeArbitrator",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proposalCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_proposalId", "type": "uint256"}],
    "name": "getProposal",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "bountyId", "type": "uint256"},
          {"internalType": "address", "name": "bountyAddress", "type": "address"},
          {"internalType": "address", "name": "proposer", "type": "address"},
          {"internalType": "string", "name": "evidenceIpfsHash", "type": "string"},
          {"internalType": "uint256", "name": "yesVotes", "type": "uint256"},
          {"internalType": "uint256", "name": "noVotes", "type": "uint256"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"},
          {"internalType": "bool", "name": "executed", "type": "bool"},
          {"internalType": "enum ArbitrationDAO.ProposalStatus", "name": "status", "type": "uint8"}
        ],
        "internalType": "struct ArbitrationDAO.Proposal",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_proposalId", "type": "uint256"}],
    "name": "getProposalVotes",
    "outputs": [
      {"internalType": "uint256", "name": "yes", "type": "uint256"},
      {"internalType": "uint256", "name": "no", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_proposalId", "type": "uint256"}],
    "name": "isVotingActive",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "address", "name": "", "type": "address"}
    ],
    "name": "hasVoted",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "isArbitrator",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "proposer", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "evidenceIpfsHash", "type": "string"}
    ],
    "name": "ProposalCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "voter", "type": "address"},
      {"indexed": false, "internalType": "bool", "name": "support", "type": "bool"}
    ],
    "name": "Voted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256"},
      {"indexed": true, "internalType": "uint256", "name": "bountyId", "type": "uint256"},
      {"indexed": false, "internalType": "bool", "name": "solverWins", "type": "bool"},
      {"indexed": false, "internalType": "uint256", "name": "yesVotes", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "noVotes", "type": "uint256"}
    ],
    "name": "ArbitrationExecuted",
    "type": "event"
  }
];

// BountyPlatform ABI
export const BountyPlatformABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_questionIpfsHash", "type": "string"},
      {"internalType": "uint256", "name": "_deadlineDays", "type": "uint256"}
    ],
    "name": "createBounty",
    "outputs": [{"internalType": "address", "name": "bountyAddress", "type": "address"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "notifySolutionSubmitted",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "notifySolutionApproved",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "notifyAutoReleased",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "notifyCancelled",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "notifyDisputed",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_bountyId", "type": "uint256"},
      {"internalType": "string", "name": "_evidenceIpfsHash", "type": "string"}
    ],
    "name": "createArbitrationProposal",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlatformStats",
    "outputs": [
      {"internalType": "uint256", "name": "_totalBounties", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalResolved", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalRewardPool", "type": "uint256"},
      {"internalType": "uint256", "name": "_activeBounties", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_bountyId", "type": "uint256"}],
    "name": "getBountyDetails",
    "outputs": [
      {"internalType": "address", "name": "_creator", "type": "address"},
      {"internalType": "address", "name": "_solver", "type": "address"},
      {"internalType": "string", "name": "_questionIpfsHash", "type": "string"},
      {"internalType": "string", "name": "_solutionIpfsHash", "type": "string"},
      {"internalType": "uint256", "name": "_reward", "type": "uint256"},
      {"internalType": "uint256", "name": "_deadline", "type": "uint256"},
      {"internalType": "uint256", "name": "_createdAt", "type": "uint256"},
      {"internalType": "enum Bounty.BountyStatus", "name": "_status", "type": "uint8"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
