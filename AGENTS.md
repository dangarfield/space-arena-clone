# Agent Context - Space Arena Clone

**Purpose:** Technical reference for AI agents working on this codebase. Contains implementation details, file structure, code patterns, and current status.

**For gameplay mechanics and formulas, see BATTLE.md**

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

## Battle System Implementation

### BattleScene.js (Phaser 3)

**Core Systems:**
- Mass-based physics: `acceleration = thrust / totalMass`
- Damage ramping: 2%/sec increase after 30s
- Three weapon types: Ballistic, Laser, Missile
- Point defense interceptors
- Visual effects: Smoke trails, explosions, particles

**Key Methods:**
- `createBattleShip(config, pos, rotation)`: Instantiates ship with modules
- `updateShip(ship, enemy, dt)`: AI movement and weapon firing
- `updateProjectiles(dt)`: Ballistic/missile physics
- `updateLaserBeams()`: Continuous beam damage
- `checkCollision(projectile, ship)`: Hit detection
- `createExplosion(x, y, scale)`: Sprite-based explosion effect

**Visual Config:**
- All effects in `src/config/visual-effects.json`
- Per-module projectile sprites (e.g., `Ballistic1x1`, `RocketLauncher1x2`)
- Particle systems: missile trails, explosions, smoke
- Pellet counts: Defined per weapon in visual-effects.json
- Background layers: Parallax starfield with tint/alpha support

### Module Classes

**BaseModule.js:**
- `takeDamage(amount)`: Applies damage, updates health
- `onDestroy()`: Creates explosion/smoke effects, triggers reactor explosion if module is reactor
- `checkReactorExplosion()`: Grid-based damage to adjacent modules using Manhattan distance
  - Uses `er` (explosion radius in cells) and `ed` (explosion damage)
  - Only affects horizontal/vertical cells, not diagonal
  - Example: 2x2 reactor with er=2, ed=50 damages all modules within 2 cells (50 damage each)
- Health-based tinting: Green → Orange → Red → Black

**WeaponModule.js:**
- `fireBallistic()`: Creates projectile with sprite from config, supports pellets
- `fireLaser()`: Raycast beam with tick-based damage
- `fireMissile()`: Tracking projectile with acceleration and smoke trail
- `findTargetInCone()`: Targets closest entity (modules, junk, or mines)

**EngineModule.js:**
- `getThrustContribution()`: Returns `ep` if alive
- `getTurnContribution()`: Returns `ts` if alive

**AfterburnerModule.js:**
- `update(dt)`: Updates active/cooldown timers
- `activate()`: Applies speed/thrust multipliers to ship
- `deactivate()`: Removes multipliers, starts cooldown
- AI activates when distance > 300 or health < 30%

**RepairBayModule.js:**
- `update(dt)`: Checks for damaged modules every 0.5s
- `performRepair()`: Heals most damaged module
- Hardcoded: 2500 HP capacity per bay, 9 HP/s repair speed
- Max 3 repair bays active simultaneously
- Prioritizes modules with lowest health percentage

**PointDefenseModule.js:**
- `update(dt)`: Scans for missiles, mines, and junk in range
- `fireInterceptor(target)`: Creates PD projectile
- Priority: missiles → mines → junk

**JunkLauncherModule.js:**
- `fire()`: Launches debris with spread and staggered timing
- Junk has 15 HP, blocks enemy weapons
- Uses module `ss` field for spread, `mc` for count

**MineLauncherModule.js:**
- `fire()`: Deploys mines in 360° spread with staggered timing
- Mines explode on proximity to enemy modules (2 unit radius)
- Uses module `mc` for count, `mer`/`mef` for explosion

### Ship Hydration

**shipHydration.js:**
- Converts minimal config `{shipId, modules: [{moduleId, col, row}]}` to full config
- Loads ship data, module data, localization
- Attaches `module.key` for visual config lookup
- Returns `{ship, modules}` with all data populated

## Current Implementation Status

**Working:**
- UI: Main menu, level select, ship select, fitting scene
- Fitting: Click-to-place, validation, resource tracking
- Battle: Mass-based movement, all weapon types, damage ramping
- Shields: Damage absorption, regeneration, laser bypass
- Warp drive: Teleport mechanics with cooldown
- Effects: Projectile sprites, smoke trails, explosions
- Point defense: Missile interception
- Debug GUI: lil-gui with all parameters

**Implemented:**
- Junk Launcher: Fires debris that blocks weapons (15 HP each), uses `ss` for spread
- Mine Launcher: Deploys proximity mines (explode within 2 units of enemy modules)
- Point Defense: Intercepts missiles, mines, and junk (priority order)
- Weapon targeting: Targets closest entity (modules, junk, or mines) in firing cone
- Pellet system: Shotguns fire 5-8 pellets, junk fires multiple pieces (staggered timing)
- Explosions: Configurable sizes (module=0.05, mine=0.08, junk=0.03)
- Starfield parallax: 2-layer background with 9 image variants
- Active hangar persistence: Saves to localStorage
- Module filtering: Uses category bit flags (`c` field)
- Afterburner boost: Speed/thrust multipliers with cooldown, AI activates when distance > 300 or health < 30%
- Reactor explosions: Grid-based damage to adjacent modules (Manhattan distance, uses `er` and `ed` fields)
  - Only horizontal/vertical cells affected, not diagonal
  - Full damage to all modules in radius, no falloff
- Victory screen: HTML overlay with continue button, ships slow down after battle ends (95% friction)
- Repair bay healing: Heals damaged modules (2500 HP capacity per bay, 9 HP/s, max 3 active)
- Laser targeting: Retargets when current target (module/junk/mine) is destroyed

**Not Implemented:**
- Campaign progression
- Module unlocks by level

## Debugging Tips

**UI Issues:**
- Check browser console for errors
- Use SolidJS DevTools for reactive state
- Grid positioning: verify `cellSize` calculation
- Module placement: add logs in `canPlace()`

**Battle Issues:**
- Use lil-gui to adjust parameters in real-time
- Check `this.damageMultiplier` for ramping
- Verify `module.key` matches visual-effects.json keys
- Projectile not appearing: check sprite path in config
- Mass issues: log `totalMass` in movement calculation
