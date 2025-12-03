# Module Data Keys Analysis

This document analyzes unknown module data keys from `modules.json`.

## Key: `i` (Index/ID)
**Type:** Grouped Behavior

**Unique Values:** 0-11 (12 unique values)

**Analysis:** Appears to be a module index or category identifier.

**Groupings:**
- `0` (12): Engine1x1, Ballistic1x1, Armor1x1, EngineVectored2x1, ReactiveArmor1x1, AfterBurner1x2, ScrapLauncher2x3, EngineVectored2x1_2, PointDefense2x2_2, Ballistic1x1_2, Armor1x1_1, Engine1x1_1
- `1` (9): Reactor1x1, ShieldGenerator1x1, Ballistic1x2, HardShieldGene1x1, Ballistic2x3, Ballistic2x4, Ballistic2x3_2, ShieldGenerator1x1_2, HardShieldGene1x1_2
- `2` (4): RocketLauncher1x2, SolarArmor1x1, WarpEngine1x2, RocketLauncher1x2_2
- `3` (6): Laser1x2, Armor2x2, Reactor2x2, ReactiveArmor2x2, Laser1x2_3, Laser1x2_2
- `4` (8): BallisticTurret2x2, Engine2x2, PointDefense2x2, Engine2x3, PointDefense2x2_3, BallisticTurret2x2_3, Engine2x3_2, BallisticTurret2x2_2
- `5` (10): RocketTurret2x2, SolarArmor2x2, ArmoredReactor2x2, SolarArmor3x3, RocketTurret3x4, RocketTurret2x2_2, RocketTurret2x2_3, ArmoredReactor2x2_2, RocketTurret3x4_2, SolarArmor2x2_2
- `6` (8): Ballistic1x3, ShieldGenerator1x2, RepairBay3x2, ShieldGenerator2x2, Ballistic1x5, Ballistic2x7, Ballistic2x7_2, Ballistic1x3_2
- `7` (6): LaserTurret2x2, Armor3x3, Reactor3x3, ReactiveArmor3x3, ArmoredReactor3x3, Reactor4x4
- `8` (5): RocketLauncher1x3, RocketLauncher2x3, RocketLauncher1x4, RocketLauncher2x3_2, RocketLauncher2x3_3
- `9` (2): MineLauncher3x2, MineLauncher3x2_2
- `10` (5): PiercingBallistic1x4, RocketFlakTurret3x3, PiercingBallisticTurret3x3, RocketFlakTurret3x3_2, PiercingBallisticTurret3x3_2
- `11` (2): Shotgun2x3, Shotgun3x4
- `12` (8): FusionRay1x3, PulseLaser2x3, FusionTurret3x3, Laser1x1, PulseLaser2x3_2, PulseLaser2x3_3, FusionTurret3x3_2, Laser1x1_2
- `13` (2): TorpedoLauncher1x4, TorpedoLauncher2x4
- `14` (2): BallisticTurret3x3, BallisticTurret3x3_2
- `15` (1): MissileBattery4x2
- `16` (1): Laser2x4

**Suggested Name:** `module_index` or `category_id`

---

## Key: `t` (Type)
**Type:** Grouped Behavior

**Unique Values:** 1, 2, 3, 4 (4 unique values)

**Analysis:** Module type classifier.

**Groupings:**
- `3` (82): All weapons, armor, shields, reactors, and support modules except engines
- `4` (9): Engine1x1, Engine2x2, WarpEngine1x2, EngineVectored2x1, Engine2x3, AfterBurner1x2, EngineVectored2x1_2, Engine2x3_2, Engine1x1_1

**Suggested Name:** `module_type` (1=Ballistic, 2=Missile, 3=Device, 4=Engine)

---

## Key: `c` (Category)
**Type:** Grouped Behavior

**Unique Values:** 1, 2, 4, 8, 16, 32, 64, 128 (8 unique values - powers of 2, likely bit flags)

**Analysis:** Category flags, possibly for filtering/grouping.

**Groupings:**
- `1` (21 - Ballistic): Ballistic1x1, BallisticTurret2x2, Ballistic1x2, Ballistic1x3, Shotgun2x3, PiercingBallistic1x4, BallisticTurret3x3, Ballistic2x3, Ballistic1x5, PiercingBallisticTurret3x3, Ballistic2x4, Shotgun3x4, Ballistic2x7, BallisticTurret2x2_3, Ballistic1x1_2, Ballistic2x3_2, PiercingBallisticTurret3x3_2, Ballistic2x7_2, Ballistic1x3_2, BallisticTurret2x2_2, BallisticTurret3x3_2
- `2` (19 - Missile/Rocket): RocketLauncher1x2, RocketTurret2x2, MineLauncher3x2, MissileBattery4x2, RocketLauncher1x3, TorpedoLauncher1x4, RocketLauncher2x3, RocketLauncher1x4, RocketFlakTurret3x3, TorpedoLauncher2x4, RocketTurret3x4, RocketTurret2x2_2, RocketTurret2x2_3, RocketLauncher2x3_2, RocketLauncher2x3_3, RocketFlakTurret3x3_2, RocketTurret3x4_2, RocketLauncher1x2_2, MineLauncher3x2_2
- `4` (13 - Laser): Laser1x2, LaserTurret2x2, FusionRay1x3, Laser2x4, PulseLaser2x3, FusionTurret3x3, Laser1x1, Laser1x2_3, PulseLaser2x3_2, PulseLaser2x3_3, FusionTurret3x3_2, Laser1x1_2, Laser1x2_2
- `8` (11 - Armor): Armor1x1, Armor2x2, SolarArmor1x1, SolarArmor2x2, Armor3x3, SolarArmor3x3, ReactiveArmor1x1, ReactiveArmor2x2, ReactiveArmor3x3, Armor1x1_1, SolarArmor2x2_2
- `16` (6 - Shield): ShieldGenerator1x1, ShieldGenerator1x2, HardShieldGene1x1, ShieldGenerator2x2, ShieldGenerator1x1_2, HardShieldGene1x1_2
- `32` (4 - Point Defense): PointDefense2x2, ScrapLauncher2x3, PointDefense2x2_2, PointDefense2x2_3
- `64` (9 - Engine): Engine1x1, Engine2x2, WarpEngine1x2, EngineVectored2x1, Engine2x3, AfterBurner1x2, EngineVectored2x1_2, Engine2x3_2, Engine1x1_1
- `128` (7 - Reactor): Reactor1x1, Reactor2x2, ArmoredReactor2x2, Reactor3x3, ArmoredReactor3x3, Reactor4x4, ArmoredReactor2x2_2
- `256` (1 - Support): RepairBay3x2

**Suggested Name:** `category_flags` (bit flags for weapon/defense/utility types)

---

## Key: `ss`
**Type:** Value

**Range:** 0.0 - 10.0
**Zero Count:** 70 / 91 modules
**Non-Zero Count:** 21 modules

**Non-Zero Values:** 3.0, 5.0, 7.0, 10.0

**Analysis:** Only present on ballistic and laser weapons. Values correlate with weapon spread/accuracy.

**Suggested Name:** `spread` or `shot_spread` (weapon accuracy/dispersion)

---

## Key: `ip`
**Type:** Value

**Range:** 0.0 - 1000.0
**Zero Count:** 60 / 91 modules
**Non-Zero Count:** 31 modules

**Non-Zero Values:** 10.0 - 1000.0

**Analysis:** Present on ballistic weapons and missiles. Higher values on heavier weapons.

**Suggested Name:** `impact_power` or `penetration` (armor penetration value)

---

## Key: `imf`
**Type:** Value

**Range:** 0.0 - 130.0
**Zero Count:** 60 / 91 modules
**Non-Zero Count:** 31 modules

**Non-Zero Values:** 5.0 - 130.0

**Analysis:** Correlates with `ip`. Present on same modules (ballistic/missiles).

**Suggested Name:** `impact_force_multiplier` or `penetration_multiplier`

---

## Key: `rp`
**Type:** Value

**Range:** 0.0 - 200.0
**Zero Count:** 70 / 91 modules
**Non-Zero Count:** 21 modules

**Non-Zero Values:** 2.0 - 200.0

**Analysis:** Only on ballistic weapons. Likely related to ricochet or penetration.

**Suggested Name:** `ricochet_power` or `penetration_depth`

---

## Key: `rf`
**Type:** Value

**Range:** 0.0 - 15.0
**Zero Count:** 70 / 91 modules
**Non-Zero Count:** 21 modules

**Non-Zero Values:** 1.0 - 15.0

**Analysis:** Only on ballistic weapons, correlates with `rp`.

**Suggested Name:** `ricochet_factor` or `penetration_layers`

---

## Key: `mlf`
**Type:** Value

**Range:** 0.0 - 4.0
**Zero Count:** 73 / 91 modules
**Non-Zero Count:** 18 modules

**Non-Zero Values:** 4.0 (all non-zero values are exactly 4.0)

**Analysis:** Only on missile/rocket launchers. Constant value when present.

**Suggested Name:** `missile_lifetime` or `missile_flight_time`

---

## Key: `mfj`
**Type:** Value

**Range:** 0.0 - 90.0
**Zero Count:** 73 / 91 modules
**Non-Zero Count:** 18 modules

**Non-Zero Values:** 25.0, 65.0, 90.0

**Analysis:** Only on missile/rocket launchers. Three distinct tiers.

**Suggested Name:** `missile_fuel` or `missile_tracking_strength`

---

## Key: `cd`
**Type:** Value

**Range:** 0.0 - 4.5
**Zero Count:** 90 / 91 modules
**Non-Zero Count:** 1 module (AfterBurner1x2)

**Analysis:** Only on Afterburner module.

**Suggested Name:** `cooldown` or `ability_cooldown` (seconds between activations)

---

## Key: `mvmb`
**Type:** Value

**Range:** 0.0 - 3.0
**Zero Count:** 90 / 91 modules
**Non-Zero Count:** 1 module (AfterBurner1x2)

**Analysis:** Only on Afterburner module.

**Suggested Name:** `movement_boost` or `speed_multiplier`

---

## Key: `tb`
**Type:** Value

**Range:** 0.0 - 6.5
**Zero Count:** 90 / 91 modules
**Non-Zero Count:** 1 module (AfterBurner1x2)

**Analysis:** Only on Afterburner module.

**Suggested Name:** `thrust_boost` or `acceleration_boost`

---

## Key: `dc`
**Type:** Value

**Range:** 0.0 - 45.0
**Zero Count:** 90 / 91 modules
**Non-Zero Count:** 1 module (AfterBurner1x2)

**Analysis:** Only on Afterburner module. Likely duration in seconds.

**Suggested Name:** `duration_charge` or `boost_duration` (seconds)

---

## Key: `pdr`
**Type:** Value

**Range:** 0.0 - 19.0
**Zero Count:** 88 / 91 modules
**Non-Zero Count:** 3 modules (all PointDefense2x2 variants)

**Analysis:** Only on Point Defense modules. Constant value of 19.0.

**Suggested Name:** `point_defense_range`

---

## Key: `pdmsc`
**Type:** Value

**Range:** 0.0 - 0.6
**Zero Count:** 88 / 91 modules
**Non-Zero Count:** 3 modules (PointDefense2x2 variants)

**Non-Zero Values:** 0.35, 0.4, 0.6

**Analysis:** Only on Point Defense modules. Different values for each variant.

**Suggested Name:** `point_defense_missile_chance` or `pd_intercept_chance_missile`

---

## Key: `pdmnc`
**Type:** Value

**Range:** 0.0 - 0.5
**Zero Count:** 88 / 91 modules
**Non-Zero Count:** 3 modules (PointDefense2x2 variants)

**Non-Zero Values:** 0.2, 0.5

**Analysis:** Only on Point Defense modules.

**Suggested Name:** `point_defense_mine_chance` or `pd_intercept_chance_mine`

---

## Key: `pdtc`
**Type:** Value

**Range:** 0.0 - 0.35
**Zero Count:** 88 / 91 modules
**Non-Zero Count:** 3 modules (PointDefense2x2 variants)

**Non-Zero Values:** 0.2, 0.25, 0.35

**Analysis:** Only on Point Defense modules.

**Suggested Name:** `point_defense_torpedo_chance` or `pd_intercept_chance_torpedo`

---

## Key: `pdd`
**Type:** Value

**Range:** 0.0 - 0.1
**Zero Count:** 88 / 91 modules
**Non-Zero Count:** 3 modules (all PointDefense2x2 variants)

**Analysis:** Only on Point Defense modules. Constant value of 0.1.

**Suggested Name:** `point_defense_damage` or `pd_projectile_damage`

---

## Summary

### Grouped Behavior Keys (Category/Type Identifiers)
- `i`: Module index/ID (0-11)
- `t`: Module type (1=Ballistic, 2=Missile, 3=Device, 4=Engine)
- `c`: Category flags (bit flags: 1=Ballistic, 2=Missile, 4=Laser, 8=Armor, 16=Shield, 32=PointDefense, 64=Engine, 128=Reactor)

### Weapon Stats (Ballistic/Missile)
- `ss`: Shot spread/accuracy (0-10)
- `ip`: Impact power/penetration (0-1000)
- `imf`: Impact force multiplier (0-130)
- `rp`: Ricochet power/penetration depth (0-200, ballistic only)
- `rf`: Ricochet factor/penetration layers (0-15, ballistic only)
- `mlf`: Missile lifetime/flight time (4.0 constant, missiles only)
- `mfj`: Missile fuel/tracking strength (25/65/90, missiles only)

### Special Module Stats
- `cd`: Cooldown (4.5s, Afterburner only)
- `mvmb`: Movement boost multiplier (3.0, Afterburner only)
- `tb`: Thrust boost (6.5, Afterburner only)
- `dc`: Duration/charge (45s, Afterburner only)

### Point Defense Stats
- `pdr`: Point defense range (19.0 constant)
- `pdmsc`: PD missile intercept chance (0.35-0.6)
- `pdmnc`: PD mine intercept chance (0.2-0.5)
- `pdtc`: PD torpedo intercept chance (0.2-0.35)
- `pdd`: PD projectile damage (0.1 constant)
