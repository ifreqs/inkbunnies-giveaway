import crypto from 'crypto';
import { selectWinnersFromGroup } from './raffleBot.js';

const DEFAULT_TIER_REWARDS = {
  'Bunnie Holder': 3,
  'Bunnie Believer': 6,
  'Big Bunnie': 3
};

function flattenGroups(groups) {
  const all = [];
  for (const holders of Object.values(groups)) {
    if (holders && Array.isArray(holders)) {
      all.push(...holders);
    }
  }
  return all;
}

function getTicketCount(holder) {
  const base = holder?.tokenCount ?? (holder?.tokens ? holder.tokens.length : 0);
  if (!base || base <= 0) {
    return 0;
  }
  return base >= 15 ? base * 3 : base;
}

function pickWeightedWinner(holders) {
  const eligible = holders.filter(holder => getTicketCount(holder) > 0);
  if (eligible.length === 0) {
    return null;
  }

  const totalTickets = eligible.reduce((sum, holder) => sum + getTicketCount(holder), 0);
  if (totalTickets === 0) {
    return null;
  }

  let threshold = crypto.randomInt(totalTickets);
  for (const holder of eligible) {
    threshold -= getTicketCount(holder);
    if (threshold < 0) {
      return {
        winner: holder,
        totalTickets,
        entries: eligible.length
      };
    }
  }

  return {
    winner: eligible[eligible.length - 1],
    totalTickets,
    entries: eligible.length
  };
}

export function runContest(groups, options = {}) {
  const tierRewards = {
    ...DEFAULT_TIER_REWARDS,
    ...(options.tierRewards || {})
  };

  const tierResults = {};
  for (const [tierName, rewardCount] of Object.entries(tierRewards)) {
    const holders = groups[tierName] || [];
    const winners = selectWinnersFromGroup(holders, rewardCount);
    tierResults[tierName] = {
      requestedWinners: rewardCount,
      winners
    };
  }

  const whaleGroup = groups['Whale Bunnie'] || [];

  const allHolders = flattenGroups(groups);
  const weightedResult = pickWeightedWinner(allHolders);

  return {
    tierResults,
    whaleRewards: {
      guaranteed: whaleGroup
    },
    exclusiveRaffle: weightedResult || {
      winner: null,
      totalTickets: 0,
      entries: 0
    }
  };
}
