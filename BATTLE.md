# Battle System Design

## Implementation Checklist

### Phase 1: Core Infrastructure
- [x] Create BattleScene.jsx Phaser scene wrapper
- [x] Implement ship entity creation from config
- [x] Grid-to-world coordinate conversion
- [x] Module sprite rendering with proper positioning
- [x] Basic camera setup and arena bounds

### Phase 2: Movement & Physics
- [x] Ship movement system (velocity, acceleration)
- [x] Engine module thrust calculation
- [ ] Ship rotation based on turn power
- [ ] Collision boundaries
- [x] Basic AI: face enemy, maintain range

### Phase 3: Weapon Systems
- [x] Weapon cooldown timers
- [ ] Firing cone validation
- [x] Range checking
- [x] Ballistic weapon implementation
  - [x] Projectile creation and movement
  - [ ] Damage dropoff calculation
  - [x] Shot spread/accuracy
- [x] Laser weapon implementation
  - [x] Raycast hit detection
  - [x] Beam visual effects
  - [ ] Duration handling
- [x] Missile weapon implementation
  - [x] Guided tracking logic
  - [x] Fuel/tracking duration
  - [ ] Multiple missile spawning
  - [ ] Explosion radius damage

### Phase 4: Defense Systems
- [ ] Armor damage mitigation
- [ ] Penetration calculations (IP, IMF, RP, RF)
- [ ] Ricochet mechanics
- [ ] Shield module implementation
  - [ ] Shield bubble rendering
  - [ ] Damage absorption
  - [ ] Regeneration system
  - [ ] Coverage radius checking
- [ ] Point defense system
  - [ ] Projectile detection in range
  - [ ] Intercept chance calculations
  - [ ] Projectile destruction

### Phase 5: Damage & Destruction
- [x] Module health tracking
- [x] Collision detection (projectile vs module)
- [x] Damage application with armor/shield checks
- [x] Module destruction effects
- [ ] Reactor explosion chain reactions
- [x] Ship destruction detection
- [x] Victory/defeat conditions

### Phase 6: Visual Effects
- [ ] Muzzle flash particles
- [ ] Projectile trails
- [ ] Laser beam rendering
- [ ] Explosion effects (small, medium, large)
- [ ] Shield hit ripples
- [ ] Module damage smoke/sparks
- [ ] Screen shake on impacts
- [ ] Debris particles

### Phase 7: UI & Polish
- [ ] Module health bars (optional toggle)
- [ ] Shield strength indicators
- [ ] Battle timer
- [ ] Pause menu
- [ ] Victory/defeat screens
- [ ] Damage numbers (floating text)
- [ ] Sound effects
- [ ] Background music

### Phase 8: Optimization
- [ ] Object pooling for projectiles
- [ ] Spatial partitioning for collisions
- [ ] Update throttling for expensive checks
- [ ] Visual culling
- [ ] Performance profiling

## Overview

The battle system simulates real-time combat between two ships using Phaser 3. Ships are positioned on opposite sides of the arena, and their modules determine combat behavior. The battle continues until one ship is destroyed.

## Core Concepts

### Ship Representation

Each ship in battle consists of:
- **Hull**: Grid-based structure with positioned modules
- **Modules**: Individual components with health, each occupying grid cells
- **Center Point**: Ship's position in world space
- **Rotation**: Ship facing direction (player faces right, enemy faces left)

### Module Types & Combat Roles

#### Weapons (Red)
- **Ballistic Weapons**: Projectile-based, affected by armor penetration
  - Fire physical projectiles with travel time
  - `ip` (Impact Power): Armor penetration value (0-1000)
  - `imf` (Impact Force Multiplier): Penetration multiplier (0-130)
  - `rp` (Ricochet Power): Penetration depth for ballistic (0-200)
  - `rf` (Ricochet Factor): Number of armor layers penetrated (0-15)
  - `ddo` (Damage Dropoff): Damage reduction over distance
  - `ss` (Shot Spread): Accuracy/dispersion (0-10, lower = more accurate)

- **Laser Weapons**: Instant beam attacks
  - Instant hit detection (raycast)
  - `msd` (Laser Duration): Beam duration in seconds
  - Visual beam effect from weapon to target
  - No travel time, no dodging

- **Missile Weapons**: Guided projectiles
  - `mc` (Missile Count): Projectiles per shot
  - `mspd` (Missile Speed): Flight speed
  - `macc` (Missile Accuracy): Tracking strength
  - `mfj` (Missile Fuel): Tracking duration tiers (25/65/90)
  - `mlf` (Missile Lifetime): Flight time (constant 4.0s)
  - `mer` (Missile Explosion Radius): AoE damage radius
  - `mef` (Missile Explosion Force): Explosion damage multiplier

#### Defense (Blue)
- **Armor Modules**: Passive damage reduction
  - `a` (Armor): Damage reduction value
  - Reduces incoming damage based on penetration calculation
  - Must be destroyed before modules behind it take damage

- **Shield Modules**: Active energy barriers
  - `sr` (Shield Radius): Coverage area
  - `sa` (Shield Strength): Hit points
  - `smr` (Max Regeneration): Shield capacity
  - `srs` (Regen Speed): HP/second regeneration rate
  - Regenerates when not taking damage
  - Protects modules within radius

#### Utility (Yellow)
- **Reactors**: Power generation (required)
  - `pg` (Power Generation): Energy output
  - `er` (Reactor Explosion Radius): Damage radius when destroyed
  - `ed` (Reactor Explosion Damage): Explosion damage
  - Destroying reactor causes chain reaction damage

- **Engines**: Movement and rotation (required)
  - `ep` (Thrust Power): Forward acceleration
  - `ts` (Turn Power): Rotation speed
  - Determines ship maneuverability

- **Point Defense**: Anti-projectile systems
  - `pdr` (Point Defense Range): Intercept radius (constant 19.0)
  - `pdmsc` (PD Missile Intercept Chance): 0.35-0.6
  - `pdmnc` (PD Mine Intercept Chance): 0.2-0.5
  - `pdtc` (PD Torpedo Intercept Chance): 0.2-0.35
  - `pdd` (PD Projectile Damage): Damage to intercepted projectiles (0.1)
  - Automatically targets incoming projectiles

- **Support Modules**: Special abilities
  - Repair bays, afterburners, etc.
  - `dur` (Afterburner Duration): Boost duration
  - `cd` (Cooldown): Seconds between activations
  - `mvmb` (Movement Boost): Speed multiplier
  - `tb` (Thrust Boost): Acceleration boost

## Battle Flow

### 1. Initialization

```javascript
// Convert ship configuration to battle entities
const playerShip = createBattleShip(playerConfig, { x: 200, y: 400 }, 0);
const enemyShip = createBattleShip(enemyConfig, { x: 1000, y: 400 }, Math.PI);

// Create module sprites for each ship
playerShip.modules.forEach(module => {
  const worldPos = gridToWorld(module.col, module.row, playerShip);
  const sprite = createModuleSprite(worldPos, module);
  module.sprite = sprite;
});
```

### 2. Combat Loop (60 FPS)

#### Phase 1: AI Decision Making
```javascript
// Every ship evaluates targets and actions
updateAI(ship, enemyShip) {
  // Find valid weapon targets
  const weapons = ship.modules.filter(m => m.type === 'weapon' && m.health > 0);
  
  weapons.forEach(weapon => {
    // Check if weapon is in range
    const range = weapon.stats.rng;
    const distance = Phaser.Math.Distance.Between(ship.pos, enemyShip.pos);
    
    if (distance <= range) {
      // Check firing cone
      const angleToTarget = Phaser.Math.Angle.Between(ship.pos, enemyShip.pos);
      const weaponAngle = ship.rotation + weapon.mountAngle;
      const fireCone = weapon.stats.fc * (Math.PI / 180);
      
      if (Math.abs(angleToTarget - weaponAngle) <= fireCone / 2) {
        // Fire weapon if cooldown ready
        if (weapon.cooldownTimer <= 0) {
          fireWeapon(weapon, enemyShip);
          weapon.cooldownTimer = 1 / weapon.stats.ats; // attacks per second
        }
      }
    }
  });
  
  // Movement AI
  const engines = ship.modules.filter(m => m.category & 64 && m.health > 0);
  if (engines.length > 0) {
    // Calculate total thrust and turn power
    const totalThrust = engines.reduce((sum, e) => sum + e.stats.ep, 0);
    const totalTurn = engines.reduce((sum, e) => sum + e.stats.ts, 0);
    
    // Simple AI: maintain optimal range, face enemy
    const optimalRange = getOptimalWeaponRange(ship);
    if (distance > optimalRange) {
      ship.velocity.x += Math.cos(ship.rotation) * totalThrust * 0.01;
      ship.velocity.y += Math.sin(ship.rotation) * totalThrust * 0.01;
    }
    
    // Rotate to face enemy
    const targetAngle = angleToTarget;
    const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - ship.rotation);
    ship.rotation += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), totalTurn * 0.01);
  }
}
```

#### Phase 2: Projectile Updates
```javascript
updateProjectiles(delta) {
  projectiles.forEach(proj => {
    if (proj.type === 'ballistic') {
      // Simple physics
      proj.x += proj.velocity.x * delta;
      proj.y += proj.velocity.y * delta;
      
      // Apply damage dropoff
      proj.travelDistance += Phaser.Math.Distance.Between(
        proj.x - proj.velocity.x * delta, 
        proj.y - proj.velocity.y * delta,
        proj.x, 
        proj.y
      );
      const dropoff = proj.weapon.stats.ddo || 0;
      proj.currentDamage = proj.baseDamage * (1 - (proj.travelDistance / proj.weapon.stats.rng) * dropoff);
      
      // Check collision with enemy modules
      checkProjectileCollision(proj, enemyShip);
    }
    
    if (proj.type === 'missile') {
      // Guided tracking
      const target = proj.target;
      const fuel = proj.weapon.stats.mfj;
      
      if (proj.lifetime < fuel / 60) { // Convert to seconds
        // Calculate steering
        const angleToTarget = Phaser.Math.Angle.Between(proj, target);
        const accuracy = proj.weapon.stats.macc;
        const turnRate = accuracy * 0.1;
        
        proj.rotation = Phaser.Math.Angle.RotateTo(proj.rotation, angleToTarget, turnRate);
      }
      
      // Move forward
      const speed = proj.weapon.stats.mspd;
      proj.x += Math.cos(proj.rotation) * speed * delta;
      proj.y += Math.sin(proj.rotation) * speed * delta;
      
      proj.lifetime += delta;
      
      // Check collision or lifetime expiry
      if (proj.lifetime > proj.weapon.stats.mlf) {
        explodeMissile(proj);
      } else {
        checkProjectileCollision(proj, enemyShip);
      }
    }
    
    if (proj.type === 'laser') {
      // Instant raycast, just visual effect
      proj.duration -= delta;
      if (proj.duration <= 0) {
        proj.destroy();
      }
    }
  });
}
```

#### Phase 3: Point Defense
```javascript
updatePointDefense(ship) {
  const pdModules = ship.modules.filter(m => m.category & 32 && m.health > 0);
  
  pdModules.forEach(pd => {
    const pdRange = pd.stats.pdr || 19.0;
    const pdPos = gridToWorld(pd.col, pd.row, ship);
    
    // Find incoming projectiles
    const threats = projectiles.filter(proj => {
      if (proj.owner === ship) return false; // Don't shoot own projectiles
      
      const distance = Phaser.Math.Distance.Between(pdPos, proj);
      return distance <= pdRange;
    });
    
    threats.forEach(proj => {
      let interceptChance = 0;
      
      if (proj.type === 'missile') {
        interceptChance = pd.stats.pdmsc || 0.5;
      } else if (proj.type === 'ballistic') {
        interceptChance = pd.stats.pdtc || 0.3;
      }
      
      if (Math.random() < interceptChance * (1/60)) { // Per frame chance
        // Destroy projectile
        proj.health -= pd.stats.pdd || 0.1;
        if (proj.health <= 0) {
          proj.destroy();
          // Visual effect
          createExplosion(proj.x, proj.y, 10);
        }
      }
    });
  });
}
```

#### Phase 4: Shield Updates
```javascript
updateShields(ship, delta) {
  const shields = ship.modules.filter(m => m.category & 16 && m.health > 0);
  
  shields.forEach(shield => {
    const shieldPos = gridToWorld(shield.col, shield.row, ship);
    const radius = shield.stats.sr;
    
    // Regenerate if not recently hit
    if (shield.timeSinceHit > 2.0) {
      const regenRate = shield.stats.srs || 0;
      const maxRegen = shield.stats.smr || shield.stats.sa;
      shield.currentShield = Math.min(shield.currentShield + regenRate * delta, maxRegen);
    }
    
    shield.timeSinceHit += delta;
    
    // Visual shield bubble
    if (shield.currentShield > 0) {
      drawShieldBubble(shieldPos, radius, shield.currentShield / shield.stats.sa);
    }
  });
}
```

#### Phase 5: Damage Resolution
```javascript
checkProjectileCollision(projectile, targetShip) {
  // Check each module for collision
  targetShip.modules.forEach(module => {
    if (module.health <= 0) return;
    
    const moduleWorldPos = gridToWorld(module.col, module.row, targetShip);
    const moduleBounds = {
      x: moduleWorldPos.x,
      y: moduleWorldPos.y,
      width: module.size.w * CELL_SIZE,
      height: module.size.h * CELL_SIZE
    };
    
    if (Phaser.Geom.Rectangle.Contains(moduleBounds, projectile.x, projectile.y)) {
      // Check shield protection first
      const protectingShield = findProtectingShield(module, targetShip);
      
      if (protectingShield && protectingShield.currentShield > 0) {
        // Shield absorbs damage
        const damage = projectile.currentDamage || projectile.baseDamage;
        protectingShield.currentShield -= damage;
        protectingShield.timeSinceHit = 0;
        
        if (protectingShield.currentShield <= 0) {
          protectingShield.currentShield = 0;
          // Shield depleted visual effect
          createShieldBreakEffect(protectingShield);
        }
        
        projectile.destroy();
        return;
      }
      
      // Calculate armor mitigation
      let damage = projectile.currentDamage || projectile.baseDamage;
      
      if (projectile.type === 'ballistic') {
        const armor = module.stats.a || 0;
        const impactPower = projectile.weapon.stats.ip || 0;
        const impactMult = projectile.weapon.stats.imf || 100;
        
        // Penetration calculation
        const effectivePenetration = (impactPower * impactMult) / 100;
        const damageReduction = Math.max(0, armor - effectivePenetration) / armor;
        damage *= (1 - damageReduction * 0.5); // 50% max reduction
        
        // Ricochet check
        const ricochetPower = projectile.weapon.stats.rp || 0;
        const ricochetFactor = projectile.weapon.stats.rf || 0;
        
        if (armor > ricochetPower && Math.random() > ricochetFactor / 15) {
          // Ricochet - no damage
          createRicochetEffect(moduleWorldPos);
          projectile.destroy();
          return;
        }
      }
      
      // Apply damage
      module.health -= damage;
      
      // Visual feedback
      flashModule(module.sprite);
      createHitEffect(moduleWorldPos, projectile.type);
      
      if (module.health <= 0) {
        module.health = 0;
        destroyModule(module, targetShip);
      }
      
      // Missile explosion
      if (projectile.type === 'missile') {
        explodeMissile(projectile, targetShip);
      } else {
        projectile.destroy();
      }
    }
  });
}

function explodeMissile(missile, targetShip) {
  const radius = missile.weapon.stats.mer || 50;
  const force = missile.weapon.stats.mef || 1.0;
  const baseDamage = missile.baseDamage;
  
  // Find all modules in explosion radius
  targetShip.modules.forEach(module => {
    if (module.health <= 0) return;
    
    const modulePos = gridToWorld(module.col, module.row, targetShip);
    const distance = Phaser.Math.Distance.Between(missile, modulePos);
    
    if (distance <= radius) {
      // Falloff damage
      const falloff = 1 - (distance / radius);
      const damage = baseDamage * force * falloff;
      
      module.health -= damage;
      flashModule(module.sprite);
      
      if (module.health <= 0) {
        module.health = 0;
        destroyModule(module, targetShip);
      }
    }
  });
  
  // Visual explosion
  createExplosion(missile.x, missile.y, radius);
  missile.destroy();
}

function destroyModule(module, ship) {
  // Visual destruction
  createDebrisEffect(module.sprite);
  module.sprite.setAlpha(0.3);
  
  // Check for reactor explosion
  if (module.category & 128) { // Reactor
    const explosionRadius = module.stats.er || 0;
    const explosionDamage = module.stats.ed || 0;
    
    if (explosionRadius > 0 && explosionDamage > 0) {
      // Chain reaction damage to nearby modules
      ship.modules.forEach(other => {
        if (other === module || other.health <= 0) return;
        
        const modulePos = gridToWorld(module.col, module.row, ship);
        const otherPos = gridToWorld(other.col, other.row, ship);
        const distance = Phaser.Math.Distance.Between(modulePos, otherPos);
        
        if (distance <= explosionRadius) {
          const falloff = 1 - (distance / explosionRadius);
          other.health -= explosionDamage * falloff;
          
          if (other.health <= 0) {
            other.health = 0;
            destroyModule(other, ship);
          }
        }
      });
      
      createExplosion(modulePos.x, modulePos.y, explosionRadius);
    }
  }
  
  // Check if ship is destroyed
  checkShipDestruction(ship);
}
```

### 3. Victory Conditions

```javascript
function checkShipDestruction(ship) {
  // Ship is destroyed if all weapons are destroyed OR all reactors are destroyed
  const aliveWeapons = ship.modules.filter(m => m.type === 'weapon' && m.health > 0);
  const aliveReactors = ship.modules.filter(m => (m.category & 128) && m.health > 0);
  
  if (aliveWeapons.length === 0 || aliveReactors.length === 0) {
    ship.destroyed = true;
    
    // Massive explosion
    createShipExplosion(ship);
    
    // End battle
    if (ship === playerShip) {
      showDefeatScreen();
    } else {
      showVictoryScreen();
    }
  }
}
```

## Weapon Firing Implementation

### Ballistic Weapons
```javascript
function fireBallisticWeapon(weapon, weaponPos, targetShip, shipRotation) {
  const stats = weapon.stats;
  const spread = stats.ss || 0;
  const range = stats.rng;
  const damage = stats.dmg;
  const fireRate = stats.ats; // attacks per second
  
  // Calculate firing angle with spread
  const baseAngle = shipRotation + weapon.mountAngle;
  const spreadAngle = (Math.random() - 0.5) * spread * (Math.PI / 180);
  const finalAngle = baseAngle + spreadAngle;
  
  // Create projectile
  const projectile = {
    type: 'ballistic',
    x: weaponPos.x,
    y: weaponPos.y,
    rotation: finalAngle,
    velocity: {
      x: Math.cos(finalAngle) * 300, // pixels per second
      y: Math.sin(finalAngle) * 300
    },
    baseDamage: damage,
    currentDamage: damage,
    travelDistance: 0,
    weapon: weapon,
    owner: weapon.ship,
    sprite: createProjectileSprite('bullet', weaponPos, finalAngle)
  };
  
  projectiles.push(projectile);
  
  // Muzzle flash effect
  createMuzzleFlash(weaponPos, finalAngle);
  
  // Sound effect
  playSound('ballistic_fire');
}
```

### Laser Weapons
```javascript
function fireLaserWeapon(weapon, weaponPos, targetShip, shipRotation) {
  const stats = weapon.stats;
  const damage = stats.dmg;
  const duration = stats.msd || 0.5;
  const range = stats.rng;
  
  // Instant raycast
  const angle = shipRotation + weapon.mountAngle;
  const endX = weaponPos.x + Math.cos(angle) * range;
  const endY = weaponPos.y + Math.sin(angle) * range;
  
  // Find first module hit
  const hitModule = raycastToModules(weaponPos, { x: endX, y: endY }, targetShip);
  
  if (hitModule) {
    // Check shield
    const shield = findProtectingShield(hitModule, targetShip);
    if (shield && shield.currentShield > 0) {
      shield.currentShield -= damage;
      shield.timeSinceHit = 0;
    } else {
      hitModule.health -= damage;
      if (hitModule.health <= 0) {
        destroyModule(hitModule, targetShip);
      }
    }
    
    // Visual beam
    const hitPos = gridToWorld(hitModule.col, hitModule.row, targetShip);
    createLaserBeam(weaponPos, hitPos, duration);
  } else {
    // Beam extends to max range
    createLaserBeam(weaponPos, { x: endX, y: endY }, duration);
  }
  
  playSound('laser_fire');
}
```

### Missile Weapons
```javascript
function fireMissileWeapon(weapon, weaponPos, targetShip, shipRotation) {
  const stats = weapon.stats;
  const count = stats.mc || 1;
  const damage = stats.dmg;
  
  for (let i = 0; i < count; i++) {
    // Slight spread for multiple missiles
    const spreadAngle = (i - count / 2) * 0.1;
    const angle = shipRotation + weapon.mountAngle + spreadAngle;
    
    // Pick random target module
    const aliveModules = targetShip.modules.filter(m => m.health > 0);
    const target = aliveModules[Math.floor(Math.random() * aliveModules.length)];
    const targetPos = gridToWorld(target.col, target.row, targetShip);
    
    const missile = {
      type: 'missile',
      x: weaponPos.x,
      y: weaponPos.y,
      rotation: angle,
      baseDamage: damage,
      weapon: weapon,
      owner: weapon.ship,
      target: targetPos,
      lifetime: 0,
      health: 1.0, // Can be destroyed by point defense
      sprite: createProjectileSprite('missile', weaponPos, angle)
    };
    
    projectiles.push(missile);
  }
  
  playSound('missile_launch');
}
```

## Performance Considerations

- **Spatial Partitioning**: Use Phaser's physics groups for collision detection
- **Object Pooling**: Reuse projectile sprites instead of creating/destroying
- **Update Throttling**: Point defense checks every 3-5 frames, not every frame
- **Visual Culling**: Don't render effects outside camera bounds
- **Module Culling**: Skip destroyed modules in collision checks

## Visual Effects

- **Muzzle Flashes**: Particle emitters at weapon positions
- **Projectile Trails**: Line renderers or particle trails
- **Laser Beams**: Graphics objects with glow shader
- **Explosions**: Particle bursts with screen shake
- **Shield Hits**: Ripple effect at impact point
- **Module Damage**: Smoke particles, sparks, color tinting
- **Ship Destruction**: Large explosion, debris scatter, fade out

## UI Elements

- **Health Bars**: Per-module health indicators (optional, toggle)
- **Shield Indicators**: Bubble visualization with opacity based on strength
- **Power Status**: Show if ship is power-starved
- **Weapon Cooldowns**: Visual indicators on weapon modules
- **Battle Timer**: Track battle duration
- **Damage Numbers**: Floating text showing damage dealt (optional)

## Future Enhancements

- **Special Abilities**: Afterburner, repair bay activation
- **Environmental Hazards**: Asteroids, mines, debris fields
- **Multiple Enemies**: Fleet battles with 3+ ships
- **Formations**: Squadron tactics and positioning
- **Boarding Actions**: Capture enemy ships
- **Campaign Progression**: Unlock new modules, upgrade existing ones
