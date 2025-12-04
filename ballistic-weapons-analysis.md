# Ballistic Weapons Data Analysis

## All Ballistic Weapons Stats

| Name | i | dmg | ats | ss | ip | imf | rp | rf | mc |
|------|---|-----|-----|----|----|-----|----|----|-----|
| BALLISTIC1X1 | 0 | 4 | 0.3 | 7 | 10 | 10 | 0 | 0 | 0 |
| BALLISTIC1X1 | 0 | 4 | 1.0 | 7 | 10 | 10 | 0 | 0 | 0 |
| BALLISTIC1X2 | 1 | 5 | 0.3 | 7 | 100 | 20 | 10 | 2 | 0 |
| BALLISTIC1X3 | 6 | 19 | 2.5 | 5 | 1000 | 130 | 200 | 10 | 0 |
| BALLISTIC1X3 | 6 | 31 | 2.5 | 5 | 1000 | 130 | 200 | 10 | 0 |
| BALLISTIC1X5 | 6 | 37 | 3.0 | 5 | 1500 | 200 | 200 | 20 | 0 |
| BALLISTIC2X3 | 1 | 7 | 0.2 | 7 | 100 | 25 | 10 | 10 | 0 |
| BALLISTIC2X3 | 1 | 8 | 0.2 | 2 | 100 | 25 | 10 | 10 | 0 |
| BALLISTIC2X4 | 1 | 9 | 0.05 | 7 | 40 | 30 | 10 | 8 | 0 |
| BALLISTIC2X7 | 6 | 75 | 3.5 | 5 | 8500 | 500 | 3500 | 30 | 0 |
| BALLISTIC2X7 | 6 | 81 | 3.1 | 5 | 8500 | 500 | 3500 | 30 | 0 |
| BALLISTIC_TURRET2X2 | 4 | 6 | 0.33 | 10 | 120 | 20 | 20 | 5 | 0 |
| BALLISTIC_TURRET2X2 | 4 | 6 | 0.22 | 10 | 120 | 20 | 20 | 5 | 0 |
| BALLISTIC_TURRET2X2 | 4 | 9 | 0.33 | 10 | 120 | 20 | 20 | 5 | 0 |
| BALLISTIC_TURRET3X3 | 14 | 15 | 0.15 | 10 | 350 | 50 | 100 | 10 | 0 |
| BALLISTIC_TURRET3X3 | 14 | 14 | 0.15 | 10 | 350 | 50 | 100 | 10 | 0 |
| SHOTGUN2X3 | 11 | 8 | 1.7 | 10 | 10 | 5 | 10 | 1 | 0 |
| SHOTGUN3X4 | 11 | 11 | 0.15 | 10 | 20 | 10 | 20 | 2 | 0 |
| PIERCING_BALLISTIC1X4 | 10 | 16 | 2.5 | 3 | 250 | 60 | 100 | 15 | 0 |
| PIERCING_TURRET3X3 | 10 | 13 | 0.2 | 3 | 250 | 40 | 100 | 15 | 0 |
| PIERCING_TURRET3X3 | 10 | 24 | 0.3 | 3 | 250 | 40 | 100 | 15 | 0 |

## Field Definitions

- **i**: Module index (weapon type grouping)
- **dmg**: Damage per projectile
- **ats**: Attacks per second (fire rate)
- **ss**: Shot spread (accuracy/dispersion in degrees, 0-10)
- **ip**: Impact power (armor penetration, 0-1000)
- **imf**: Impact force multiplier (penetration multiplier, 0-130)
- **rp**: Ricochet power (penetration depth, 0-200)
- **rf**: Ricochet factor (max armor layers penetrated, 0-15)
- **mc**: Missile count (always 0 for ballistics)

## Observations

### Weapon Categories by Index (i)

- **i=0**: Basic ballistics (low damage, low penetration)
- **i=1**: Medium ballistics (moderate stats)
- **i=4**: Turrets (360° firing arc, high spread)
- **i=6**: Heavy ballistics (high damage, burst fire)
- **i=10**: Piercing weapons (low spread, high penetration)
- **i=11**: Shotguns (high spread, likely multi-pellet)
- **i=14**: Heavy turrets (360° arc, high damage)

### Fire Modes

**Normal Fire** (ats < 2.0):
- Single shot per trigger
- Cooldown: 1-10 seconds between shots
- Examples: BALLISTIC1X1 (0.3), BALLISTIC2X4 (0.05)

**Burst Fire** (ats ≥ 2.0):
- Rapid fire mode
- Cooldown: 0.3-0.4 seconds between shots
- Examples: BALLISTIC1X3 (2.5), BALLISTIC2X7 (3.5)

### Spread Patterns

- **ss=2-3**: Tight spread (piercing weapons)
- **ss=5-7**: Normal spread (standard ballistics)
- **ss=10**: Wide spread (turrets, shotguns)

### Penetration Capability

High penetration weapons (rf ≥ 10):
- BALLISTIC2X3 (rf=10)
- BALLISTIC1X3 (rf=10)
- BALLISTIC_TURRET3X3 (rf=10)
- PIERCING weapons (rf=15)
- BALLISTIC2X7 (rf=30)

### Missing Data

**Pellet Count**: Not present in data (mc=0 for all ballistics)
- Notes mention "Gaussian War Shotgun fires 9 pellets"
- Likely hardcoded by weapon index or name
- May need to be inferred from weapon type

**Possible pellet count by weapon index:**
- i=11 (Shotguns): 5-9 pellets?
- i=4,14 (Turrets): 2-3 pellets?
- Others: 1 pellet

## DPS Calculations

From notes.txt:
```
DPS = (Damage - Armor) × Fire Rate × Pellet Count
```

**Example calculations (assuming 1 pellet, 0 armor):**
- BALLISTIC1X1: 4 × 0.3 = 1.2 DPS
- BALLISTIC1X3: 19 × 2.5 = 47.5 DPS
- BALLISTIC2X7: 81 × 3.1 = 251.1 DPS
- SHOTGUN2X3: 8 × 1.7 = 13.6 DPS (×pellets?)

**If shotguns fire 5 pellets:**
- SHOTGUN2X3: 8 × 1.7 × 5 = 68 DPS
