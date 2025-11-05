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
 * Saves arbitrary data as a JSON file within the data directory
 * @param {any} data - Serializable data to persist
 * @param {string} filename - Output filename
 * @returns {Promise<string>} Path to saved file
 */
export async function saveJSON(data, filename = 'output.json') {
  const filePath = path.join(__dirname, '../../data', filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}
