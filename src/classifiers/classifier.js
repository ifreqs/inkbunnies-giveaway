/**
 * Classifies holders into groups based on various criteria
 * NOTE: Excluded addresses are filtered before classification
 */

/**
 * Classify holders by token count (tier-based grouping)
 * Tier definitions:
 * - Bunnie Holder: 1-5 tokens (5 dahil deÄŸil, yani 1 â‰¤ x < 5)
 * - Bunnie Believer: 5-10 tokens (10 dahil deÄŸil, yani 5 â‰¤ x < 10)
 * - Big Bunnie: 10-15 tokens (15 dahil deÄŸil, yani 10 â‰¤ x < 15)
 * - Whale Bunnie: 15+ tokens (15 dahil ve Ã¼stÃ¼, yani x â‰¥ 15)
 * @param {Array} holders - Array of holder objects (should be pre-filtered to exclude excluded addresses)
 * @param {Object} tiers - Tier configuration { tierName: { min, max } }
 * @returns {Object} Groups object with tier names as keys
 */
export function classifyByTokenCount(holders, tiers = null) {
  const defaultTiers = {
    'Bunnie Holder': { min: 1, max: 4 }, // 1 â‰¤ x < 5
    'Bunnie Believer': { min: 5, max: 9 }, // 5 â‰¤ x < 10
    'Big Bunnie': { min: 10, max: 14 }, // 10 â‰¤ x < 15
    'Whale Bunnie': { min: 15, max: Infinity } // x â‰¥ 15
  };

  const tierConfig = tiers || defaultTiers;
  const groups = {};

  // Initialize groups
  for (const tierName of Object.keys(tierConfig)) {
    groups[tierName] = [];
  }

  // Classify each holder
  for (const holder of holders) {
    const tokenCount = holder.tokenCount;
    for (const [tierName, range] of Object.entries(tierConfig)) {
      if (tokenCount >= range.min && tokenCount <= range.max) {
        groups[tierName].push(holder);
        break;
      }
    }
  }

  return groups;
}

/**
 * Classify holders by address prefix (alphabetical grouping)
 * @param {Array} holders - Array of holder objects (should be pre-filtered to exclude excluded addresses)
 * @param {number} numGroups - Number of groups to create
 * @returns {Object} Groups object
 */
export function classifyByAddressPrefix(holders, numGroups = 10) {
  const groups = {};
  
  // Initialize groups
  for (let i = 0; i < numGroups; i++) {
    groups[`group_${i + 1}`] = [];
  }

  // Sort holders by address
  const sortedHolders = [...holders].sort((a, b) => 
    a.address.localeCompare(b.address)
  );

  // Distribute evenly
  const holdersPerGroup = Math.ceil(sortedHolders.length / numGroups);
  for (let i = 0; i < sortedHolders.length; i++) {
    const groupIndex = Math.floor(i / holdersPerGroup);
    const groupName = `group_${groupIndex + 1}`;
    groups[groupName].push(sortedHolders[i]);
  }

  return groups;
}

/**
 * Classify holders randomly into groups
 * @param {Array} holders - Array of holder objects (should be pre-filtered to exclude excluded addresses)
 * @param {number} numGroups - Number of groups to create
 * @returns {Object} Groups object
 */
export function classifyRandomly(holders, numGroups = 10) {
  const groups = {};
  
  // Initialize groups
  for (let i = 0; i < numGroups; i++) {
    groups[`group_${i + 1}`] = [];
  }

  // Shuffle holders array
  const shuffled = [...holders].sort(() => Math.random() - 0.5);

  // Distribute evenly
  for (let i = 0; i < shuffled.length; i++) {
    const groupIndex = i % numGroups;
    const groupName = `group_${groupIndex + 1}`;
    groups[groupName].push(shuffled[i]);
  }

  return groups;
}

/**
 * Get statistics about the groups
 * @param {Object} groups - Groups object
 * @returns {Object} Statistics object
 */
export function getGroupStatistics(groups) {
  const stats = {
    totalGroups: Object.keys(groups).length,
    totalHolders: 0,
    groupSizes: {},
    averageGroupSize: 0
  };

  for (const [groupName, holders] of Object.entries(groups)) {
    const size = holders.length;
    stats.groupSizes[groupName] = size;
    stats.totalHolders += size;
  }

  stats.averageGroupSize = stats.totalHolders / stats.totalGroups;
  
  return stats;
}
