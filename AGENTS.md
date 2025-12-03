# Agent Context - Space Arena Clone

This document provides technical context for AI agents working on this project.

## Tech Stack

- **Framework**: SolidJS (reactive UI framework)
- **Game Engine**: Phaser 3 (for battle simulation)
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Language**: JavaScript (JSX for components)

## Project Structure

```
src/
├── components/          # SolidJS UI components
│   ├── MainMenu.jsx    # Main menu screen
│   ├── LevelSelect.jsx # Campaign level selection
│   ├── ShipSelect.jsx  # Ship selection screen
│   ├── PrepareScene.jsx # Ship builder (module placement)
│   └── BattleScene.jsx # Phaser battle simulation
├── data/               # Game data (JSON)
│   ├── ships/          # Individual ship files
│   │   ├── index.json  # Ship index
│   │   └── *.json      # Ship definitions
│   ├── weapons.json    # Weapon modules
│   ├── defense.json    # Defense modules
│   └── utility.json    # Utility modules
├── scenes/             # Phaser scenes
└── App.jsx             # Root component with scene routing

scripts/                # Data pipeline
├── download.js         # Scrape wiki pages
├── parse.js            # HTML → Markdown
└── convert.js          # Markdown → JSON
```

## Data Keys Reference

See `src/data/data-keys.json` and `DATA_KEYS.md` for complete field mappings.

### Ship Keys
- `sa` = Shield_Strength (NOT cells/slots)
- `lr` = Required_Level (unlock level)
- `ms` = Speed
- `ts` = Turn_Power
- `w`/`h` = Width/Height (grid dimensions)
- `g` = Grid array (0=empty, 1/2/3=device cells, 4=engine only, 5=both)

### Module Keys - Basic
- `name` = Module name (localization key like %ENGINE1X1%)
- `rl` = Required_Level (level needed to use)
- `w`/`h` = Width/Height (module size)
- `hlt` = Health
- `m` = Mass
- `a` = Armor
- `r` = Reflect (damage reflection %)
- `pu` = Power_Use
- `pg` = Power_Generation
- `cst` = Cost (credits)
- `hcst` = Celestium_Cost (premium currency)
- `Modification` = Upgrade tier (e.g., "Mk. II")
- `Visible` = Visibility flag

### Module Keys - Type/Category
- `i` = Module index (0-16, grouping identifier)
- `t` = Module type (3=Device, 4=Engine)
- `c` = Category flags (bit flags: 1=Ballistic, 2=Missile, 4=Laser, 8=Armor, 16=Shield, 32=PointDefense, 64=Engine, 128=Reactor, 256=Support)

### Module Keys - Weapon Stats
- `dmg` = Damage
- `rng` = Range
- `ats` = Instantaneous_Fire_Rate (attacks per second)
- `fc` = Fire_Cone (firing arc in degrees)
- `ss` = Shot_Spread (accuracy/dispersion, 0-10)
- `ip` = Impact_Power (armor penetration, 0-1000)
- `imf` = Impact_Force_Multiplier (penetration multiplier, 0-130)
- `rp` = Ricochet_Power (penetration depth, 0-200, ballistic only)
- `rf` = Ricochet_Factor (penetration layers, 0-15, ballistic only)
- `ddo` = Damage_Dropoff (damage reduction over distance)

### Module Keys - Laser Stats
- `msd` = Laser_Duration (beam duration in seconds)

### Module Keys - Missile Stats
- `mer` = Missile_Explosion_Radius
- `mc` = Missile_Count (projectiles per shot)
- `mef` = Missile_Explosion_Force
- `mlf` = Missile_Lifetime (flight time, constant 4.0)
- `mspd` = Missile_Speed
- `macc` = Missile_Accuracy (tracking strength)
- `mfj` = Missile_Fuel (tracking strength tiers: 25/65/90)

### Module Keys - Shield Stats
- `sr` = Shield_Radius
- `sa` = Shield_Strength (hit points)
- `smr` = Max_Regeneration (shield capacity)
- `srs` = Regen_Speed (regeneration rate)

### Module Keys - Engine Stats
- `ep` = Thrust_Power (forward thrust)
- `ts` = Turn_Power (rotation speed)

### Module Keys - Reactor Stats
- `er` = Reactor_Explosion_Radius (when destroyed)
- `ed` = Reactor_Explosion_Damage (when destroyed)

### Module Keys - Special Abilities
- `dur` = Afterburner_Duration (boost duration)
- `cd` = Cooldown (seconds between activations, Afterburner only)
- `mvmb` = Movement_Boost (speed multiplier, Afterburner only)
- `tb` = Thrust_Boost (acceleration boost, Afterburner only)
- `dc` = Duration_Charge (boost duration in seconds, Afterburner only)

### Module Keys - Point Defense Stats
- `pdr` = Point_Defense_Range (constant 19.0)
- `pdmsc` = PD_Missile_Intercept_Chance (0.35-0.6)
- `pdmnc` = PD_Mine_Intercept_Chance (0.2-0.5)
- `pdtc` = PD_Torpedo_Intercept_Chance (0.2-0.35)
- `pdd` = PD_Projectile_Damage (constant 0.1)


## Key Components

### FittingScene.jsx (Ship Builder)

**State:**
- `placedModules`: Array of placed modules
- `selectedModule`: Currently selected module for placement
- `hoverCell`: Preview of module placement (shows green/red overlay)
- `activeTab`: Current module category (weapons/defense/utility)
- `activeSubTab`: Current module subcategory (ballistic/laser/missile, etc.)

**Key Functions:**
- `canPlace(col, row, size, module)`: Validates module placement
  - Checks grid boundaries
  - Checks cell type ('D' for devices, 'E' for engines)
  - Checks for overlaps with existing modules
  - Returns boolean
- `handleModuleClick(module, type, color)`: Selects a module for placement
- `handleCellClick(col, row)`: Places selected module at position
- `handleCellHover(col, row)`: Updates hover preview
- `resources()`: Calculates power, cells, mass, armor totals
- `validate()`: Checks if ship config is valid for battle

**Placement Logic:**
- Click module → select it (highlighted blue)
- Hover over grid → see preview (green = valid, red = invalid)
- Click grid cell → place module
- Click placed module → remove it
- Engines can ONLY be placed on 'E' cells
- Other modules can ONLY be placed on 'D' cells

**Grid Rendering:**
- Grid uses CSS Grid with dynamic columns: `repeat(${width}, 1fr)`
- Grid scales to fit available space: `width: min(80vw, 80vh)`
- Cell size calculated dynamically: `cellSize = gridWidth / numColumns`
- Placed modules positioned absolutely with calculated pixel offsets

### ShipSelect.jsx

**Key Points:**
- Loads ships from `src/data/ships/index.json` then fetches individual ship files
- Filters ships by unlock level > 0
- Sorts by unlock level
- Grid preview calculated from `shape[0].length` (no `grid` property needed)

## Module Categories & Colors

- **Weapons**: Red (0xff4444)
  - Ballistic: guns, cannons
  - Laser: laser weapons
  - Missile: missiles, torpedoes, rockets
- **Defense**: Blue (0x4444ff)
  - Armor: armor modules
  - Shield: shield modules
- **Utility**: Yellow (0xffaa00)
  - Reactor: power generation
  - Engine: drives, thrusters (MUST be on 'E' cells)
  - Support: repair bays, point defense

## Common Patterns

### Parsing Module Size
```javascript
const parseSize = (sizeStr) => {
  if (!sizeStr) return { w: 1, h: 1 };
  const match = sizeStr.match(/(\d+)x(\d+)/);
  return match ? { w: parseInt(match[1]), h: parseInt(match[2]) } : { w: 1, h: 1 };
};
```

### Calculating Grid Dimensions
```javascript
const gridWidth = ship.shape?.[0]?.length || 6;
const gridHeight = ship.shape?.length || 5;
```

### Power Calculation
```javascript
// Generation (reactors have negative or "Power Generation" stat)
const generation = parseInt(module.stats['Power Generation'] || '0');
// Consumption (positive "Power Use" or "Power" stat)
const consumption = parseInt(module.stats['Power Use'] || module.stats.Power || '0');
```

## Important Rules

1. **Never add `grid` property to ship JSON files** - it's calculated from `shape`
2. **Engine placement validation** - engines only on 'E' cells, others only on 'D' cells
3. **Cell size is dynamic** - calculate from actual grid element width, not hardcoded
4. **Module colors are hex numbers** - 0xff4444, 0x4444ff, 0xffaa00 (not strings)
5. **SolidJS reactivity** - use signals with `()` to access values: `ship()`, `modules()`
6. **Grid coordinates** - (col, row) where col=x, row=y, 0-indexed from top-left

## Data Pipeline

```bash
pnpm run download  # Scrape wiki → data/raw/*.html
pnpm run parse     # HTML → data/parsed/*.md
pnpm run convert   # Markdown → src/data/*.json
```

**Note**: Ship shape arrays are manually created, not scraped from wiki.

## Current Implementation Status

**Working:**
- Main menu, level select, ship select screens
- Module inventory with filtering by category/subcategory
- Click-to-select module placement system
- Hover preview with validation (green/red)
- Resource tracking (power, cells, mass, armor)
- Cell type validation (D vs E cells)
- Dynamic grid scaling

**TODO:**
- Module rotation
- Save/load ship configurations
- Battle simulation
- Module destruction and effects
- Campaign progression
- Module unlocks

## Debugging Tips

- Check browser console for errors
- Use SolidJS DevTools for reactive state inspection
- Grid positioning issues: check `cellSize` calculation
- Placement validation: add console.logs in `canPlace()`
- Module not appearing: check if `stats.Size` is parsed correctly
