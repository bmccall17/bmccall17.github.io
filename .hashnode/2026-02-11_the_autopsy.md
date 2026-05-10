---
title: "The autopsy: auditing my own game engine"
slug: 2026-02-11-the-autopsy
domain: darketype.hashnode.dev
canonical: "https://bmccall17.github.io/darketype/weblog/2026-02-11_the_autopsy.html"
cover: "https://bmccall17.github.io/assets/social/og/2026-02-11_the_autopsy.png"
seo_title: "The autopsy: auditing my own game engine"
seo_description: "i built a game engine for a forbidden desert xr port. it works. you can play it. people have played it. but i sat down and did a real audit of the cod"
og_image: "https://bmccall17.github.io/assets/social/og/2026-02-11_the_autopsy.png"
tags: gamedev, audit, forbidden-desert, xr, state-management
seriesSlug: darketype-devlog
---

# The problem
I built a game engine for a forbidden desert xr port. It works. You can play it. People have played it. But i sat down and did a real audit of the code and found 20 issues. Five of them critical. The engine was lying to me the whole time.

The biggest lie? "Pure functions for game state transitions." that comment is literally at the top of rules.ts. But almost every action handler mutates the input state directly. Move a player? Mutated in place. Flip a tile? Mutated. Share water? Mutated. The function signature says "i return a new state" but the body says "i changed yours when you werent looking."

# The learning
Shallow copies are the most dangerous kind of "immutability theater." doing `let newState = { ...state }` feels responsible. It looks right. But every nested object (players, tiles, board, ship parts) is still a shared reference. So when you mutate `newState.players[0].position`, you just corrupted the original state, the undo history, and every snapshot zustand was holding.

The scariest part is that this works 95% of the time. React rerenders because the top level reference changed. The game plays fine. Undo seems to work. But its all a house of cards. The moment you need reliable history (for undo, for multiplayer sync, for replays), the whole thing collapses because your "snapshots" are all pointing at the same mutated objects.

I also learned that auditing your own code is brutal. I found a `.replace('_', '_')` that literally replaces an underscore with an underscore. A no-op that somehow worked by accident for months. I found a `getActionCost` function that takes parameters, ignores them, always returns 1, and is never called. Dead code that got exported and stayed there because nobody questioned it.

# The mess
- The undo system takes a snapshot with `JSON.parse(JSON.stringify(state))` which is expensive and strips certain properties. But the real problem is that mutations after the snapshot corrupt the objects the snapshot thought it was preserving
- Game end checks only fire during the storm phase and at the start of the next turn. So if you share water and give away your last drop, you die... But the game doesnt notice until the storm comes. You play as a ghost
- If both clue tiles for a ship part point to the storm eye position, the part spawns at a location with no tile. `GetTileAt` returns undefined. The part becomes a phantom that can never be collected
- Equipment card counts are wrong. Solar shield and secret water reserve quantities are swapped. The total is right (12 cards) so it passed every sanity check i had
- You can use a tunnel to teleport even if your current tunnel is buried under sand. The destination tunnels are checked for blockage but the source tunnel isnt
- The multiplayer server doesnt validate who sent an action. Any connected client can submit moves for any player

# Glimmers (code snippets)
```typescript
// the lie (rules.ts line 201)
// "Execute a player action and return the new game state"
function executeAction(state: GameState, action: GameAction): GameState {
    let newState = { ...state } // shallow copy. every nested object is shared.
    // ...100 lines of mutations on shared references...
    return newState
}

// the ghost player bug (rules.ts)
// executeAction never calls checkGameEnd after player actions.
// you can die mid-turn and keep playing until the storm phase notices.

// the no-op that works by accident (rules.ts line 460)
const rowClueTile = state.board.tiles.find(t =>
    t.tileType === `clue_${partType.replace('_', '_')}_row` && t.isFlipped
    // .replace('_', '_') ... replacing underscore with underscore. 
)
```

# Distillation
Working code is not correct code. The fact that something plays fine for months doesnt mean it handles edge cases, doesnt mean the undo is real, doesnt mean the state is clean. Audit the uncomfortable parts. Read the functions that "just work." thats where the rot lives.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-02-11_the_autopsy.html).*