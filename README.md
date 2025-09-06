# 🍚 Jollof Wars

[![Play Jollof Wars](https://img.shields.io/badge/Play%20Now-Farcaster%20Miniapp-purple)](https://farcaster.xyz/miniapps/m29neOxI6U3a/jollof)

Jollof Wars is a fun, interactive game that celebrates the friendly rivalry between Ghana and Nigeria over who makes the best jollof rice. Choose your team, cook the perfect jollof through a series of timed actions, and compete for the title of Jollof Champion!

![Jollof Wars Screenshot](public/hero.png)

## 🎮 Play Now

Play Jollof Wars on Farcaster: [https://farcaster.xyz/miniapps/m29neOxI6U3a/jollof](https://farcaster.xyz/miniapps/m29neOxI6U3a/jollof)

## 🌟 Features

- **Team-Based Competition**: Choose between Team Ghana 🇬🇭 and Team Nigeria 🇳🇬
- **Engaging Gameplay**: Cook jollof through a series of timed cooking actions
- **Real-time Leaderboard**: Compete against other players
- **Farcaster Integration**: Seamless user identification
- **ENS Support**: Display ENS names and avatars on the leaderboard
- **Ethereum Follow Protocol**: Follow your favorite team with on-chain social connections

## 🏗️ Technical Architecture

### Frontend
- **Framework:** React with Next.js
- **UI:** Tailwind CSS with custom theming
- **State Management:** React Context API
- **Wallet Integration:** Wagmi hooks and OnchainKit

### Integrations
- **Farcaster MiniKit:** User identification and authentication
- **Ethereum Name Service (ENS):** Name resolution and avatar display
- **Ethereum Follow Protocol (EFP):** On-chain social connections
- **Redis Database:** Leaderboard storage and game state

## 🎮 Game Mechanics

### Game Flow
1. **Team Selection:** Choose between Team Ghana or Team Nigeria
2. **Cooking Game:** Complete timed actions to cook the perfect jollof
3. **Scoring:** Earn points based on timing, accuracy, and combos
4. **Leaderboard:** Compare your score with other players

### Leaderboard System
- Individual player rankings
- Team-based competition (Ghana vs Nigeria)
- ENS integration for player identification
- Filterable by team

## 🔌 Web3 Integrations

### ENS Integration
- Resolves wallet addresses to human-readable names
- Displays ENS avatars in the leaderboard
- Enhances user experience with recognizable identities

### Ethereum Follow Protocol
- Follow Team Ghana (Vitalik.eth) or Team Nigeria (JessePollak.eth)
- On-chain social graph connections
- View follower counts for each team

## 🚀 Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Set up environment variables:
```bash
# Create a .env.local file with these variables
NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME="Jollof Wars"
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_ICON_URL=/icon.png
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here

# Redis for leaderboard (optional)
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token
```

3. Start the development server:
```bash
npm run dev
```

## 📁 Project Structure

```
/app              # Next.js app directory
  /api            # API routes for game state and leaderboard
  /components     # UI components
    /game         # Game-specific components
    /ui           # Shared UI components
/lib              # Utility functions and hooks
  /game           # Game logic and state management
  /efp.ts         # Ethereum Follow Protocol integration
  /ens.ts         # ENS resolution utilities
/public           # Static assets
```

## 📦 Key Dependencies

- **[@coinbase/onchainkit](https://www.base.org/builders/onchainkit):** MiniKit framework for Farcaster integration
- **[ethereum-identity-kit](https://ethidentitykit.com):** For Ethereum Follow Protocol
- **[wagmi](https://wagmi.sh/):** React hooks for Ethereum
- **[next.js](https://nextjs.org):** React framework
- **[tailwindcss](https://tailwindcss.com):** Utility-first CSS framework

## 🔗 Learn More

- [Farcaster Documentation](https://docs.farcaster.xyz/)
- [Ethereum Name Service (ENS)](https://ens.domains/)
- [Ethereum Follow Protocol](https://ethfollowprotocol.org/)
- [MiniKit Documentation](https://docs.base.org/builderkits/minikit/overview)
- [OnchainKit Documentation](https://www.base.org/builders/onchainkit)
