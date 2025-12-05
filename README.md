# Space Arena - Game Clone

**Purpose:** User-facing documentation. Describes what the game is, how to play it, and how to run it.

**For technical details, see AGENTS.md. For combat mechanics, see BATTLE.md.**

---

A browser-based clone of the mobile game Space Arena, built with SolidJS and Phaser 3.

## Overview

Space Arena is an automated space combat game where players design ships by placing modules on a grid, then watch them battle autonomously. Success depends on strategic ship design, module placement, and resource management.

## Gameplay Mechanics

### Game Flow
1. **Main Menu** → Choose Career Mode or Quick Battle
2. **Level Select** → Pick a campaign mission
3. **Ship Select** → Choose your ship hull
4. **Fitting Scene** → Design your ship with modules
5. **Battle Mode** → Watch automated combat

### Battle Mechanics

**Combat System:**
- Automated AI-controlled battles
- Mass-based physics (heavier ships = slower acceleration)
- Damage ramping: After 30s, damage increases 2%/second
- Three weapon types: Ballistic (armor-based), Laser (reflect-based), Missile (AoE)
- Visual effects: Smoke trails, explosions, particle systems

**Weapon Effectiveness:**
- Ballistics: Best vs shields, reduced by armor, can penetrate multiple modules
- Lasers: Bypass shields, reduced by reflect %
- Missiles: Best vs armor (AoE hits multiple cells), can be intercepted
- Junk Launcher: Fires debris that blocks enemy weapons (15 HP each)
- Mine Launcher: Deploys proximity mines that explode on contact

### Ship System

**Ship Properties:**
- **Class**: Corvette, Frigate, Cruiser, Battleship, Carrier
- **Grid**: 2D array defining device cells ('D') and engine cells ('E')
- **Total Cells**: Maximum module capacity
- **Stats**: Speed, Turning, Unlock Level

**Grid Cell Types:**
- **'D' (Device)**: Can place weapons, defense, reactors, support modules
- **'E' (Engine)**: Can only place engine/thruster modules
- **' ' (Empty)**: Cannot place any modules

### Module System

**Module Categories:**

1. **Weapons** (Red - 0xff4444)
   - Ballistic: Chainguns, Railguns (affected by armor)
   - Laser: Laser weapons (affected by reflect %)
   - Missile: Missiles, Torpedoes (can be intercepted)
   - Stats: Damage, Range, Fire Rate, Penetration, Power Use

2. **Defense** (Blue - 0x4444ff)
   - Armor: Steel, Reactive, Plasma, Solar
   - Shield: Combat Shield, Battle Shield, War Shield
   - Stats: Health, Armor rating, Reflect %, Power Use

3. **Utility** (Yellow - 0xffaa00)
   - Reactors: Generate power (Small, Medium, Large)
   - Engines: Ion Drive, Warp Drive, Vectored Thruster (must be on 'E' cells)
   - Support: Repair Bay, Point Defense, Junk Launcher, Mine Launcher
   - Stats: Power Generation (reactors), Power Use (others)

**Module Properties:**
- **Size**: Grid dimensions (e.g., 1x1, 2x1, 2x7)
- **Health**: Hit points before destruction
- **Armor**: Damage reduction
- **Mass**: Affects ship movement
- **Power**: Generation (negative) or consumption (positive)

### Fitting Rules

**Level Requirements:**
- Players have a level (currently unimplemented)
- Can only fly ships where player level ≥ ship required level (rl)
- A ship of level N can fit modules of up to level N+5

**Ship Fitting Requirements:**
- Must have sufficient power to power all modules
- All ship cells must be filled (no empty cells)
- Must have at least 1 reactor
- Must have at least 1 engine

**Click-to-Place System:**
1. Click a module in the inventory to select it (highlighted blue)
2. Hover over ship grid to see placement preview (green = valid, red = invalid)
3. Click a grid cell to place the module
4. Click placed modules to remove them
5. Can place multiple instances of the same module

**Placement Constraints:**
- Must fit within grid boundaries
- Cannot overlap with other modules
- Engines only on 'E' cells, other modules only on 'D' cells
- All cells in module footprint must be valid ship cells

### Resource Management

**Power Balance:**
- Power Generation (from reactors) must be ≥ Power Consumption
- Display shows: `Power: [Used] / [Generated]`
- Red text indicates insufficient power

**Cell Capacity:**
- Total cells used cannot exceed ship capacity
- Display shows: `Cells: [Used] / [Total]`
- Red text indicates over capacity

**Battle Requirements:**
- Must have at least one weapon
- Must have at least one reactor
- Must have at least one engine
- Power balance must be positive (generation ≥ consumption)
- All ship cells must be filled

### Combat System

**Damage Types:**
- **Ballistic**: Physical projectiles, reduced by armor, can penetrate multiple modules
- **Laser**: Energy beams, bypass shields, reduced by reflect %
- **Missile**: Tracking projectiles, AoE damage, can be intercepted by point defense

**Module Destruction:**
- Modules can be individually destroyed
- Visual feedback: Green (>50% HP), Orange (25-50%), Red (<25%), Black (destroyed)
- Destroyed modules create explosion effects and smoke
- Reactor explosions: When destroyed, reactors damage adjacent modules (horizontal/vertical only)
- Ship defeated when all weapons or all reactors destroyed

**AI Behavior:**
- Ships move to optimal weapon range (70% of average weapon range)
- Lateral strafing for dynamic movement
- Auto-fire weapons when in range and facing target
- Mass affects acceleration and turning (F=ma)

## Tech Stack

- **Frontend**: SolidJS (reactive UI)
- **Game Engine**: Phaser 3 (battle simulation)
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Development

```bash
pnpm install  # Setup
pnpm dev      # Run dev server
pnpm build    # Build for production
```

## Documentation

- `BATTLE.md` - Complete combat mechanics and formulas
- `DATA_ANALYSIS.md` - Statistical analysis of all modules and ships with gameplay insights
- `DATA_MODULES.md` - Complete module data tables grouped by category
- `DATA_SHIPS.md` - Complete ship data tables grouped by class
- `DATA_COMPARE.md` - Module statistics comparison tables
- `DATA_KEYS.md` - JSON field mappings
- `AGENTS.md` - Technical context for AI agents

## Credits

Based on the mobile game "Space Arena: Build & Fight" by HeroCraft Ltd.
Data sourced from the Space Arena Wiki (https://spacearena.fandom.com).
