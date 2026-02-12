---
title: "the autopsy: auditing my own game engine"
date: 2026-02-11
state: "learning"
tags: [gamedev, audit, forbidden-desert, xr, state-management]
next_experiment: "the fix sprint"
---

# the problem
i built a game engine for a forbidden desert xr port. it works. you can play it. people have played it. but i sat down and did a real audit of the code and found 20 issues. five of them critical. the engine was lying to me the whole time.

the biggest lie? "pure functions for game state transitions." that comment is literally at the top of rules.ts. but almost every action handler mutates the input state directly. move a player? mutated in place. flip a tile? mutated. share water? mutated. the function signature says "i return a new state" but the body says "i changed yours when you werent looking."

# the learning
shallow copies are the most dangerous kind of "immutability theater." doing `let newState = { ...state }` feels responsible. it looks right. but every nested object (players, tiles, board, ship parts) is still a shared reference. so when you mutate `newState.players[0].position`, you just corrupted the original state, the undo history, and every snapshot zustand was holding.

the scariest part is that this works 95% of the time. react rerenders because the top level reference changed. the game plays fine. undo seems to work. but its all a house of cards. the moment you need reliable history (for undo, for multiplayer sync, for replays), the whole thing collapses because your "snapshots" are all pointing at the same mutated objects.

i also learned that auditing your own code is brutal. i found a `.replace('_', '_')` that literally replaces an underscore with an underscore. a no-op that somehow worked by accident for months. i found a `getActionCost` function that takes parameters, ignores them, always returns 1, and is never called. dead code that got exported and stayed there because nobody questioned it.

# the mess
- the undo system takes a snapshot with `JSON.parse(JSON.stringify(state))` which is expensive and strips certain properties. but the real problem is that mutations after the snapshot corrupt the objects the snapshot thought it was preserving
- game end checks only fire during the storm phase and at the start of the next turn. so if you share water and give away your last drop, you die... but the game doesnt notice until the storm comes. you play as a ghost
- if both clue tiles for a ship part point to the storm eye position, the part spawns at a location with no tile. `getTileAt` returns undefined. the part becomes a phantom that can never be collected
- equipment card counts are wrong. solar shield and secret water reserve quantities are swapped. the total is right (12 cards) so it passed every sanity check i had
- you can use a tunnel to teleport even if your current tunnel is buried under sand. the destination tunnels are checked for blockage but the source tunnel isnt
- the multiplayer server doesnt validate who sent an action. any connected client can submit moves for any player

# glimmers (code snippets)
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

# distillation
working code is not correct code. the fact that something plays fine for months doesnt mean it handles edge cases, doesnt mean the undo is real, doesnt mean the state is clean. audit the uncomfortable parts. read the functions that "just work." thats where the rot lives.
