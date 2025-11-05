import { loadHoldersSummary, saveGroups, loadGroups, filterExcludedAddresses, EXCLUDED_ADDRESS, saveGroupsToCSV, saveJSON } from './utils/dataLoader.js';
import { 
  classifyByTokenCount, 
  classifyByAddressPrefix, 
  classifyRandomly,
  getGroupStatistics 
} from './classifiers/classifier.js';
import { 
  selectWinnersFromGroups, 
  selectWinnersProportionally,
  getWinnerStatistics 
} from './raffle/raffleBot.js';
import { runContest } from './raffle/contestBot.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const command = process.argv[2] || 'help';

const CONTEST_TIER_REWARDS = {
  'Bunnie Holder': 3,
  'Bunnie Believer': 6,
  'Big Bunnie': 3
};

const CONTEST_RULES = {
  description: 'InkBunnies Holder Contest',
  tierRewards: {
    'Bunnie Holder (1-4 NFTs)': '3 winners',
    'Bunnie Believer (5-9 NFTs)': '6 winners',
    'Big Bunnie (10-14 NFTs)': '3 winners',
    'Whale Bunnie (15+ NFTs)': 'All holders receive 1 guaranteed NFT'
  },
  exclusiveRaffle: 'Every NFT held = 1 ticket for the 1/1 Exclusive NFT'
};

async function classify() {
  console.log('=== Loading holders summary ===');
  const data = await loadHoldersSummary();
  console.log(`Loaded ${data.totalHolders} holders with ${data.totalTokens} total tokens`);

  console.log(`\nExcluded address: ${EXCLUDED_ADDRESS}`);
  const filteredHolders = filterExcludedAddresses(data.holders);
  console.log(`Excluded ${data.holders.length - filteredHolders.length} holder(s)`);
  console.log(`Eligible holders: ${filteredHolders.length}`);

  console.log('\nClassifying holders into groups...');
  const tierGroups = classifyByTokenCount(filteredHolders);
  const tierStats = getGroupStatistics(tierGroups);

  console.log('\nTier breakdown:');
  for (const [group, size] of Object.entries(tierStats.groupSizes)) {
    console.log(`- ${group}: ${size} holders`);
  }

  const outputPath = await saveGroups(tierGroups, 'tier_groups.json');
  console.log(`\nSaved groups to: ${outputPath}`);

  console.log('\nExporting tier CSV files...');
  const csvFiles = await saveGroupsToCSV(tierGroups);
  for (const { groupName, filePath } of csvFiles) {
    const fileName = path.basename(filePath);
    console.log(`- ${groupName}: ${fileName}`);
  }
}

async function raffle() {
  console.log('=== Running raffle ===');
  console.log(`Excluded address: ${EXCLUDED_ADDRESS}`);

  let groups;
  try {
    groups = await loadGroups('tier_groups.json');
    console.log('Using existing tier_groups.json');
  } catch (error) {
    console.log('tier_groups.json not found. Classifying holders first...');
    const data = await loadHoldersSummary();
    const filteredHolders = filterExcludedAddresses(data.holders);
    groups = classifyByTokenCount(filteredHolders);
    await saveGroups(groups, 'tier_groups.json');
  }

  const stats = getGroupStatistics(groups);
  console.log(`Groups available: ${stats.totalGroups}`);
  console.log(`Eligible holders: ${stats.totalHolders}`);

  console.log('\nSelecting winners (1 per group)...');
  const winners = selectWinnersFromGroups(groups, 1);
  const winnerStats = getWinnerStatistics(winners);

  for (const [groupName, groupWinners] of Object.entries(winners)) {
    console.log(`\n${groupName}:`);
    for (const winner of groupWinners) {
      console.log(`- ${winner.address} (${winner.tokenCount} tokens)`);
    }
  }

  console.log('\nWinner statistics:');
  console.log(`Total winners: ${winnerStats.totalWinners}`);
  console.log(`Unique winners: ${winnerStats.uniqueWinnerCount}`);

  const winnersPath = path.join(__dirname, '../data', 'winners.json');
  await fs.writeFile(winnersPath, JSON.stringify(winners, null, 2), 'utf-8');
  console.log(`\nSaved winners to: ${winnersPath}`);
}

async function contest() {
  console.log('=== Running InkBunnies Holder Contest ===');
  const data = await loadHoldersSummary();
  console.log(`Loaded ${data.totalHolders} holders with ${data.totalTokens} total tokens`);

  const filteredHolders = filterExcludedAddresses(data.holders);
  console.log(`Excluded address: ${EXCLUDED_ADDRESS}`);
  console.log(`Eligible holders: ${filteredHolders.length}`);

  const tierGroups = classifyByTokenCount(filteredHolders);
  console.log('\nContest tier breakdown:');
  const tierStats = getGroupStatistics(tierGroups);
  for (const [group, size] of Object.entries(tierStats.groupSizes)) {
    console.log(`- ${group}: ${size} holders`);
  }

  const contestResults = runContest(tierGroups, { tierRewards: CONTEST_TIER_REWARDS });

  console.log('\nTier rewards (requested vs awarded):');
  for (const [tier, info] of Object.entries(contestResults.tierResults)) {
    console.log(`- ${tier}: ${info.winners.length}/${info.requestedWinners}`);
    info.winners.forEach(holder => console.log(`    ${holder.address} (${holder.tokenCount} tokens)`));
  }

  const whales = contestResults.whaleRewards.guaranteed;
  console.log(`\nWhale Bunnies (guaranteed reward): ${whales.length}`);
  whales.forEach(holder => console.log(`- ${holder.address} (${holder.tokenCount} tokens)`));

  const exclusive = contestResults.exclusiveRaffle;
  if (exclusive.winner) {
    console.log(`\nExclusive 1/1 NFT winner: ${exclusive.winner.address}`);
    console.log(`Tickets: ${exclusive.totalTickets} across ${exclusive.entries} holders`);
  } else {
    console.log('\nExclusive 1/1 NFT raffle could not determine a winner (no eligible tickets).');
  }

  const savePayload = {
    timestamp: new Date().toISOString(),
    rules: CONTEST_RULES,
    totals: {
      eligibleHolders: filteredHolders.length,
      totalTokens: filteredHolders.reduce((sum, holder) => sum + holder.tokenCount, 0)
    },
    tierResults: Object.fromEntries(
      Object.entries(contestResults.tierResults).map(([tier, info]) => [tier, {
        requestedWinners: info.requestedWinners,
        winners: info.winners.map(holder => ({
          address: holder.address,
          tokenCount: holder.tokenCount,
          tokens: holder.tokens
        }))
      }])
    ),
    whaleRewards: whales.map(holder => ({
      address: holder.address,
      tokenCount: holder.tokenCount,
      tokens: holder.tokens
    })),
    exclusiveRaffle: {
      totalTickets: exclusive.totalTickets,
      entries: exclusive.entries,
      winner: exclusive.winner ? {
        address: exclusive.winner.address,
        tokenCount: exclusive.winner.tokenCount,
        tokens: exclusive.winner.tokens
      } : null
    }
  };

  const contestPath = await saveJSON(savePayload, 'contest_results.json');
  console.log(`\nSaved contest results to: ${contestPath}`);
}

function showHelp() {
  console.log(`
INK BUNNIES NFT Giveaway Bot

Usage:
  npm start <command>

Commands:
  classify    - Classify holders into groups
  raffle      - Run raffle and select winners
  contest     - Run the InkBunnies Holder Contest
  help        - Show this help message

Examples:
  npm start classify
  npm start raffle
  npm start contest
  npm run classify
  npm run raffle
  npm run contest
  `);
}

async function main() {
  try {
    switch (command) {
      case 'classify':
        await classify();
        break;
      case 'raffle':
        await raffle();
        break;
      case 'contest':
        await contest();
        break;
      case 'help':
      default:
        showHelp();
        break;
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
