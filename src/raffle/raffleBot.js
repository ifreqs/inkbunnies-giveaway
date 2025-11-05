/**
 * Raffle bot for selecting random winners from groups
 * NOTE: Excluded addresses are already filtered out in groups
 */

/**
 * Select random winners from a single group
 * @param {Array} holders - Array of holder objects
 * @param {number} numWinners - Number of winners to select
 * @returns {Array} Array of winner objects
 */
export function selectWinnersFromGroup(holders, numWinners) {
  if (numWinners >= holders.length) {
    return [...holders];
  }

  const shuffled = [...holders].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numWinners);
}

/**
 * Select winners from multiple groups
 * @param {Object} groups - Groups object (excluded addresses already filtered)
 * @param {number} winnersPerGroup - Number of winners per group
 * @returns {Object} Winners object with group names as keys
 */
export function selectWinnersFromGroups(groups, winnersPerGroup = 1) {
  const winners = {};

  for (const [groupName, holders] of Object.entries(groups)) {
    winners[groupName] = selectWinnersFromGroup(holders, winnersPerGroup);
  }

  return winners;
}

/**
 * Select winners proportionally based on group size
 * @param {Object} groups - Groups object (excluded addresses already filtered)
 * @param {number} totalWinners - Total number of winners to select
 * @returns {Object} Winners object with group names as keys
 */
export function selectWinnersProportionally(groups, totalWinners) {
  const winners = {};
  const totalHolders = Object.values(groups).reduce((sum, holders) => sum + holders.length, 0);
  
  let remainingWinners = totalWinners;

  for (const [groupName, holders] of Object.entries(groups)) {
    const groupSize = holders.length;
    const proportion = groupSize / totalHolders;
    const winnersForGroup = Math.floor(totalWinners * proportion);
    
    winners[groupName] = selectWinnersFromGroup(holders, winnersForGroup);
    remainingWinners -= winnersForGroup;
  }

  if (remainingWinners > 0) {
    const groupNames = Object.keys(groups);
    for (let i = 0; i < remainingWinners; i++) {
      const randomGroup = groupNames[Math.floor(Math.random() * groupNames.length)];
      const currentWinners = winners[randomGroup];
      const availableHolders = groups[randomGroup].filter(
        h => !currentWinners.some(w => w.address === h.address)
      );
      
      if (availableHolders.length > 0) {
        const newWinner = selectWinnersFromGroup(availableHolders, 1);
        winners[randomGroup].push(...newWinner);
      }
    }
  }

  return winners;
}

/**
 * Get winner statistics
 * @param {Object} winners - Winners object
 * @returns {Object} Statistics object
 */
export function getWinnerStatistics(winners) {
  const stats = {
    totalGroups: Object.keys(winners).length,
    totalWinners: 0,
    winnersPerGroup: {},
    uniqueAddresses: new Set()
  };

  for (const [groupName, groupWinners] of Object.entries(winners)) {
    const count = groupWinners.length;
    stats.winnersPerGroup[groupName] = count;
    stats.totalWinners += count;
    
    for (const winner of groupWinners) {
      stats.uniqueAddresses.add(winner.address);
    }
  }

  stats.uniqueWinnerCount = stats.uniqueAddresses.size;
  delete stats.uniqueAddresses;

  return stats;
}
