# INK BUNNIES NFT Giveaway Bot

A toolkit for working with the INK BUNNIES snapshot: classify holders, run raffles, and execute the special InkBunnies Holder Contest.

## âš ï¸ Excluded Address

The following address is automatically excluded from every classification and raffle:

```
0x337FF83D7f2F80AFF25DE45CF77CAE145bfcE3D6
```

## Features

- Tier-based holder classification with CSV exports
- Standard raffle (1 winner per tier by default)
- InkBunnies Holder Contest logic
  - Tier rewards: 3 / 6 / 3 winners across Holder, Believer, Big Bunnie tiers
  - Whale Bunnie guarantees
  - Weighted raffle for the 1/1 exclusive NFT (tickets = token count)
- Utilities for saving groups and contest results to `data/`

## Commands

```bash
npm run classify   # Classify holders and export tier CSVs
npm run raffle     # Run a simple raffle (1 winner per tier)
npm run contest    # Run the InkBunnies Holder Contest (tier bots + exclusive raffle)
```

## Contest Rules (implemented in `contest` command)

- **Bunnie Holder (1-4 NFTs)** â†’ 3 winners
- **Bunnie Believer (5-9 NFTs)** â†’ 6 winners
- **Big Bunnie (10-14 NFTs)** â†’ 3 winners
- **Whale Bunnie (15+ NFTs)** â†’ Guaranteed NFT (all whales)
- **Exclusive 1/1 NFT** â†’ Weighted raffle (every NFT = 1 ticket)

Outputs are stored in `data/contest_results.json` and include tier winners, whale guarantees, and the exclusive raffle winner.

## Project Structure

```
inkbunnies-giveaway/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ classifiers/
â”‚   â”‚   â””â”€â”€ classifier.js        # Tier definitions and grouping helpers
â”‚   â”œâ”€â”€ raffle/
â”‚   â”‚   â”œâ”€â”€ raffleBot.js         # Generic raffle helpers
â”‚   â”‚   â””â”€â”€ contestBot.js        # Contest-specific logic (two-step bot flow)
â”‚   â”œâ”€â”€ utils/
â”‚   â”‚   â””â”€â”€ dataLoader.js        # JSON/CSV helpers + exclusion filter
â”‚   â””â”€â”€ index.js                 # CLI entry point (classify, raffle, contest)
â”œâ”€â”€ data/                        # Generated outputs (CSVs, contest results)
â”œâ”€â”€ holders_summary_0-2221.json  # Snapshot input
â”œâ”€â”€ tokens_0-2221.json            # Snapshot input
â”œâ”€â”€ package.json
â””â”€â”€ README.md
```

## Usage Notes

1. Place the snapshot JSON files (`holders_summary_0-2221.json`, `tokens_0-2221.json`) next to the project root.
2. Run `npm install` once to install dependencies.
3. Use the commands above as needed.
4. Check the `data/` folder for JSON/CSV outputs after each run.

## License

MIT
