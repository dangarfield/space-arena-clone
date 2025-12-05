# Module Data Comparison

Complete comparison of all module types with localized names and key statistics.

## Ballistic Weapons (c=1)

| Display Name | Data Name | Mod | Size | dmg | ats | rng | ss | ip | imf | rp | rf | ddo |
|--------------|-----------|-----|------|-----|-----|-----|----|----|-----|----|----|-----|
| Chaingun | BALLISTIC1X1 |  | 1x1 | 4 | 0.3 | 35 | 7 | 10 | 10 | 0 | 0 | 0 |
| Chaingun | BALLISTIC1X1 | Mk.II | 1x1 | 4 | 1.0 | 35 | 7 | 10 | 10 | 0 | 0 | 0 |
| Vulcan Cannon | BALLISTIC1X2 |  | 1x2 | 5 | 0.3 | 40 | 7 | 100 | 20 | 10 | 2 | 0 |
| Railgun | BALLISTIC1X3 |  | 1x3 | 19 | 2.5 | 65 | 5 | 1000 | 130 | 200 | 10 | 0 |
| Railgun | BALLISTIC1X3 | Mk.II | 1x3 | 31 | 2.5 | 75 | 5 | 1000 | 130 | 200 | 10 | 0 |
| Gauss Rifle | BALLISTIC1X5 |  | 1x5 | 37 | 3.0 | 95 | 5 | 1500 | 200 | 200 | 20 | 0 |
| Mass Driver | BALLISTIC2X3 |  | 2x3 | 7 | 0.2 | 50 | 7 | 100 | 25 | 10 | 10 | 0 |
| Mass Driver | BALLISTIC2X3 | Mk.II | 2x3 | 8 | 0.2 | 70 | 2 | 100 | 25 | 10 | 10 | 0 |
| Hyperion Chaingun | BALLISTIC2X4 |  | 2x4 | 9 | 0.05 | 60 | 7 | 40 | 30 | 10 | 8 | 0 |
| Capital Cannon | BALLISTIC2X7 |  | 2x7 | 75 | 3.5 | 120 | 5 | 8500 | 500 | 3500 | 30 | 0.45 |
| Capital Cannon | BALLISTIC2X7 | Mk.II | 2x7 | 81 | 3.1 | 120 | 5 | 8500 | 500 | 3500 | 30 | 0.45 |
| Vulcan Turret | BALLISTIC_TURRET2X2 |  | 2x2 | 6 | 0.33 | 40 | 10 | 120 | 20 | 20 | 5 | 0 |
| Vulcan Turret | BALLISTIC_TURRET2X2 | Mk.II | 2x2 | 6 | 0.22 | 50 | 10 | 120 | 20 | 20 | 5 | 0 |
| Vulcan Turret | BALLISTIC_TURRET2X2 | Mk.III | 2x2 | 9 | 0.33 | 40 | 10 | 120 | 20 | 20 | 5 | 0 |
| Rail Turret | BALLISTIC_TURRET3X3 |  | 3x3 | 15 | 0.15 | 70 | 10 | 350 | 50 | 100 | 10 | 0 |
| Rail Turret | BALLISTIC_TURRET3X3 | Mk.II | 3x3 | 14 | 0.15 | 70 | 10 | 350 | 50 | 100 | 10 | 0 |
| Gaussian Shotgun | SHOTGUN2X3 |  | 2x3 | 8 | 1.7 | 28 | 10 | 10 | 5 | 10 | 1 | 0 |
| Gaussian War Shotgun | SHOTGUN3X4 |  | 3x4 | 11 | 0.15 | 37 | 10 | 20 | 10 | 20 | 2 | 0 |
| Quantum Rifle | PIERCING_BALLISTIC1X4 |  | 1x4 | 16 | 2.5 | 80 | 3 | 250 | 60 | 100 | 15 | 0.55 |
| Quantum Turret | PIERCING_TURRET3X3 |  | 3x3 | 13 | 0.2 | 80 | 3 | 250 | 40 | 100 | 15 | 0.5 |
| Quantum Turret | PIERCING_TURRET3X3 | Mk.II | 3x3 | 24 | 0.3 | 70 | 3 | 250 | 40 | 100 | 15 | 0.55 |

**Key Stats:**
- `dmg`: Damage per projectile
- `ats`: Fire rate (attacks/sec) - burst mode when ≥2.0
- `rng`: Range
- `ss`: Shot spread (accuracy) - lower is tighter
- `ip`: Impact power (armor penetration)
- `imf`: Impact force multiplier
- `rp`: Ricochet power (penetration depth)
- `rf`: Ricochet factor (max layers penetrated)
- `ddo`: Damage dropoff per penetration (0-1, anti-penetration factor)

**Observations:**
- **Burst weapons** (ats ≥2.0): Railgun, Gauss Rifle, Capital Cannon, Quantum Rifle
- **Shotguns** (ss=10, short range): Fire multiple pellets (5-8, configured in visual-effects.json)
- **Turrets** (360° arc): All have ss=10 (wide spread) or ss=3 (piercing)
- **Piercing weapons** (rf ≥10): Quantum series (rf=15, ddo=0.5-0.55), Capital Cannon (rf=30, ddo=0.45)
- **Damage dropoff**: Only on high-tier piercing weapons (Capital Cannon, Quantum series)
- Most weapons have ddo=0 (no anti-penetration)

---

## Laser Weapons (c=4)

| Display Name | Data Name | Mod | Size | dmg | ats | rng | msd | fc | hlt | pu |
|--------------|-----------|-----|------|-----|-----|-----|-----|----|----|-----|
| Sentry Laser | LASER1X1 |  | 1x1 | 20 | 1.5 | 40 | 0.5 | 35 | 15 | 10 |
| Laser Beam | LASER1X2 |  | 1x2 | 30 | 1.0 | 60 | 1.0 | 35 | 40 | 20 |
| Laser Beam | LASER1X2 | Mk.II | 1x2 | 35 | 1.0 | 60 | 1.0 | 35 | 40 | 20 |
| Pulse Laser | PULSE_LASER2X3 |  | 2x3 | 50 | 2.0 | 50 | 0.8 | 35 | 150 | 70 |
| Arcfusion Array | LASER2X4 |  | 2x4 | 80 | 0.5 | 70 | 2.0 | 35 | 250 | 120 |
| Laser Turret | LASER_TURRET2X2 |  | 2x2 | 35 | 1.0 | 60 | 1.0 | 180 | 90 | 45 |
| Laser Turret | LASER_TURRET2X2 | Mk.II | 2x2 | 40 | 1.0 | 60 | 1.0 | 180 | 90 | 45 |
| Fusion Ray | FUSIONRAY1X3 |  | 1x3 | 40 | 1.0 | 70 | 2.0 | 35 | 60 | 30 |
| Fusion Turret | FUSION_TURRET3X3 |  | 3x3 | 50 | 1.0 | 70 | 2.0 | 180 | 220 | 90 |

**Key Stats:**
- `dmg`: DPS (damage per second)
- `msd`: Beam duration (seconds)
- `ats`: Fire rate
- `fc`: Firing cone (degrees) - 180° for turrets
- Total damage per shot = dmg × msd

**Observations:**
- Lasers bypass shields, affected only by reflect stat
- Longer beam duration (msd) = more total damage per shot
- Turrets have 180° firing arc vs 35° for forward weapons
- Pulse Laser has highest fire rate (2.0) but short duration (0.8s)

---

## Missile Weapons (c=2)

| Display Name | Data Name | Mod | Size | dmg | ats | mc | mspd | macc | mfj | mer | mlf | rng |
|--------------|-----------|-----|------|-----|-----|-------|------|------|-----|-----|-----|-----|
| Rocket Launcher | ROCKET1X2 |  | 1x2 | 20 | 0.5 | 1 | 30 | 0.5 | 65 | 2 | 4 | 60 |
| Missile Launcher | ROCKET1X3 |  | 1x3 | 30 | 0.4 | 1 | 30 | 0.5 | 65 | 3 | 4 | 70 |
| Impact Missile | ROCKET1X4 |  | 1x4 | 40 | 0.3 | 1 | 30 | 0.5 | 65 | 4 | 4 | 80 |
| Scorpion Launcher | ROCKET2X3 |  | 2x3 | 35 | 0.25 | 3 | 30 | 0.5 | 65 | 3 | 4 | 70 |
| Rocket Turret | ROCKET_TURRET2X2 |  | 2x2 | 25 | 0.5 | 1 | 30 | 0.5 | 65 | 2.5 | 4 | 60 |
| Rocket Turret | ROCKET_TURRET2X2 | Mk.II | 2x2 | 30 | 0.5 | 1 | 30 | 0.5 | 65 | 2.5 | 4 | 60 |
| Hydra Turret | ROCKET_TURRET3X4 |  | 3x4 | 50 | 0.2 | 1 | 30 | 0.5 | 65 | 5 | 4 | 90 |
| Arsenal Wall | MISSILEBATTERY2X4 |  | 2x4 | 25 | 0.4 | 5 | 30 | 0.5 | 65 | 2 | 4 | 60 |
| Flak Rocket Turret | FLAK_ROCKET_TURRET3X3 |  | 3x3 | 20 | 0.6 | 3 | 25 | 0.3 | 25 | 2 | 4 | 50 |
| Flak Rocket Turret | FLAK_ROCKET_TURRET3X3 | Mk.II | 3x3 | 25 | 0.6 | 3 | 25 | 0.3 | 25 | 2 | 4 | 50 |
| Torpedo Launcher | TORPEDO1X4 |  | 1x4 | 80 | 0.15 | 1 | 10 | 0.1 | 25 | 6 | 4 | 80 |
| Warhead Launcher | TORPEDO2X4 |  | 2x4 | 120 | 0.1 | 1 | 10 | 0.1 | 25 | 8 | 4 | 90 |
| Mine Launcher | MINELAUNCHER3X2 |  | 3x2 | 30 | 0.5 | 5 | 5 | 0 | 0 | 4 | 4 | 30 |

**Key Stats:**
- `dmg`: Damage per missile
- `mc`: Missile count per shot
- `mer`: Explosion radius (AoE damage)
- `macc`: Tracking accuracy
- `mfj`: Missile fuel (tracking duration: 25/65/90)
- `mlf`: Lifetime (constant 4.0s)
- `mspd`: Flight speed

**Observations:**
- **Torpedoes** (mspd=10, macc=0.1): Slow, unguided, massive damage
- **Mines** (mspd=5, macc=0): Stationary, area denial
- **Flak** (macc=0.3, mfj=25): Low tracking, swarm weapons
- **Standard missiles** (macc=0.5, mfj=65): Good tracking
- Explosion radius allows hitting multiple modules

---

## Shield Modules (c=16)

| Display Name | Data Name | Mod | Size | sr | sa | smr | srs | hlt | pu | a |
|--------------|-----------|-----|------|----|----|-----|-----|-----|----|----|
| Combat Shield | SHIELD1X1 |  | 1x1 | 10 | 100 | 100 | 20 | 15 | 30 | 0 |
| Combat Shield | SHIELD1X1 | Mk.II | 1x1 | 10 | 120 | 120 | 25 | 15 | 30 | 0 |
| Battle Shield | SHIELD1X2 |  | 1x2 | 15 | 200 | 200 | 40 | 40 | 60 | 0 |
| War Shield | SHIELD2X2 |  | 2x2 | 25 | 400 | 400 | 80 | 90 | 120 | 0 |
| Bunker Shield | HARDSHIELD1X1 |  | 1x1 | 8 | 200 | 0 | 0 | 15 | 20 | 0 |

**Key Stats:**
- `sr`: Shield radius
- `sa`: Shield strength (HP)
- `smr`: Max regeneration capacity
- `srs`: Regeneration speed (HP/sec)
- `pu`: Power consumption
- Bunker Shield: No regen but has reflect

**Observations:**
- Shields block ballistics and missiles, bypassed by lasers
- Regeneration starts after 2s without damage
- Larger shields cover more of the ship
- Bunker Shield is unique: no regen, high initial strength
- Shields have hidden armor values that reduce incoming damage
- FULLY IMPLEMENTED in battle system

---

## Armor Modules (c=8)

| Display Name | Data Name | Mod | Size | hlt | a | r | m | pg |
|--------------|-----------|-----|------|-----|---|---|---|-----|
| Small Steel Armor | ARMOR1X1 |  | 1x1 | 30 | 2 | 1 | 10 | 0 |
| Medium Steel Armor | ARMOR2X2 |  | 2x2 | 120 | 2 | 1 | 40 | 0 |
| Large Steel Armor | ARMOR3X3 |  | 3x3 | 270 | 2 | 1 | 90 | 0 |
| Small Reactive Armor | REACTIVE1X1 |  | 1x1 | 40 | 4 | 10 | 15 | 0 |
| Medium Reactive Armor | REACTIVE2X2 |  | 2x2 | 160 | 4 | 10 | 60 | 0 |
| Large Reactive Armor | REACTIVE3X3 |  | 3x3 | 360 | 4 | 10 | 135 | 0 |
| Small Solar Armor | SOLAR1X1 |  | 1x1 | 25 | 1 | 1 | 10 | 5 |
| Medium Solar Armor | SOLAR2X2 |  | 2x2 | 100 | 1 | 1 | 40 | 20 |
| Large Solar Armor | SOLAR3X3 |  | 3x3 | 225 | 1 | 1 | 90 | 45 |

**Key Stats:**
- `hlt`: Health
- `a`: Armor (flat damage reduction)
- `r`: Reflect (% damage reflected)
- `m`: Mass
- `pg`: Power generation

**Observations:**
- **Steel**: Moderate health, low armor/reflect
- **Reactive**: Best armor (4) and reflect (10%)
- **Solar**: Generates power, lowest armor
- Armor reduces damage by flat amount before health loss

---

## Reactor Modules (c=128)

| Display Name | Data Name | Mod | Size | pg | hlt | a | er | ed | m |
|--------------|-----------|-----|------|-------|-----|---|-------|-------|-----|
| Small Reactor | REACTOR1X1 |  | 1x1 | 50 | 15 | 0 | 3 | 30 | 10 |
| Medium Reactor | REACTOR2X2 |  | 2x2 | 200 | 90 | 0 | 6 | 120 | 40 |
| Large Reactor | REACTOR3X3 |  | 3x3 | 450 | 220 | 0 | 9 | 270 | 90 |
| Grand Reactor | REACTOR4X4 |  | 4x4 | 800 | 400 | 0 | 12 | 480 | 160 |
| Medium Armored Reactor | ARMOREDREACTOR2X2 |  | 2x2 | 150 | 120 | 2 | 5 | 100 | 60 |
| Large Armored Reactor | ARMOREDREACTOR3X3 |  | 3x3 | 350 | 280 | 2 | 8 | 240 | 120 |

**Key Stats:**
- `pg`: Power generation
- `er`: Explosion radius (on destruction)
- `ed`: Explosion damage (on destruction)
- Armored variants: Lower power, higher health/armor

**Observations:**
- All reactors explode when destroyed
- Larger reactors = bigger explosions
- Armored reactors sacrifice power for survivability
- Grand Reactor: Massive power but devastating explosion

---

## Engine Modules (c=64)

| Display Name | Data Name | Mod | Size | ep | ts | pu | hlt | Special |
|--------------|-----------|-----|------|-------|-------|-----|-----|---------|
| Small Ion Drive | ENGINE1X1 |  | 1x1 | 100 | 100 | 10 | 15 | - |
| Large Ion Drive | ENGINE2X2 |  | 2x2 | 400 | 400 | 40 | 90 | - |
| Grand Ion Drive | ENGINE2X3 |  | 2x3 | 600 | 600 | 60 | 150 | - |
| Vectored Thruster | ENGINE_VECTOR2X1 |  | 2x1 | 10 | 500 | 30 | 50 | High turn |
| Warp Drive | WARPENGINE1X2 |  | 1x2 | 0 | 0 | 40 | 40 | Teleport |
| Afterburner | AFTERBURNER |  | 1x1 | 0 | 0 | 20 | 15 | Boost |

**Key Stats:**
- `ep`: Thrust power (forward movement)
- `ts`: Turn power (rotation)
- `pu`: Power consumption

**Observations:**
- Ion Drives: Balanced thrust and turn
- Vectored Thruster: All turn, minimal thrust
- Warp Drive: Teleports to enemy (cd=10s)
- Afterburner: Temporary speed boost (dur=3s, cd=10s)

---

## Support Modules (c=256)

| Display Name | Data Name | Mod | Size | Function | Key Stats |
|--------------|-----------|-----|------|----------|-----------|
| Repair Bay | REPAIRBAY2X3 |  | 2x3 | Heals modules | smr=500, srs=50 HP/s |
| Armor Generator | ARMORGENERATOR2X2 |  | 2x2 | Creates 1x1 armor | mc=10, period=10s |
| Junk Launcher | JUNKLAUNCHER |  | 2x2 | Debris field | ats=1, mc=5 pieces |

**Observations:**
- Repair Bay: Limited healing pool (500 HP total)
- Armor Generator: Fills empty cells with armor
- Junk Launcher: Blocks projectiles, distracts lasers

---

## Point Defense (c=32)

| Display Name | Data Name | Mod | Size | pdr | pdmsc | pdmnc | pdtc | hlt |
|--------------|-----------|-----|------|-----|-------|-------|------|-----|
| Point Defense Turret | POINTDEF2X2 |  | 2x2 | 19 | 0.5 | 0.35 | 0.25 | 90 |
| Point Defense Turret | POINTDEF2X2 | Mk.II | 2x2 | 19 | 0.6 | 0.5 | 0.35 | 90 |

**Key Stats:**
- `pdr`: Range (constant 19)
- `pdmsc`: Missile intercept chance
- `pdmnc`: Mine intercept chance
- `pdtc`: Torpedo intercept chance
- Fire rate: 5 rounds/sec

**Observations:**
- Intercepts missiles/torpedoes within range
- Higher tier = better intercept chances
- Can also intercept ballistics (30% chance in implementation)
