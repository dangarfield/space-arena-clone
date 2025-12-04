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
// Wiki Formula for Penetrating Damage:
// Dmg(C1) = Damage - Armor(C1)
// Dmg(C2) = (Dmg(C1) × Pen × (1-AntiPen)) - Armor(C2)
// Dmg(Cn) = (Dmg(Cn-1) × Pen × (1-AntiPen)) - Armor(Cn)

// First module hit
rawDamage = baseDamage - moduleArmor
rawDamage = max(1, rawDamage)

// Ballistics ignore reflect (armor only)
finalDamage = rawDamage

// For subsequent modules (piercing)
if (penetratedModules > 0) {
  // Pen = penetration factor (from rp/rf)
  // AntiPen = anti-penetration (from ddo)
  finalDamage = previousDamage × Pen × (1 - AntiPen) - currentModuleArmor
  finalDamage = max(1, finalDamage)
}
```

**Key Insight from Wiki:**
- Ballistics use **armor only** (flat reduction)
- **Reflect does NOT affect ballistics**
- Penetration uses Pen × (1-AntiPen) formula
- "Ramp up mechanic" allows low damage ballistics to eventually destroy high armor

**Piercing Mechanics:**
- `rf` (Ricochet Factor): Maximum number of modules that can be penetrated (0-15)
- `rp` (Ricochet Power): Penetration strength (0-200)
- `ddo` (Damage Dropoff): Damage reduction per module (0-1, typically 0.2-0.5)
- Projectile continues through modules until:
  - Damage drops below 1
  - Maximum penetration depth (rf) reached
  - No more modules in path

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
- NOT YET IMPLEMENTED
- PDT range: ~10 blocks effective
- PDT fire rate: 10 shots/sec (0.1s cooldown)
- Kill chances: `pdmsc` (missiles), `pdmnc` (mines), `pdtc` (torpedoes)

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

## Ship Movement

### Engine System
**Thrust Calculation:**
```javascript
totalThrust = sum(engine.getThrustContribution() for all alive engines)
totalTurn = sum(engine.getTurnContribution() for all alive engines)

// Rotation
angleDiff = wrapAngle(angleToEnemy - ship.rotation)
turnAmount = angleDiff * totalTurn * shipTurnPower * turnMultiplier * dt
ship.rotation += turnAmount

// Forward movement (only if facing target within 45°)
if (abs(angleDiff) < PI/4) {
  acceleration = [cos(rotation), sin(rotation)] * totalThrust * thrustMultiplier * dt
  velocity += acceleration
}

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
- Facing threshold: 45° (π/4 radians)

**Ship Data Fields:**
- `ms`: Max speed
- `ts`: Turn power
- `ep` (engine module): Thrust power
- `ts` (engine module): Turn contribution

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
- Color: 0x00aaff (cyan), alpha 0.2
- Mechanics: NOT YET IMPLEMENTED

**Planned Mechanics:**
- Shields absorb damage before modules
- Shield edge proximity affects AOE damage to modules behind
- Regenerates over time when not taking damage
- Multiple shields can stack for layered defense

**Module Data Fields:**
- `sr`: Shield radius
- `sa`: Shield strength (hit points)
- `smr`: Max regeneration capacity
- `srs`: Regeneration speed

**Open Questions:**
- Do shields trigger ballistic DDO (count as module encounter)?
- How does AOE damage interact with shield edges?
- Can stacked shields limit piercing weapon effectiveness?

## Destruction Conditions
Ship is destroyed when:
- All weapons destroyed, OR
- All reactors destroyed

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

## Configurable Parameters (lil-gui)

### Battle View
- Show Module Icons
- Show Grid
- Show Firing Cones
- Show Direction Lines
- Show Shield Radius

### Battle Actions
- Enable Engines
- Enable Weapons

### Battle Variables
- Time Scale: 0-5 (default 0.1)
- Turn Speed: 0-0.1 (default 0.02)
- Thrust Speed: 0-0.001 (default 0.0001)
- Ballistic Speed: 0-200 (default 400)
- Missile Speed: 0-100 (default 30)
- Missile Launch Angle: 0-90° (default 30°)
- Missile Track Delay: 0-2s (default 0.2s)
- Missile Turn Rate: 0-0.2 (default 0.1)

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
- Target: Enemy ship (weapons choose random alive modules for missiles)

**Movement:**
- Rotate towards enemy
- Move forward when facing within 45°
- No evasion or advanced tactics

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

**Not Yet Implemented:**
- Point Defense Systems (PDT)
- Shield damage absorption
- Burst fire mechanics
- Reactor explosion on destruction
- Afterburner systems

## Data Sources
All combat values come from:
1. Module JSON files (`/data/modules/*.json`)
2. Ship JSON files (`/data/ships/*.json`)
3. Configurable GUI parameters
4. Community research and testing
5. Hardcoded constants (documented above)
