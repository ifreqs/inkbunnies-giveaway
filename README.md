# INK BUNNIES NFT Giveaway Toolkit

A Node.js toolkit for the INK BUNNIES snapshot: classify holders, export tier data, and run raffles/contests tailored to the collection.

## Snapshot Inputs

Place the snapshot JSON files in the project root:

- holders_summary_0-2221.json
- tokens_0-2221.json

## Excluded Address

The following address is automatically removed from every workflow (classification, raffles, contest):

```
0x337FF83D7f2F80AFF25DE45CF77CAE145bfcE3D6
```

## Holder Tiers (contest-ready)

| Tier            | Token Count Rule |
| --------------- | ---------------- |
| Bunnie Holder   | 1 <= tokens < 5  |
| Bunnie Believer | 5 <= tokens < 10 |
| Big Bunnie      | 10 <= tokens < 15|
| Whale Bunnie    | tokens >= 15     |

These ranges power both the CSV exports and the contest reward logic.

## Commands

```
npm install            # once

npm run classify       # classify holders + export tier CSVs
npm run raffle         # simple raffle (default: 1 winner per tier)
npm run contest        # full InkBunnies holder contest
```

### `npm run classify`
1. Loads the snapshot and filters the excluded wallet.
2. Classifies holders into the four tiers above.
3. Saves `data/tier_groups.json` and per-tier CSV files (`Bunnie_Holder.csv`, etc.).

### `npm run raffle`
1. Loads existing `tier_groups.json` (or triggers classification if missing).
2. Selects winners per tier using simple random sampling (`raffle/raffleBot.js`).
3. Saves `data/winners.json` with the results.

### `npm run contest`
Runs the two bots back-to-back for the official contest flow:

1. Tier reward bot (`raffle/contestBot.js`)
   - Holder (1-4 NFTs): 3 winners
   - Believer (5-9 NFTs): 6 winners
   - Big (10-14 NFTs): 3 winners
   - Whale (15+ NFTs): every whale address gets a guaranteed reward
2. Exclusive 1/1 bot
   - All eligible holders enter a weighted raffle where every NFT = 1 ticket (15+ NFTs count as 3 tickets each).
   - One wallet receives the exclusive 1/1 NFT.
3. Results are saved to `data/contest_results.json` with:
   - Timestamp and contest rules
   - Tier winners and requested counts
   - Whale payout list
   - Exclusive raffle stats (total tickets, participants, winning wallet)

## Project Structure

```
inkbunnies-giveaway/
  src/
    classifiers/classifier.js        # tier definitions & grouping helpers
    raffle/raffleBot.js              # generic raffle helpers
    raffle/contestBot.js             # two-step contest logic (tier + exclusive)
    utils/dataLoader.js              # JSON/CSV IO utilities + exclusion filter
    index.js                         # CLI entry point (classify, raffle, contest)
  data/                              # generated outputs (CSVs, winners, contest)
  holders_summary_0-2221.json        # snapshot input (not versioned)
  tokens_0-2221.json                 # snapshot input (not versioned)
  package.json
  README.md
```

## Outputs

- `data/Bunnie_*.csv` - tier holder exports for audits or manual draws
- `data/tier_groups.json` - cached grouping for reruns
- `data/winners.json` - raffle winners (simple raffle)
- `data/contest_results.json` - full contest output

## Development Notes

- Written in native ESM (Node.js >= 18).
- Console messaging is in English for easy publishing.
- Contest logic assumes the snapshot is authoritative; rerun `npm run classify` if the dataset changes.

## License

MIT
