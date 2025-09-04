# Jollof Wars: Implementation Guide

## 🏗️ Technical Architecture

### Frontend Architecture
- **Framework:** React with Next.js
- **UI Library:** Tailwind CSS for styling
- **Animation:** Framer Motion for fluid cooking animations
- **State Management:** React Context for game state
- **Network:** SWR for data fetching and caching

### Backend Services
- **Authentication:** Farcaster for user identity
- **Database:**
  - User profiles and scores: Base Mini App SDK
  - Leaderboard data: Firebase Realtime Database
  - Team statistics: Firebase Firestore
- **NFT Minting:** Base NFT API for badges and rewards
- **Analytics:** Simple analytics to track engagement metrics

### Integration Points
- **Farcaster SDK:** User authentication and social graph access
- **Base SDK:** For NFT functionality and persistent data storage
- **MiniKit:** Core framework to handle Mini App lifecycle

## 🎮 Game Mechanics Implementation

### User Flow
1. **Entry & Team Selection:**
   - Immediate team selection on first launch (Ghana 🇬🇭 or Nigeria 🇳🇬)
   - Option to view tutorial or jump straight to gameplay
   - User preference stored in local storage + Base SDK

2. **Game Loop Implementation:**
   - Game state: `waiting` → `countdown` → `playing` → `scoring` → `results`
   - Countdown timer with 3-2-1 animation
   - Main gameplay loop with 30-second timer
   - Score calculation and submission

3. **Cooking Mechanics:**
   - Define sequence of actions for "perfect" cooking
   - Track timing precision for each action
   - Implement visual feedback for successful/failed actions
   - Create combo system for consecutive correct actions

4. **Scoring System:**
   - Base score: Sum of successful actions
   - Time multiplier: Faster completion = higher multiplier
   - Combo bonus: Consecutive perfect actions
   - Accuracy penalty: Wrong actions reduce score

### Leaderboard System
- Daily individual leaderboard
- Weekly team leaderboard (Ghana vs Nigeria)
- All-time high scores
- Friend leaderboard (using Farcaster social graph)

### NFT Reward System
- Daily winner: "Golden Spoon" NFT with metadata including score and date
- Weekly team winners: "Best Jollof Nation" crown NFT for all team participants
- Special achievement NFTs for milestones (perfect game, high combo, etc.)

## 📱 UI/UX Design

### Main Screens
1. **Welcome/Team Selection:**
   - Split screen design with Ghana/Nigeria flags
   - Quick animation showing Jollof from both countries
   - One-tap selection to choose team

2. **Game Screen:**
   - Cooking pot centered
   - Ingredient buttons around the edges
   - Clear visual prompts for next action
   - Real-time score and timer
   - Visual feedback for correct/incorrect actions

3. **Results Screen:**
   - Final score with breakdown
   - Position on leaderboard
   - Share button (with customized message)
   - "Play Again" and "Challenge Friend" buttons

4. **Leaderboard Screen:**
   - Tabs for different timeframes and categories
   - Visual indicator of which team is winning overall
   - Friend highlight section

### Visual Style
- Bright, vibrant colors matching West African aesthetic
- Simple, clean UI elements for quick recognition
- Satisfying animations for cooking actions
- Team colors subtly incorporated throughout

## 🛠️ Development Phases

### Phase 1: Core Gameplay MVP (Day 1)
- Basic UI setup with team selection
- Implement core tap/swipe game mechanics
- Create simple scoring system
- Implement timer and round structure

### Phase 2: Social & Persistence Features (Day 2)
- Integrate Farcaster authentication
- Implement leaderboard system
- Add social sharing functionality
- Connect NFT reward system

### Phase 3: Polish & Optimization (Post-Hackathon)
- Performance optimization for smooth animations
- Add sound effects and music
- Implement more advanced cooking sequences
- Expand reward system with more NFT varieties

## 🧪 Testing Strategy
- Focus on performance testing for smooth gameplay
- Test social features with multiple test accounts
- Verify leaderboard accuracy and persistence
- Test NFT minting process end-to-end

## 🚀 Deployment Strategy
1. Build the app with Next.js
2. Deploy to Vercel for hosting
3. Register as Mini App in Base App ecosystem
4. Set up monitoring for initial launch

## 📈 Success Metrics
- Daily Active Users (DAU)
- Average session length
- Retention rate (Day 1, 7, 30)
- NFTs minted
- Social shares per user
- Team competition engagement

---

## 👨‍💻 Technical Implementation Notes

### Game State Management
```typescript
interface GameState {
  phase: 'waiting' | 'countdown' | 'playing' | 'scoring' | 'results';
  timer: number;
  score: number;
  combo: number;
  actions: Action[];
  nextAction: Action;
  team: 'ghana' | 'nigeria';
}

type Action = {
  type: 'tap' | 'swipe';
  ingredient?: 'rice' | 'tomato' | 'pepper' | 'onion' | 'spice';
  direction?: 'left' | 'right' | 'stir';
  timingWindow: number; // ms for perfect timing
}
```

### API Endpoints
- `/api/scores/submit` - Submit user score
- `/api/leaderboard/daily` - Get daily leaderboard
- `/api/leaderboard/weekly` - Get weekly team stats
- `/api/rewards/claim` - Claim NFT reward

### Local Storage Schema
```typescript
interface LocalStorage {
  userId: string;
  team: 'ghana' | 'nigeria';
  highScore: number;
  tutorialComplete: boolean;
  claimedRewards: string[];
}
```

### Helpful Resources
- [MiniKit Documentation](https://docs.base.org/mini-apps/quickstart/new-apps/install)
- [Farcaster SDK Docs](https://miniapps.farcaster.xyz/docs/getting-started)
- [Base NFT API Documentation](https://docs.base.org)
- [Framer Motion Examples](https://www.framer.com/motion/)
