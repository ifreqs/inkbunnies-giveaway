import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * EXCLUDED ADDRESS - This address will be excluded from all classifications and raffles
 * Address: 0x337FF83D7f2F80AFF25DE45CF77CAE145bfcE3D6
 */
export const EXCLUDED_ADDRESS = '0x337FF83D7f2F80AFF25DE45CF77CAE145bfcE3D6';

/**
 * Filters out excluded addresses from holders array
 * @param {Array} holders - Array of holder objects
 * @returns {Array} Filtered holders array
 */
export function filterExcludedAddresses(holders) {
  return holders.filter(holder => 
    holder.address.toLowerCase() !== EXCLUDED_ADDRESS.toLowerCase()
  );
}

/**
 * Loads the holders summary JSON file
 * @returns {Promise<Object>} The holders summary data
 */
export async function loadHoldersSummary() {
  const filePath = path.join(__dirname, '../../holders_summary_0-2221.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Loads the tokens JSON file
 * @returns {Promise<Object>} The tokens data
 */
export async function loadTokens() {
  const filePath = path.join(__dirname, '../../tokens_0-2221.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Saves classified groups to a JSON file
 * @param {Object} groups - The classified groups
 * @param {string} filename - Output filename
 */
export async function saveGroups(groups, filename = 'groups.json') {
  const filePath = path.join(__dirname, '../../data', filename);
  await fs.writeFile(filePath, JSON.stringify(groups, null, 2), 'utf-8');
  return filePath;
}

/**
 * Loads classified groups from a JSON file
 * @param {string} filename - Input filename
 * @returns {Promise<Object>} The groups data
 */
export async function loadGroups(filename = 'groups.json') {
  const filePath = path.join(__dirname, '../../data', filename);
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Converts holders array to CSV format
 * @param {Array} holders - Array of holder objects
 * @returns {string} CSV formatted string
 */
export function holdersToCSV(holders) {
  if (holders.length === 0) {
    return 'Address,TokenCount,Tokens\n';
  }

  const headers = ['Address', 'TokenCount', 'Tokens'];
  const rows = holders.map(holder => {
    const address = holder.address;
    const tokenCount = holder.tokenCount;
    const tokens = holder.tokens ? holder.tokens.join(';') : '';
    return [address, tokenCount, tokens].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Saves a group to CSV file
 * @param {Array} holders - Array of holder objects
 * @param {string} groupName - Name of the group
 * @param {string} outputDir - Output directory (default: data/)
 * @returns {Promise<string>} Path to the saved CSV file
 */
export async function saveGroupToCSV(holders, groupName, outputDir = 'data') {
  const csvContent = holdersToCSV(holders);
  const safeGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${safeGroupName}.csv`;
  const filePath = path.join(__dirname, '../..', outputDir, filename);
  
  await fs.writeFile(filePath, csvContent, 'utf-8');
  return filePath;
}

/**
 * Saves all groups to separate CSV files
 * @param {Object} groups - Groups object
 * @param {string} outputDir - Output directory (default: data/)
 * @returns {Promise<Array>} Array of saved file paths
 */
export async function saveGroupsToCSV(groups, outputDir = 'data') {
  const savedFiles = [];
  
  for (const [groupName, holders] of Object.entries(groups)) {
    const filePath = await saveGroupToCSV(holders, groupName, outputDir);
    savedFiles.push({ groupName, filePath });
  }
  
  return savedFiles;
}

/**
 * Saves JSON data to a file
 * @param {Object} data - The data to save
 * @param {string} filename - Output filename
 * @returns {Promise<string>} Path to the saved file
 */
export async function saveJSON(data, filename = 'output.json') {
  const filePath = path.join(__dirname, '../../data', filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}

/**
 * Extracts all winning wallets from contest results and saves to CSV
 * @param {Object} contestResults - Contest results object with tierResults, whaleRewards, and exclusiveRaffle
 * @param {string} filename - Output CSV filename (default: winning_wallets.csv)
 * @returns {Promise<string>} Path to the saved CSV file
 */
export async function saveWinningWalletsToCSV(contestResults, filename = 'winning_wallets.csv') {
  const allWinners = [];
  
  // Extract tier winners
  if (contestResults.tierResults) {
    for (const [tier, info] of Object.entries(contestResults.tierResults)) {
      if (info.winners && Array.isArray(info.winners)) {
        for (const winner of info.winners) {
          allWinners.push({
            address: winner.address,
            tokenCount: winner.tokenCount,
            tokens: winner.tokens,
            category: tier,
            rewardType: 'Tier Winner'
          });
        }
      }
    }
  }
  
  // Extract whale rewards (guaranteed)
  if (contestResults.whaleRewards && contestResults.whaleRewards.guaranteed) {
    for (const whale of contestResults.whaleRewards.guaranteed) {
      allWinners.push({
        address: whale.address,
        tokenCount: whale.tokenCount,
        tokens: whale.tokens,
        category: 'Whale Bunnie',
        rewardType: 'Guaranteed Reward'
      });
    }
  }
  
  // Extract exclusive raffle winner
  if (contestResults.exclusiveRaffle && contestResults.exclusiveRaffle.winner) {
    const winner = contestResults.exclusiveRaffle.winner;
    allWinners.push({
      address: winner.address,
      tokenCount: winner.tokenCount,
      tokens: winner.tokens,
      category: 'Exclusive',
      rewardType: '1/1 Exclusive NFT'
    });
  }
  
  // Convert to CSV format
  if (allWinners.length === 0) {
    const csvContent = 'Address,TokenCount,Tokens,Category,RewardType\n';
    const filePath = path.join(__dirname, '../../data', filename);
    await fs.writeFile(filePath, csvContent, 'utf-8');
    return filePath;
  }
  
  const headers = ['Address', 'TokenCount', 'Tokens', 'Category', 'RewardType'];
  const rows = allWinners.map(winner => {
    const address = winner.address;
    const tokenCount = winner.tokenCount || 0;
    const tokens = winner.tokens ? winner.tokens.join(';') : '';
    const category = winner.category || '';
    const rewardType = winner.rewardType || '';
    return [address, tokenCount, tokens, category, rewardType].join(',');
  });
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  const filePath = path.join(__dirname, '../../data', filename);
  await fs.writeFile(filePath, csvContent, 'utf-8');
  return filePath;
}

/**
 * Saves contest results with all logs and statistics to CSV
 * @param {Object} contestResultsData - Full contest results data from JSON file
 * @param {string} filename - Output CSV filename (default: contest_logs.csv)
 * @returns {Promise<string>} Path to the saved CSV file
 */
export async function saveContestLogsToCSV(contestResultsData, filename = 'contest_logs.csv') {
  const rows = [];
  
  // Header row
  const headers = [
    'Timestamp',
    'Category',
    'Tier',
    'RequestedWinners',
    'AwardedWinners',
    'Address',
    'TokenCount',
    'Tokens',
    'RewardType',
    'TotalTickets',
    'TotalEntries',
    'EligibleHolders',
    'TotalTokens'
  ];
  
  const timestamp = contestResultsData.timestamp || '';
  const totals = contestResultsData.totals || {};
  const eligibleHolders = totals.eligibleHolders || 0;
  const totalTokens = totals.totalTokens || 0;
  
  // Tier results
  if (contestResultsData.tierResults) {
    for (const [tier, info] of Object.entries(contestResultsData.tierResults)) {
      const requestedWinners = info.requestedWinners || 0;
      const awardedWinners = info.winners ? info.winners.length : 0;
      
      if (info.winners && info.winners.length > 0) {
        for (const winner of info.winners) {
          rows.push([
            timestamp,
            'Tier Result',
            tier,
            requestedWinners,
            awardedWinners,
            winner.address || '',
            winner.tokenCount || 0,
            winner.tokens ? winner.tokens.join(';') : '',
            'Tier Winner',
            '',
            '',
            eligibleHolders,
            totalTokens
          ]);
        }
      } else {
        // Empty tier result
        rows.push([
          timestamp,
          'Tier Result',
          tier,
          requestedWinners,
          awardedWinners,
          '',
          '',
          '',
          'Tier Winner',
          '',
          '',
          eligibleHolders,
          totalTokens
        ]);
      }
    }
  }
  
  // Whale rewards
  if (contestResultsData.whaleRewards && Array.isArray(contestResultsData.whaleRewards)) {
    for (const whale of contestResultsData.whaleRewards) {
      rows.push([
        timestamp,
        'Whale Reward',
        'Whale Bunnie',
        'All',
        '1',
        whale.address || '',
        whale.tokenCount || 0,
        whale.tokens ? whale.tokens.join(';') : '',
        'Guaranteed Reward',
        '',
        '',
        eligibleHolders,
        totalTokens
      ]);
    }
  }
  
  // Exclusive raffle
  if (contestResultsData.exclusiveRaffle) {
    const exclusive = contestResultsData.exclusiveRaffle;
    const totalTickets = exclusive.totalTickets || 0;
    const totalEntries = exclusive.entries || 0;
    
    if (exclusive.winner) {
      rows.push([
        timestamp,
        'Exclusive Raffle',
        'Exclusive',
        '1',
        '1',
        exclusive.winner.address || '',
        exclusive.winner.tokenCount || 0,
        exclusive.winner.tokens ? exclusive.winner.tokens.join(';') : '',
        '1/1 Exclusive NFT',
        totalTickets,
        totalEntries,
        eligibleHolders,
        totalTokens
      ]);
    } else {
      rows.push([
        timestamp,
        'Exclusive Raffle',
        'Exclusive',
        '1',
        '0',
        '',
        '',
        '',
        '1/1 Exclusive NFT',
        totalTickets,
        totalEntries,
        eligibleHolders,
        totalTokens
      ]);
    }
  }
  
  // Summary row
  rows.push([
    timestamp,
    'Summary',
    'All Tiers',
    '',
    '',
    '',
    '',
    '',
    'Total Winners',
    contestResultsData.exclusiveRaffle?.totalTickets || '',
    contestResultsData.exclusiveRaffle?.entries || '',
    eligibleHolders,
    totalTokens
  ]);
  
  // Convert to CSV
  const csvRows = rows.map(row => 
    row.map(cell => {
      // Escape commas and quotes in CSV
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  );
  
  const csvContent = [headers.join(','), ...csvRows].join('\n');
  const filePath = path.join(__dirname, '../../data', filename);
  await fs.writeFile(filePath, csvContent, 'utf-8');
  return filePath;
}

