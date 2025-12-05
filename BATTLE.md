# Battle System Documentation

## Overview
This document describes all calculations, formulas, and hardcoded values in the battle system.

**Based on community research:** https://www.reddit.com/r/SpaceArena/comments/8n004n/

## Core Principles
1. **Damage Floor**: Minimum 1 damage per hit (never 0 or negative)
2. **Armor Interaction**: Different per weapon type
3. **Module-Based Calculations**: Effects apply per module, not per distance
4. **Reflect**: Reduces incoming damage (1 - reflect%)
5. **Power Efficiency**: DPS/Square includes power requirements

## Coordinate System
- **Phaser Standard**: 0° = RIGHT (east)
- **Ship Design**: Ships point UP in local space
- **Container Offset**: +90° rotation applied to align visuals with physics
- **Grid Cell Size**: 1 unit = 1 pixel

## Weapon Systems

### Ballistic Weapons
**Projectile Properties:**
- Visual Size: 0.2 radius circle
- Color: 0xffff00 (yellow)
- Speed: Configurable (default 400 units/s)
- Inherits ship velocity: NO
- Hit Chance: 100% (only affected by shot spread)

**Damage Calculation (Per Module Hit):**
```javascript
// First module hit
damage = baseDamage - moduleArmor
damage = max(1, damage)

// For subsequent modules (after penetrating)
if (penetratedModules > 0) {
  damageMultiplier = max(0.25, ddo) // Minimum 25% damage retained
  damage = previousDamage * damageMultiplier - moduleArmor
  damage = max(1, damage)
}

// Ballistics ignore reflect (armor only)
```

**Penetration Mechanics:**
```javascript
// Max modules that can be penetrated
maxPenetration = ceil(rp / 4)

// After each hit, check if projectile continues
penetrationChance = min(1.0, rp / ip)
willPenetrate = random() < penetrationChance

// Stop if:
// - penetratedModules >= maxPenetration, OR
// - failed penetration chance
```

**Key Insights:**
- Ballistics use **armor only** (flat reduction)
- **Reflect does NOT affect ballistics**
- Penetration is probabilistic based on `rp/ip` ratio
- Damage retained on penetration: `max(0.25, ddo)` (minimum 25%)

**Piercing Mechanics:**
- `rf` (Ricochet Factor): Max modules that can be penetrated (0-30)
- `rp` (Ricochet Power): Penetration strength (0-3500)
- `ip` (Impact Power): Armor penetration resistance (0-8500)
- `ddo` (Damage Dropoff): Damage multiplier on penetration (0-1)
- `imf` (Impact Force Multiplier): UNUSED (legacy field)

**Penetration Formula:**
- Max penetration depth: `ceil(rf / 4)` modules
- Penetration chance per hit: `min(1.0, rp / ip)`
- Damage on subsequent hits: `previousDamage * max(0.25, ddo) - armor`

**Examples:**
- **Chaingun** (`rf=0`, `rp=0`, `ip=10`): No penetration
- **Vulcan Cannon** (`rf=2`, `rp=10`, `ip=100`): 10% chance, max 1 module (ceil(2/4))
- **Quantum Rifle** (`rf=15`, `rp=100`, `ip=250`, `ddo=0.55`): 40% chance, max 4 modules (ceil(15/4)), 55% damage retained
- **Capital Cannon** (`rf=30`, `rp=3500`, `ip=8500`, `ddo=0.45`): 41% chance, max 8 modules (ceil(30/4)), 45% damage retained

**Module Data Fields:**
- `dmg`: Base damage per projectile
- `rng`: Maximum range
- `ats`: Instantaneous fire rate (attacks per second)
- `ss`: Shot spread in degrees (0-10, lower = more accurate)
- `ip`: Impact power (armor penetration 0-1000) - UNUSED in current implementation
- `imf`: Impact force multiplier (0-130) - UNUSED in current implementation
- `rp`: Ricochet power (penetration strength 0-200)
- `rf`: Ricochet factor (max modules penetrated 0-15)
- `ddo`: Damage dropoff per module (0-1)

### Laser Weapons
**Beam Properties:**
- Visual Width: 0.6 units (configurable)
- Color: 0xff0000 (red)
- Hit Detection: Instant raycast
- Travel Time: None (instant)
- Damage Application: Continuous over duration

**Damage Calculation:**
```javascript
// Wiki Formula:
// Maximum Laser DPS = (Laser Damage × (100-Reflect)%) × Duration ÷ (Duration + 1/FireRate)

// Laser damage is DPS, not per-shot
totalDamage = dmg * duration

// Apply per tick (assuming 60fps)
ticksPerSecond = 60
totalTicks = duration * ticksPerSecond
damagePerTick = totalDamage / totalTicks

// Each tick applies damage with reflect only (NO ARMOR)
tickDamage = damagePerTick * (1 - moduleReflect)
tickDamage = max(1, tickDamage)  // Damage floor

// Total damage over duration
finalDamage = tickDamage * totalTicks
```

**Key Insights from Wiki:**
- `dmg` field represents damage over full duration
- **Lasers completely bypass shields**
- **Lasers are NOT affected by armor parameter**
- **Reflect reduces laser damage** (60% reflect = 40% damage taken)
- Longer duration = more total damage
- Can destroy multiple modules in sequence during single beam
- Reload starts AFTER firing completes (not during)

**Module Data Fields:**
- `dmg`: Damage per second (DPS)
- `rng`: Maximum range
- `ats`: Fire rate (attacks per second)
- `fc`: Firing cone in degrees
- `msd`: Beam duration in seconds (default 0.1s)
- Cooldown starts at beginning of shot, not end

### Missile Weapons
**Projectile Properties:**
- Visual Size: Triangle (0.28w x 0.4h units)
- Color: 0xff6600 (orange)
- Speed: From module data `mspd` (blocks/sec)
- Inherits ship velocity: YES
- Launch Angle: ±30° from ship heading (configurable)
- Tracking Delay: 0.2s before guidance activates (configurable)
- Turn Rate: Based on `macc` (configurable)

**Movement Calculation:**
```javascript
// Before tracking delay
position += velocity * dt

// After tracking delay (with fuel)
angleToTarget = atan2(target.y - missile.y, target.x - missile.x)

// MACC is inverse - higher values = less accurate
// Typical range: 160-220 (220 = less accurate)
normalizedAccuracy = 1 - (macc / 300)  // Convert to 0-1 scale
turnRate = normalizedAccuracy * baseTurnRate * (dt / 0.016)
rotation = rotateTowards(rotation, angleToTarget, turnRate)

// Total velocity
thrustVelocity = [cos(rotation) * speed, sin(rotation) * speed]
totalVelocity = thrustVelocity + inheritedShipVelocity
position += totalVelocity * dt
```

**Damage Calculation:**
```javascript
if (explosionRadius > 0) {
  // AoE damage - affects multiple modules
  // CRITICAL: Each cell of a multi-cell module takes full damage
  // Example: 3x3 armor (9 cells) × 30 damage = 270 total damage
  
  for each module in radius:
    distance = distanceToExplosion(module)
    if (distance <= explosionRadius) {
      falloff = 1 - (distance / explosionRadius)
      damagePerCell = baseDamage * explosionForce * falloff
      
      // Apply armor (flat reduction)
      damagePerCell = damagePerCell - moduleArmor
      damagePerCell = max(1, damagePerCell)
      
      // Missiles ignore reflect (not affected)
      
      // Total damage = damage per cell × number of cells
      totalDamage = damagePerCell * (moduleWidth × moduleHeight)
      
      module.takeDamage(totalDamage)
    }
} else {
  // Direct hit (no explosion)
  rawDamage = baseDamage - moduleArmor
  rawDamage = max(1, rawDamage)
  
  module.takeDamage(rawDamage)
}
```

**Key Insight from Wiki:**
- Missiles are most effective against armor because:
  1. High individual damage not heavily impacted by armor
  2. Blast radius hits multiple cells of same module
  3. A 30 damage missile hitting all 9 cells of 3x3 armor = 270 damage total
  4. **Missiles ignore reflect parameter**

**Point Defense Interaction:**
- PD fires orange-tinted missile sprites at incoming projectiles
- Range: 19 units (from `pdr` field)
- Speed: 50 units/sec
- Intercept chances: `pdmsc` (missiles), `pdmnc` (mines), `pdtc` (torpedoes)
- Also intercepts ballistics (30% chance in implementation)
- Targets enemy junk and mines (priority: missiles → mines → junk)

**Module Data Fields:**
- `dmg`: Base damage
- `rng`: Maximum range
- `ats`: Fire rate (attacks per second)
- `mc`: Missile count per shot
- `mspd`: Flight speed (blocks/second)
- `macc`: Missile accuracy (160-220, higher = less accurate, INVERSE)
- `mfj`: Fuel for tracking duration (25/65/90 tiers)
- `mlf`: Maximum lifetime (constant 4.0s)
- `mer`: Explosion radius (0 = direct hit only)
- `mef`: Explosion force multiplier

### Junk Launcher
**Projectile Properties:**
- Visual: Debris sprites with random rotation
- Health: 15 HP per piece
- Speed: Random variation (70-130% of base)
- Spread: Uses module `ss` field (typically 10 for wide spread)
- Deceleration: Slows to a stop near launch point

**Mechanics:**
```javascript
// Fires multiple pieces with staggered timing (0-200ms)
// Each piece blocks enemy weapons until destroyed
// Ballistics: Must deal 15 damage to destroy
// Missiles: Destroyed on contact (15+ damage)
// Lasers: Can be distracted/redirected
// Point Defense: Can target and destroy junk
```

**Module Data Fields:**
- `mc`: Junk count per shot
- `ss`: Shot spread (0-10, higher = wider spread)
- `ats`: Fire rate

### Mine Launcher
**Projectile Properties:**
- Visual: Mine sprites with random rotation
- Explosion: Damages all modules in radius
- Speed: Random variation, decelerates to stop
- Launch: 360° spread (all directions)
- Collision: Explodes within 2 units of enemy module

**Mechanics:**
```javascript
// Fires mines in all directions with staggered timing (0-100ms)
// Mines decelerate and spin in place
// Explode on proximity to enemy modules (2 unit radius)
// Explosion damages all modules in blast radius
// Point Defense: Can intercept mines
```

**Module Data Fields:**
- `mc`: Mine count per shot
- `mer`: Explosion radius
- `mef`: Explosion force multiplier
- `ats`: Fire rate

## Ship Movement

### Engine System
**Thrust Calculation:**
```javascript
totalThrust = sum(engine.getThrustContribution() for all alive engines)
totalTurn = sum(engine.getTurnContribution() for all alive engines)
totalMass = sum(module.m for all modules)

// Rotation (factoring in mass for rotational inertia)
angleDiff = wrapAngle(angleToEnemy - ship.rotation)
turnAcceleration = (totalTurn * shipTurnPower) / totalMass
turnAmount = angleDiff * turnAcceleration * turnMultiplier * dt
ship.rotation += turnAmount

// Forward movement (only if facing target within 45°)
if (abs(angleDiff) < PI/4) {
  acceleration = totalThrust / totalMass  // F = ma
  velocity += [cos(rotation), sin(rotation)] * acceleration * thrustMultiplier * dt
}

// Lateral strafe (30% of forward thrust)
if (strafeDirection) {
  acceleration = totalThrust / totalMass
  perpAngle = rotation + PI/2
  velocity += [cos(perpAngle), sin(perpAngle)] * strafeDirection * acceleration * 0.3 * thrustMultiplier * dt
}

// Velocity damping (friction)
velocity *= velocityDamping  // default 0.98

// Speed cap
currentSpeed = length(velocity)
if (currentSpeed > maxSpeed) {
  velocity = normalize(velocity) * maxSpeed
}

// Apply
position += velocity * dt
```

**Hardcoded Multipliers:**
- `turnMultiplier`: 0.02 (configurable)
- `thrustMultiplier`: 0.0001 (configurable)
- `velocityDamping`: 0.98 (configurable)
- Facing threshold: 45° (π/4 radians)
- Strafe strength: 30% of forward thrust

**Ship Data Fields:**
- `ms`: Max speed
- `ts`: Turn power
- `ep` (engine module): Thrust power
- `ts` (engine module): Turn contribution
- `m` (all modules): Mass (affects acceleration)

## Collision Detection

### Hitbox System
- Modules use rectangular bounds
- Size: `moduleWidth * CELL_SIZE` x `moduleHeight * CELL_SIZE`
- Position: Module world position (center)
- Sorting: Modules checked closest-first to ensure front hits register

### Raycast (Lasers)
```javascript
ray = line from weapon to maxRange
for each module:
  intersectionPoints = getLineToRectangle(ray, moduleBounds)
  if intersects:
    distance = distanceToFirstIntersectionPoint
    track closest module by intersection distance
```

### Point Collision (Ballistics/Missiles)
```javascript
for each module sorted by distance:
  if rectangleContains(moduleBounds, projectile.position):
    return module
```

## Weapon Effectiveness Summary

**Against Armor:**
- **Missiles**: MOST EFFECTIVE
  - High damage not heavily reduced by armor
  - Blast radius hits multiple cells (3x3 = 9× damage)
  - Ignore reflect parameter
- **Ballistics**: MODERATE
  - Armor reduces damage (flat reduction)
  - Can penetrate multiple modules
  - "Ramp up mechanic" helps low damage weapons
- **Lasers**: LEAST EFFECTIVE
  - Heavily reduced by reflect (60% reflect = 60% reduction)
  - No armor interaction (bypasses armor stat)
  - Continuous damage over duration

**Against Shields:**
- **Ballistics**: MOST EFFECTIVE
  - Full damage to shields
- **Missiles**: WEAK
  - Vulnerable to point defense
  - Shields block missiles
- **Lasers**: BYPASS COMPLETELY
  - Lasers completely ignore shields
  - Go straight to modules behind

## Shield System

**Properties:**
- Visual: Circle with radius from module data
- Color: 0x4444ff (blue), alpha based on strength
- Blocks ballistics and missiles, bypassed by lasers

**Mechanics:**
```javascript
// Shield absorbs damage before module health
if (shield.currentShield > 0) {
  damage = damage - shield.armor  // Shields have armor stat
  damage = max(1, damage)
  shield.currentShield -= damage
  
  if (shield.currentShield < 0) {
    // Excess damage goes to shield module
    excessDamage = -shield.currentShield
    shield.currentShield = 0
    module.takeDamage(excessDamage)
  }
}

// Regeneration after 2s without damage
if (timeSinceLastHit >= 2.0 && currentShield < regenCapacity) {
  currentShield += regenSpeed * dt
  currentShield = min(regenCapacity, currentShield)
}
```

**Module Data Fields:**
- `sr`: Shield radius
- `sa`: Shield strength (initial HP)
- `smr`: Max regeneration capacity (can't regen above this)
- `srs`: Regeneration speed (HP/sec)
- `a`: Armor (shields have hidden armor values)

**Key Behaviors:**
- Lasers completely bypass shields (raycast directly to modules)
- Ballistics and missiles blocked if projectile position is within shield radius
- Only one shield takes damage even if multiple overlap
- Shield opacity reflects current strength
- Shields regenerate after 2s delay without taking damage
- Regen capacity limits total regeneration (not infinite)

## Afterburner System

**Properties:**
- Speed multiplier: `mvmb` field (typically 2x)
- Thrust multiplier: `tb` field (typically 1.5x)
- Duration: `dur` or `dc` field (seconds)
- Cooldown: `cd` field (seconds between uses)

**Mechanics:**
```javascript
// When activated
ship.speedMultiplier *= afterburner.movementBoost
ship.thrustMultiplier *= afterburner.thrustBoost

// Applied to all movement
velocity += thrust * thrustMultiplier * dt

// Deactivates after duration expires
// Cooldown starts after deactivation
```

**AI Behavior:**
- Activates when distance > 300 units from enemy
- Activates when ship health < 30%
- Visual feedback: Orange tint on afterburner module

**Module Data Fields:**
- `mvmb`: Movement boost multiplier (speed)
- `tb`: Thrust boost multiplier (acceleration)
- `dur` or `dc`: Duration in seconds
- `cd`: Cooldown in seconds

## Reactor Explosion System

**Properties:**
- Explosion radius: `er` field (grid cells, Manhattan distance)
- Explosion damage: `ed` field (damage amount)

**Mechanics:**
```javascript
// Grid-based distance (Manhattan distance)
// Only horizontal/vertical, not diagonal
for each reactor cell (col, row):
  for each module cell (moduleCol, moduleRow):
    // Calculate Manhattan distance
    if (sameColumn):
      distance = abs(verticalDiff)
    else if (sameRow):
      distance = abs(horizontalDiff)
    else:
      distance = abs(horizontalDiff) + abs(verticalDiff)

    if (distance <= explosionRadius):
      module.takeDamage(explosionDamage) // Full damage, no falloff
```

**Key Behaviors:**
- Triggered when reactor module is destroyed
- Uses Manhattan distance (horizontal + vertical cells)
- Diagonal cells NOT affected (must be in straight line)
- Full damage to all modules in radius (no falloff)
- Only affects modules on same ship
- Each cell of multi-cell reactor checks independently

**Example:**
- 2x2 reactor with `er=2`, `ed=50`
- Reactor occupies cells (5,5), (6,5), (5,6), (6,6)
- Module at (8,5): distance from (6,5) = 2 cells → takes 50 damage
- Module at (5,8): distance from (5,6) = 2 cells → takes 50 damage
- Module at (8,8): distance from (6,6) = 4 cells (2+2) → no damage if er=2

**Module Data Fields:**
- `er`: Explosion radius in grid cells (0-5 typical range)
- `ed`: Explosion damage (50-200 typical range)
- Only reactor modules have these fields

## Repair Bay System

**Properties (Hardcoded per Wiki):**
- Repair capacity: 2500 HP per bay (total it can repair before depleted)
- Repair speed: 9 HP/s per bay
- Max active bays: 3 (only first 3 repair bays work)
- Repair interval: 0.5s (checks for repairs twice per second)

**Mechanics:**
```javascript
// Only first 3 alive repair bays are active
activeRepairBays = repairBays.slice(0, 3)

// Each bay independently:
// Find damaged modules (alive but not at full health)
damagedModules = ship.modules.filter(m => m.alive && m.health < m.maxHealth)

// Sort by health percentage (lowest first)
damagedModules.sort((a, b) => (a.health/a.maxHealth) - (b.health/b.maxHealth))

// Repair most damaged module
repairAmount = min(
  9 * interval,  // 9 HP/s * 0.5s = 4.5 HP per check
  maxHealth - currentHealth,
  remainingCapacity
)

module.health += repairAmount
remainingCapacity -= repairAmount
```

**Behavior:**
- Each bay heals most damaged module first (by health %)
- Each bay has independent 2500 HP capacity
- Multiple bays can heal same module simultaneously (stacks)
- Does not repair destroyed modules (alive=false)
- Continuous healing during battle
- 4th+ repair bays are inactive (wiki limit)

## Destruction Conditions
Ship is destroyed when:
- All weapons destroyed, OR
- All reactors destroyed

**Post-Battle:**
- Weapons stop firing
- Ships gradually slow down (95% friction per frame)
- Victory/defeat screen appears (HTML overlay)
- Continue button returns to hangar

## Time Scale System
**Implementation:**
```javascript
realDt = delta / 1000  // Real time in seconds
scaledDt = realDt * timeScale  // Scaled for gameplay

// All movement, rotation, and projectile updates use scaledDt
// Turn rates normalized to 60fps baseline for consistency
```

**Effect:**
- timeScale = 0.1: 10% speed (slow motion)
- timeScale = 1.0: Normal speed
- timeScale = 5.0: 5x speed
- Trajectories remain identical regardless of scale

## Camera System
**Behavior:**
- Tracks center point between both ships
- Zoom adjusts to keep both ships in view
- No boundaries (free movement)

**Calculation:**
```javascript
centerX = (playerShip.x + enemyShip.x) / 2
centerY = (playerShip.y + enemyShip.y) / 2

distance = distanceBetween(playerShip, enemyShip)
padding = 50
requiredSize = distance + padding

zoomX = cameraWidth / requiredSize
zoomY = cameraHeight / requiredSize
zoom = min(zoomX, zoomY) * 2  // 2x multiplier

camera.scrollX = centerX - cameraWidth / 2
camera.scrollY = centerY - cameraHeight / 2
```

## Damage Ramping System

**Mechanic:**
- After 30 seconds of battle, all damage increases by 2% per second
- Applies to all damage types (ballistic, laser, missile)
- Prevents stalemates between heavily armored ships

**Formula:**
```javascript
if (battleTime > 30) {
  damageMultiplier = 1.0 + ((battleTime - 30) * 0.02)
} else {
  damageMultiplier = 1.0
}

finalDamage = baseDamage * damageMultiplier
```

**Examples:**
- 30s: 1.0× damage (100%)
- 40s: 1.2× damage (120%)
- 60s: 1.6× damage (160%)
- 90s: 2.2× damage (220%)

## Visual Effects

**Projectile Sprites:**
- Ballistics: `/images/projectiles/bullet-*.png` (per module key)
- Missiles: `/images/projectiles/missile-*.png` (per module key)
- Point Defense: `/images/projectiles/missile-01.png` (orange tint)
- Junk: `/images/projectiles/junk-*.png` (random debris)
- Mines: `/images/projectiles/mine-*.png` (proximity mines)

**Particle Effects:**
- Missile trails: `smoke.png` spritesheet (5×5 grid, 25 frames)
- Explosions: `explosion.png` spritesheet (14 frames, 32×32)
- Smoke clouds: `smoke.png` animation on module destruction

**Pellet System:**
- Shotguns fire 5-8 pellets with staggered timing (0-100ms)
- Junk launcher fires multiple pieces with staggered timing (0-200ms)
- Damage divided among pellets for balance
- Spread uses module `ss` field

**Background:**
- 2-layer parallax starfield
- Layer 0: Background image with tint and alpha (0.4)
- Scales inversely with camera zoom
- 9 background variants (blue/green/purple)

**Config:** All visual settings in `src/config/visual-effects.json`

## Configurable Parameters (lil-gui)

### Battle View
- Show Module Icons
- Show Grid
- Show Firing Cones
- Show Direction Lines
- Show Shield Radius
- Debug Modules (off by default)

### Battle Actions
- Enable Engines
- Enable Weapons

### Battle Variables
- Time Scale: 0.1-10 (default 1.0)
- Turn Speed: 0-0.1 (default 0.02)
- Thrust Speed: 0-0.001 (default 0.0001)
- Velocity Damping: 0.9-1.0 (default 0.98)
- Engagement Range: 0.1-1.0 (default 0.7)
- Ballistic Speed: 0-200 (default 400)
- Missile Speed: 0-100 (default 30)
- Missile Launch Angle: 0-90° (default 30°)
- Missile Track Delay: 0-2s (default 0.5s)
- Missile Turn Rate: 0-0.2 (default 0.05)
- Missile Damage Factor: 0.1-2.0 (default 0.1)
- Laser Beam Width: 0.1-5 (default 0.1)

### Battle Stats (Read-Only)
- Battle Time (seconds)
- Damage Multiplier (1.0-5.0)

## Module Health System
**Visual Indicators:**
- Green: >50% health
- Orange: 25-50% health
- Red: <25% health
- Black: Destroyed (0% health)

**Damage Flash:**
- Duration: 100ms
- Alpha: 0.5 during flash

## AI Behavior
**Weapon Targeting:**
- Fire when: distance <= weapon.range AND cooldown ready
- Target: Closest entity in firing cone (modules, junk, or mines)
- Weapons prioritize closest target regardless of type

**Movement:**
- Rotate towards enemy
- Move forward when facing within 45°
- Deadzone: 0.8-1.2x engagement range (reduced chasing)
- Thrust: 70% strength (was 100%)
- Lateral strafing: Every 2s, 30% strength

## Community Research Integration

This implementation is based on extensive community research:
- **Primary Source**: https://www.reddit.com/r/SpaceArena/comments/8n004n/
- **Data Analysis**: https://pastebin.com/sS5Fi56P
- **Discussion Thread**: https://www.reddit.com/r/SpaceArena/comments/7xg1t4/

**Key Findings Implemented:**
1. Damage floor of 1 (never 0 or negative)
2. Laser damage = DPS * Duration
3. Armor applies per damage tick for lasers
4. Ballistic DDO is per-module, not per-distance
5. Missile MACC is inverse (higher = less accurate)
6. Reflect reduces damage after armor calculation

**Implemented:**
- Mass-based movement physics
- Damage ramping after 30s (2%/sec increase)
- Shield damage absorption and regeneration (2s delay)
- Warp drive teleport mechanics
- Missile smoke trails and explosions
- Module destruction effects (explosions, smoke)
- Point defense interceptors (missiles, mines, junk)
- Per-module visual configs (projectiles, effects)
- Junk launcher (debris blocking, 15 HP each)
- Mine launcher (proximity mines, 2 unit trigger radius)
- Pellet system (shotguns 5-8 pellets, junk multiple pieces)
- Weapon targeting (modules, junk, mines in firing cone)
- Laser retargeting (when current target destroyed)
- Starfield parallax background (2 layers, 9 variants)
- Afterburner boost (speed/thrust multipliers with cooldown, AI activation)
- Reactor explosions (Manhattan distance, horizontal/vertical only, full damage in radius)
- Victory/defeat screen (HTML overlay with continue button, 95% friction slowdown)
- Repair bay healing (2500 HP/bay, 9 HP/s, max 3 active, prioritizes lowest health %)

**Not Implemented:**
- Burst fire mechanics

## Data Sources
All combat values come from:
1. Module JSON files (`/data/modules/*.json`)
2. Ship JSON files (`/data/ships/*.json`)
3. Configurable GUI parameters
4. Community research and testing
5. Hardcoded constants (documented above)
