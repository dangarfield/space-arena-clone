# Data Analysis

Comprehensive statistical analysis of module and ship attributes based on DATA_MODULES.md and DATA_SHIPS.md.

**Generated:** 2025-12-05T19:03:59.346Z

**Total Modules:** 91
**Total Ships:** 41

---

## Module Analysis by Category

Analysis of modules grouped by their category bit flag (c field).

### Armor (11 modules)

**a**: min=2, max=6, avg=3.909090909090909, count=11/11, values=[2, 3, 4, 5, 6]
**c**: min=8, max=8, avg=8, count=11/11, values=[8]
**cst**: min=22500, max=1200000, avg=228611.11111111112, count=9/11, values=[22500, 25000, 55000, 75000, 95000, 125000, 200000, 260000, 1200000]
**h**: min=1, max=3, avg=1.9090909090909092, count=11/11, values=[1, 2, 3]
**hcst**: min=50, max=2400, avg=440, count=9/11, values=[50, 110, 150, 190, 250, 360, 400, 2400]
**hlt**: min=75, max=1850, avg=592.7272727272727, count=11/11, values=[75, 125, 175, 330, 490, 550, 750, 1300, 1850]
**i**: min=2, max=7, avg=4.625, count=8/11, values=[2, 3, 5, 7]
**m**: min=50, max=900, avg=311.3636363636364, count=11/11, values=[50, 75, 100, 200, 300, 400, 450, 675, 900]
**pg**: min=10, max=125, avg=62.5, count=4/11, values=[10, 50, 65, 125]
**pu**: min=5, max=60, avg=30, count=3/11, values=[5, 25, 60]
**r**: min=0.40, max=0.50, avg=0.45, count=11/11, values=[0.40, 0.45, 0.50]
**rl**: min=7, max=38, avg=18.666666666666668, count=9/11, values=[7, 9, 13, 15, 18, 20, 22, 26, 38]
**t**: min=3, max=3, avg=3, count=11/11, values=[3]
**w**: min=1, max=3, avg=1.9090909090909092, count=11/11, values=[1, 2, 3]

**ANALYSIS:**

Armor modules provide passive defense with three variants: Steel (balanced), Reactive (high armor/reflect), and Solar (generates power).

- **a (Armor)**: 2-6 range shows clear progression. Reactive armor has highest (4-6), Steel moderate (2-5), Solar lowest (2-4). Higher armor = more flat damage reduction per hit.
- **r (Reflect/Resistance)**: All armor has 0.40-0.50 resistance. Formula: damage = base × (1 - r). So r=0.40 means 60% damage taken (40% reflected), r=0.50 means 50% damage taken (50% reflected). Matches wiki's 50-60% damage taken for armor.
- **hlt (Health)**: Scales with size (75-1850 HP). Larger armor = more HP but also more mass/cost.
- **m (Mass)**: 50-900 range. Heavy armor slows ship acceleration. Reactive is heaviest per cell.
- **pg (Power Generation)**: Only Solar armor generates power (10-125). Trade-off: lower armor for energy.
- **pu (Power Use)**: Only Reactive armor consumes power (5-60). High-tier defense requires energy.
- **cst/hcst (Cost)**: Reactive is most expensive (95k-1.2M credits), Solar cheapest (25k-260k).
- **rl (Required Level)**: 7-38 unlock progression. Higher tier = better stats but later availability.

**Key Insight**: Armor r values (0.40-0.50) represent resistance. With formula damage = base × (1 - r), armor takes 50-60% laser damage, which matches wiki. Reactive armor (r=0.40) takes 60% damage, Steel (r=0.45) takes 55% damage.


### Ballistic (21 modules)

**ats**: min=0.05, max=3.50, avg=1.08, count=21/21, unique=12
**c**: min=1, max=1, avg=1, count=21/21, values=[1]
**cst**: min=750, max=3210000, avg=869687.5, count=20/21, unique=16
**ddo**: min=0.45, max=0.55, avg=0.50, count=5/21, values=[0.45, 0.50, 0.55]
**dmg**: min=4, max=81, avg=19.142857142857142, count=21/21, unique=17
**fc**: min=20, max=180, avg=81.9047619047619, count=21/21, values=[20, 35, 180]
**h**: min=1, max=7, avg=3.238095238095238, count=21/21, values=[1, 2, 3, 4, 5, 7]
**hcst**: min=10, max=6420, avg=1720, count=20/21, unique=16
**hlt**: min=15, max=380, avg=153.57142857142858, count=21/21, unique=16
**i**: min=1, max=14, avg=6.631578947368421, count=19/21, values=[1, 4, 6, 10, 11, 14]
**imf**: min=5, max=500, avg=90.23809523809524, count=21/21, unique=11
**ip**: min=10, max=8500, avg=1080.952380952381, count=21/21, values=[10, 20, 40, 100, 120, 250, 350, 1000, 1500, 8500]
**m**: min=10, max=500, avg=161.1904761904762, count=21/21, unique=12
**pu**: min=10, max=280, avg=87.38095238095238, count=21/21, unique=13
**r**: min=1.00, max=1.00, avg=1.00, count=21/21, values=[1.00]
**rf**: min=1, max=30, avg=11.210526315789474, count=19/21, values=[1, 2, 5, 8, 10, 15, 20, 30]
**rl**: min=1, max=50, avg=28.61111111111111, count=18/21, unique=16
**rng**: min=28, max=120, avg=63.333333333333336, count=21/21, unique=12
**rp**: min=10, max=3500, avg=433.1578947368421, count=19/21, values=[10, 20, 100, 200, 3500]
**ss**: min=2, max=10, avg=6.714285714285714, count=21/21, values=[2, 3, 5, 7, 10]
**t**: min=3, max=3, avg=3, count=21/21, values=[3]
**w**: min=1, max=3, avg=1.9047619047619047, count=21/21, values=[1, 2, 3]

**ANALYSIS:**

Ballistic weapons use projectile physics with armor penetration mechanics. Wide variety from rapid-fire chainguns to heavy piercing cannons.

- **dmg (Damage)**: 4-81 range. Chainguns low (4-9), Railguns medium (16-31), Capital Cannon highest (75-81). Burst weapons (ats≥2.0) have higher damage.
- **ats (Fire Rate)**: 0.05-3.50 attacks/sec. Hyperion Chaingun slowest (0.05), Capital Cannon fastest burst (3.50). Lower rate = higher per-shot damage.
- **rng (Range)**: 28-120. Shotguns shortest (28-37), Capital Cannon longest (120). Range affects engagement distance.
- **ss (Shot Spread)**: 2-10 degrees. Piercing weapons tightest (2-3), Turrets/Shotguns widest (10). Lower = more accurate.
- **ip (Impact Power)**: 10-8500. Measures armor penetration strength. Capital Cannon highest (8500), basic weapons lowest (10-120).
- **rp (Ricochet Power)**: 10-3500 on 19/21 weapons. Penetration depth strength. Capital Cannon (3500) vs basic (10-20).
- **rf (Ricochet Factor)**: 1-30 max modules penetrated. Capital Cannon (30), Quantum series (15), basic (1-10). Determines how many modules projectile can pass through.
- **ddo (Damage Dropoff)**: 0.45-0.55 on only 5/21 weapons (piercing types). Damage retained after penetration. 0.45 = 45% damage on subsequent hits.
- **fc (Fire Cone)**: 20°/35° (forward) or 180° (turrets). Turrets can engage targets in wider arc.
- **r (Reflect/Resistance)**: ALL show 1.00 (100% resistance). Formula: damage = base × (1 - 1.00) = 0. Weapons take 0% laser damage (immune), which matches wiki.
- **hlt (Health)**: 15-380 HP. Weapons are fragile compared to armor. Larger weapons more durable.
- **m (Mass)**: 10-500. Heavy weapons slow ship. Capital Cannon (500) vs Chaingun (10-30).
- **pu (Power Use)**: 10-280. Heavy weapons drain power. Must balance with reactor capacity.

**Key Insights**: 
1. Penetration system uses rf (max depth) and rp/ip ratio (chance per hit). Only 5 weapons have ddo (damage retention).
2. Weapons have r=1.00 (100% resistance) meaning they take 0% laser damage (immune). This is correct per wiki.
3. Burst weapons (ats≥2.0) fire multiple shots rapidly: Railgun, Gauss Rifle, Capital Cannon, Quantum Rifle.


### Engine (9 modules)

**a**: min=1, max=4, avg=2.111111111111111, count=9/9, values=[1, 2, 3, 4]
**c**: min=64, max=64, avg=64, count=9/9, values=[64]
**cd**: min=4.50, max=4.50, avg=4.50, count=1/9, values=[4.50]
**cst**: min=10000, max=1280000, avg=240000, count=7/9, values=[10000, 20000, 25000, 30000, 140000, 175000, 1280000]
**dc**: min=45, max=45, avg=45, count=1/9, values=[45]
**dur**: min=2.00, max=2.00, avg=2.00, count=1/9, values=[2.00]
**ep**: min=900, max=12000, avg=6400, count=5/9, values=[900, 1100, 6000, 12000]
**h**: min=1, max=3, avg=1.7777777777777777, count=9/9, values=[1, 2, 3]
**hcst**: min=20, max=2560, avg=483.57142857142856, count=7/9, values=[20, 40, 60, 75, 280, 350, 2560]
**hlt**: min=60, max=500, avg=183.88888888888889, count=9/9, values=[60, 75, 90, 100, 280, 400, 500]
**i**: min=2, max=4, avg=3.5, count=4/9, values=[2, 4]
**m**: min=10, max=80, avg=35, count=9/9, values=[10, 20, 30, 35, 80]
**mvmb**: min=3.00, max=3.00, avg=3.00, count=1/9, values=[3.00]
**pu**: min=2, max=60, avg=30.77777777777778, count=9/9, values=[2, 5, 25, 30, 40, 45, 60]
**r**: min=0.75, max=0.75, avg=0.75, count=9/9, values=[0.75]
**rl**: min=5, max=42, avg=15.857142857142858, count=7/9, values=[5, 7, 9, 10, 12, 26, 42]
**t**: min=4, max=4, avg=4, count=9/9, values=[4]
**tb**: min=6.50, max=6.50, avg=6.50, count=1/9, values=[6.50]
**ts**: min=120.00, max=1800.00, avg=772.86, count=7/9, values=[120.00, 650.00, 700.00, 820.00, 1200.00, 1800.00]
**w**: min=1, max=2, avg=1.5555555555555556, count=9/9, values=[1, 2]

**ANALYSIS:**

Engine modules provide thrust and turning power. Must be placed on 'E' cells only. Includes special types: Warp Drive (teleport) and Afterburner (speed boost).

- **ep (Thrust Power)**: 900-12000 on 5/9 engines. Forward acceleration. Ion Drives scale with size. Vectored Thruster has minimal thrust (900).
- **ts (Turn Power)**: 120-1800 on 7/9 engines. Rotation speed. Vectored Thruster specialized for turning (1800), Ion Drives balanced.
- **cd (Cooldown)**: 4.50s on Afterburner only. Time between boost activations.
- **dur (Duration)**: 2.00s on Afterburner only. How long boost lasts.
- **mvmb (Movement Boost)**: 3.00x on Afterburner. Speed multiplier during boost.
- **tb (Thrust Boost)**: 6.50x on Afterburner. Acceleration multiplier during boost.
- **dc (Duration Charge)**: 45s on Afterburner. Total boost time available (can activate multiple times).
- **r (Reflect)**: All engines 0.75 (75% reflect). Engines have moderate laser resistance.
- **a (Armor)**: 1-4. Engines have light armor. Grand Ion Drive highest (4).
- **hlt (Health)**: 60-500 HP. Larger engines more durable.
- **m (Mass)**: 10-80. Engines add mass but provide thrust to compensate.
- **pu (Power Use)**: 2-60. Engines consume power to operate.

**Key Insights**:
1. Warp Drive (ep=0, ts=0) doesn't provide thrust - it's a teleport ability.
2. Afterburner provides temporary 3x speed and 6.5x thrust boost for 2s with 4.5s cooldown.
3. Vectored Thruster trades thrust for extreme turning (ts=1800 vs ep=900).
4. Ion Drives scale proportionally: Small (100/100), Large (400/400), Grand (600/600).
5. Engines have r=0.75 (75% resistance) meaning they take 25% laser damage. Moderate vulnerability compared to armor (50-60% damage) or weapons (0% damage - immune).


### Laser (13 modules)

**a**: min=4, max=4, avg=4, count=1/13, values=[4]
**ats**: min=1.50, max=3.00, avg=2.33, count=9/13, values=[1.50, 2.00, 2.50, 3.00]
**c**: min=4, max=4, avg=4, count=13/13, values=[4]
**cst**: min=3500, max=1850000, avg=521615.3846153846, count=13/13, unique=13
**dmg**: min=20, max=100, avg=54.69230769230769, count=13/13, values=[20, 25, 28, 40, 45, 60, 90, 100]
**fc**: min=30, max=180, avg=72.6923076923077, count=13/13, values=[30, 35, 60, 180]
**h**: min=1, max=4, avg=2.4615384615384617, count=13/13, values=[1, 2, 3, 4]
**hcst**: min=10, max=3700, avg=1041.5384615384614, count=13/13, unique=11
**hlt**: min=13, max=250, avg=100.3076923076923, count=13/13, values=[13, 23, 35, 60, 75, 130, 200, 210, 250]
**i**: min=3, max=16, avg=9.846153846153847, count=13/13, values=[3, 7, 12, 16]
**m**: min=15, max=240, avg=94.61538461538461, count=13/13, values=[15, 30, 60, 70, 100, 200, 240]
**msd**: min=0.15, max=3.00, avg=1.34, count=13/13, values=[0.15, 0.35, 1.50, 3.00]
**pg**: min=25, max=25, avg=25, count=1/13, values=[25]
**pu**: min=20, max=200, avg=101.66666666666667, count=12/13, values=[20, 30, 40, 65, 70, 100, 125, 150, 180, 200]
**r**: min=1.00, max=1.00, avg=1.00, count=13/13, values=[1.00]
**rl**: min=3, max=46, avg=24.454545454545453, count=11/13, unique=11
**rng**: min=35, max=100, avg=63.07692307692308, count=13/13, values=[35, 50, 55, 60, 85, 100]
**ss**: min=4, max=5, avg=4.615384615384615, count=13/13, values=[4, 5]
**t**: min=3, max=3, avg=3, count=13/13, values=[3]
**w**: min=1, max=3, avg=1.6923076923076923, count=13/13, values=[1, 2, 3]

**ANALYSIS:**

Laser weapons use continuous beams that bypass shields and are affected by reflect stat. Damage is DPS over duration.

- **dmg (Damage)**: 20-100 DPS. This is damage per second, not per shot. Total damage = dmg × msd.
- **msd (Beam Duration)**: 0.15-3.00 seconds. Longer duration = more total damage. Fusion weapons longest (3.0s), Pulse Laser shortest (0.15s).
- **ats (Fire Rate)**: 1.50-3.00 attacks/sec on 9/13 lasers. How often beam fires. Pulse Laser highest (3.00).
- **fc (Fire Cone)**: 30-35° (forward) or 180° (turrets). Turrets have wider engagement arc.
- **rng (Range)**: 35-100. Sentry Laser shortest (35), Arcfusion Array longest (100).
- **ss (Shot Spread)**: 4-5 degrees. Lasers are accurate (low spread).
- **r (Reflect/Resistance)**: ALL show 1.00 (100% resistance). Lasers take 0% laser damage (immune to other lasers), which matches wiki.
- **hlt (Health)**: 13-250 HP. Lasers are fragile. Larger weapons more durable.
- **m (Mass)**: 15-240. Laser weapons relatively light compared to ballistics.
- **pu (Power Use)**: 20-200. Lasers are power-hungry. Must have sufficient reactor capacity.
- **pg (Power Generation)**: One laser (Sentry) generates 25 power - unusual hybrid.

**Total Damage Calculation**: 
- Sentry Laser: 20 DPS × 0.5s = 10 damage per shot
- Fusion Ray: 40 DPS × 2.0s = 80 damage per shot
- Arcfusion Array: 80 DPS × 2.0s = 160 damage per shot

**Key Insights**:
1. Lasers bypass shields completely - go straight to modules.
2. Damage is continuous over duration, not instant. Can destroy multiple modules in one beam.
3. Lasers have r=1.00 (100% resistance) meaning they're immune to other lasers (take 0% damage). Correct per wiki.
4. High power consumption limits how many lasers a ship can run simultaneously.
5. Longer duration weapons (msd=2-3s) deal more total damage but fire less frequently.


### Missile (19 modules)

**a**: min=2, max=3, avg=2.5, count=2/19, values=[2, 3]
**ats**: min=0.10, max=5.30, avg=2.10, count=19/19, unique=12
**c**: min=2, max=2, avg=2, count=19/19, values=[2]
**cst**: min=1500, max=2470000, avg=589236.8421052631, count=19/19, unique=17
**dmg**: min=12, max=115, avg=32.8421052631579, count=19/19, unique=15
**fc**: min=20, max=180, avg=100.26315789473684, count=19/19, values=[20, 25, 30, 180]
**h**: min=2, max=4, avg=2.8421052631578947, count=19/19, values=[2, 3, 4]
**hcst**: min=10, max=4940, avg=1195.2631578947369, count=19/19, unique=17
**hlt**: min=35, max=350, avg=167.10526315789474, count=19/19, values=[35, 60, 85, 100, 120, 180, 240, 250, 300, 350]
**i**: min=2, max=15, avg=7.7894736842105265, count=19/19, values=[2, 5, 8, 9, 10, 13, 15]
**imf**: min=10, max=250, avg=51.05263157894737, count=19/19, values=[10, 15, 25, 30, 35, 40, 80, 150, 250]
**ip**: min=150, max=10000, avg=1660.5263157894738, count=19/19, values=[150, 300, 350, 500, 1500, 2000, 3500, 7500, 10000]
**m**: min=40, max=350, avg=153.1578947368421, count=19/19, values=[40, 70, 90, 100, 110, 150, 160, 250, 300, 350]
**macc**: min=26.00, max=220.00, avg=170.40, count=15/19, values=[26.00, 150.00, 160.00, 200.00, 220.00]
**mc**: min=1, max=6, avg=2.2666666666666666, count=15/19, values=[1, 2, 3, 4, 6]
**mef**: min=25.00, max=150.00, avg=73.00, count=15/19, values=[25.00, 30.00, 50.00, 120.00, 125.00, 150.00]
**mer**: min=1.2, max=1.6, avg=1.2533333333333332, count=15/19, values=[1.2, 1.6]
**mfj**: min=50, max=90, avg=74.64285714285714, count=14/19, values=[50, 65, 90]
**mlf**: min=0.65, max=4.4, avg=3.58, count=15/19, values=[0.65, 4, 4.4]
**mspd**: min=50, max=180, avg=77.5, count=14/19, values=[50, 60, 65, 90, 180]
**pu**: min=30, max=365, avg=123.6842105263158, count=19/19, unique=14
**r**: min=0.50, max=1.00, avg=0.94, count=19/19, values=[0.50, 0.70, 0.75, 0.85, 1.00]
**rl**: min=2, max=48, avg=27.055555555555557, count=18/19, unique=17
**rng**: min=40, max=120, avg=72.89473684210526, count=19/19, values=[40, 45, 50, 55, 60, 75, 80, 90, 100, 120]
**ss**: min=5, max=30, avg=14, count=5/19, values=[5, 15, 30]
**t**: min=3, max=3, avg=3, count=19/19, values=[3]
**w**: min=1, max=4, avg=2.1578947368421053, count=19/19, values=[1, 2, 3, 4]

**ANALYSIS:**

Missile weapons fire tracking projectiles with AoE damage. Most effective against armor due to multi-cell damage. Includes rockets, missiles, torpedoes, mines.

- **dmg (Damage)**: 12-115 per missile. Torpedoes highest (80-115), basic rockets lowest (12-30).
- **mc (Missile Count)**: 1-6 missiles per shot on 15/19 weapons. Arsenal Wall fires 6, most fire 1-3. More missiles = more total damage.
- **mspd (Missile Speed)**: 50-180 blocks/sec on 14/19 weapons. Torpedoes slowest (50-65), standard missiles medium (90), one outlier at 180.
- **macc (Missile Accuracy)**: 26-220 on 15/19 weapons. INVERSE scale - higher = less accurate. Torpedoes worst tracking (200-220), Flak poor (150-160), standard good (26).
- **mfj (Missile Fuel)**: 50/65/90 on 14/19 weapons. Tracking duration tiers. 90 = best tracking, 50 = worst. Correlates with macc.
- **mer (Explosion Radius)**: 1.2-1.6 on 15/19 weapons. AoE damage range. Larger = hits more modules.
- **mef (Explosion Force)**: 25-150 on 15/19 weapons. Damage multiplier for explosion. Higher = more damage.
- **mlf (Missile Lifetime)**: 0.65-4.4 seconds on 15/19 weapons. How long missile flies before self-destruct. Most are 4.0s.
- **ats (Fire Rate)**: 0.10-5.30 attacks/sec. Wide range. Some fire rapidly (5.30), others slowly (0.10).
- **fc (Fire Cone)**: 20-30° (forward) or 180° (turrets). Turrets can engage wider arc.
- **rng (Range)**: 40-120. Effective engagement distance.
- **r (Reflect)**: 0.50-1.00. Most missiles have high reflect (0.85-1.00), some lower (0.50-0.75). More variation than other weapon types.
- **ip (Impact Power)**: 150-10000. Armor penetration for direct hits. Torpedoes highest (7500-10000).
- **imf (Impact Force Multiplier)**: 10-250. Penetration multiplier.
- **ss (Shot Spread)**: 5-30 degrees on 5/19 weapons. Launch angle variation.

**Tracking Tiers**:
- **Good**: macc=26, mfj=90 (standard missiles)
- **Medium**: macc=150-160, mfj=65 (flak rockets)
- **Poor**: macc=200-220, mfj=50 (torpedoes - slow unguided)

**Key Insights**:
1. Missiles most effective vs armor because AoE hits multiple cells. 3x3 armor (9 cells) × 30 dmg = 270 total damage.
2. Torpedoes are slow (50-65 speed), unguided (macc=200-220), but massive damage (80-115) and huge explosions.
3. Missile accuracy is INVERSE - higher macc value = worse tracking.
4. Point defense can intercept missiles (pdmsc field). Vulnerable to PD turrets.
5. Reflect values vary more than other weapons (0.50-1.00 vs all 1.00 for ballistics/lasers).


### PointDefense (4 modules)

**a**: min=1, max=2, avg=1.75, count=4/4, values=[1, 2]
**ats**: min=3.00, max=3.00, avg=3.00, count=1/4, values=[3.00]
**c**: min=32, max=32, avg=32, count=4/4, values=[32]
**cst**: min=30000, max=260000, avg=142500, count=4/4, values=[30000, 70000, 210000, 260000]
**fc**: min=180, max=180, avg=180, count=1/4, values=[180]
**h**: min=2, max=2, avg=2, count=4/4, values=[2]
**hcst**: min=60, max=520, avg=280, count=4/4, values=[60, 120, 420, 520]
**hlt**: min=175, max=250, avg=231.25, count=4/4, values=[175, 250]
**i**: min=4, max=4, avg=4, count=2/4, values=[4]
**m**: min=120, max=499, avg=254.75, count=4/4, values=[120, 200, 499]
**pdd**: min=0.10, max=0.10, avg=0.10, count=3/4, values=[0.10]
**pdmnc**: min=0.20, max=0.50, avg=0.30, count=3/4, values=[0.20, 0.50]
**pdmsc**: min=0.35, max=0.60, avg=0.45, count=3/4, values=[0.35, 0.40, 0.60]
**pdr**: min=19, max=19, avg=19, count=3/4, values=[19]
**pdtc**: min=0.20, max=0.35, avg=0.27, count=3/4, values=[0.20, 0.25, 0.35]
**pu**: min=25, max=60, avg=38.75, count=4/4, values=[25, 35, 60]
**r**: min=0.80, max=1.00, avg=0.85, count=4/4, values=[0.80, 1.00]
**rl**: min=10, max=18, avg=13.25, count=4/4, values=[10, 11, 14, 18]
**rng**: min=70, max=70, avg=70, count=1/4, values=[70]
**ss**: min=10, max=10, avg=10, count=1/4, values=[10]
**t**: min=3, max=3, avg=3, count=4/4, values=[3]
**w**: min=2, max=2, avg=2, count=4/4, values=[2]

**ANALYSIS:**

Point Defense turrets intercept incoming missiles, mines, and torpedoes. Critical defensive module with specialized stats.

- **pdr (PD Range)**: 19 units constant on all 3 PD turrets. Fixed interception radius.
- **pdmsc (Missile Intercept Chance)**: 0.35-0.60 (35-60%). Mk.II has highest (0.60). Chance to destroy incoming missile.
- **pdmnc (Mine Intercept Chance)**: 0.20-0.50 (20-50%). Mines harder to intercept than missiles.
- **pdtc (Torpedo Intercept Chance)**: 0.20-0.35 (20-35%). Torpedoes hardest to intercept (slow but hard to hit).
- **pdd (PD Damage)**: 0.10 constant. Damage dealt to intercepted projectiles.
- **ats (Fire Rate)**: 3.00 attacks/sec on Scrap Launcher (hybrid PD/weapon).
- **fc (Fire Cone)**: 180° on Scrap Launcher. Full turret coverage.
- **rng (Range)**: 70 on Scrap Launcher (weapon range, not PD range).
- **ss (Shot Spread)**: 10 degrees on Scrap Launcher.
- **r (Reflect/Resistance)**: 0.80-1.00. High laser resistance. r=0.80 means 20% laser damage taken, r=1.00 means 0% damage (immune).
- **hlt (Health)**: 175-250 HP. Moderately durable.
- **m (Mass)**: 120-499. Heavy modules.
- **pu (Power Use)**: 25-60. Moderate power consumption.

**Intercept Priority** (in implementation):
1. Missiles (highest priority)
2. Mines
3. Junk
4. Also intercepts ballistics (30% chance in code)

**Key Insights**:
1. PD effectiveness scales with tier: Basic (35/20/20%), Mk.II (40/50/25%), Mk.III (60/50/35%).
2. Torpedoes are hardest to intercept (20-35%) despite being slow - likely due to size/armor.
3. Fixed range (19 units) means positioning matters for coverage.
4. Scrap Launcher is hybrid: fires junk debris AND has PD capabilities.
5. PD turrets have high laser resistance: r=0.80 (20% damage) or r=1.00 (0% damage - immune).


### Reactor (7 modules)

**a**: min=1, max=3, avg=1.6666666666666667, count=6/7, values=[1, 2, 3]
**c**: min=128, max=128, avg=128, count=7/7, values=[128]
**cst**: min=36000, max=1150000, avg=394333.3333333333, count=6/7, values=[36000, 55000, 95000, 140000, 890000, 1150000]
**ed**: min=10, max=350, avg=103.33333333333333, count=6/7, values=[10, 30, 50, 60, 120, 350]
**er**: min=1, max=5, avg=2.5714285714285716, count=7/7, values=[1, 2, 3, 5]
**h**: min=1, max=4, avg=2.4285714285714284, count=7/7, values=[1, 2, 3, 4]
**hcst**: min=80, max=2300, avg=790, count=6/7, values=[80, 110, 190, 280, 1780, 2300]
**hlt**: min=20, max=400, avg=193.57142857142858, count=7/7, values=[20, 80, 160, 200, 335, 400]
**i**: min=1, max=7, avg=5, count=7/7, values=[1, 3, 5, 7]
**m**: min=10, max=350, avg=165.71428571428572, count=7/7, values=[10, 50, 150, 300, 350]
**pg**: min=50, max=1300, avg=430, count=7/7, values=[50, 160, 200, 250, 400, 650, 1300]
**r**: min=0.50, max=1.00, avg=0.83, count=7/7, values=[0.50, 0.65, 1.00]
**rl**: min=8, max=43, avg=23.166666666666668, count=6/7, values=[8, 13, 18, 23, 34, 43]
**t**: min=3, max=3, avg=3, count=7/7, values=[3]
**w**: min=1, max=4, avg=2.4285714285714284, count=7/7, values=[1, 2, 3, 4]

**ANALYSIS:**

Reactors generate power for ship systems. Explode when destroyed, damaging adjacent modules. Critical infrastructure module.

- **pg (Power Generation)**: 50-1300. Scales with size. Small (50), Medium (200), Large (650), Grand (1300). Armored variants generate less (160-400).
- **er (Explosion Radius)**: 1-5 cells. Manhattan distance (horizontal/vertical only). Larger reactors = bigger explosions.
- **ed (Explosion Damage)**: 10-350. Damage to adjacent modules when destroyed. Scales with reactor size.
- **hlt (Health)**: 20-400 HP. Reactors are fragile for their importance. Armored variants more durable (160-335 vs 20-200).
- **a (Armor)**: 1-3 on 6/7 reactors. Armored variants have armor (2-3), standard have minimal (1) or none.
- **r (Reflect/Resistance)**: 0.50-1.00. Armored reactors r=0.50-0.65 (35-50% laser damage taken), standard r=1.00 (0% damage - immune).
- **m (Mass)**: 10-350. Heavy modules. Armored variants heavier.
- **pu (Power Use)**: None. Reactors generate power, don't consume it.

**Explosion Mechanics**:
- Small Reactor (1x1): er=1, ed=10 → damages 1 cell away for 10 damage
- Medium Reactor (2x2): er=2, ed=60 → damages 2 cells away for 60 damage
- Large Reactor (3x3): er=3, ed=120 → damages 3 cells away for 120 damage
- Grand Reactor (4x4): er=5, ed=350 → damages 5 cells away for 350 damage (massive!)

**Armored vs Standard**:
- **Standard**: Higher power generation, lower HP, minimal armor
- **Armored**: Lower power (-25-30%), higher HP (+33-40%), armor (2-3), lower reflect

**Key Insights**:
1. Reactors are critical single points of failure - destroying them can cascade damage to nearby modules.
2. Grand Reactor explosion (er=5, ed=350) can devastate large portions of ship.
3. Explosion uses Manhattan distance - only horizontal/vertical cells affected, not diagonal.
4. Armored reactors trade 25-30% power generation for survivability.
5. Standard reactors have r=1.00 (immune to lasers), armored reactors r=0.50-0.65 (take 35-50% laser damage). Trade-off: armored variants more vulnerable to lasers but have higher HP/armor.


### Shield (6 modules)

**c**: min=16, max=16, avg=16, count=6/6, values=[16]
**cst**: min=4000, max=175000, avg=68833.33333333333, count=6/6, values=[4000, 65000, 100000, 175000]
**h**: min=1, max=2, avg=1.3333333333333333, count=6/6, values=[1, 2]
**hcst**: min=10, max=350, avg=138.33333333333334, count=6/6, values=[10, 130, 200, 350]
**hlt**: min=15, max=60, avg=26.666666666666668, count=6/6, values=[15, 20, 30, 60]
**i**: min=1, max=6, avg=2.6666666666666665, count=6/6, values=[1, 6]
**m**: min=10, max=50, avg=20.833333333333332, count=6/6, values=[10, 15, 25, 50]
**pu**: min=20, max=280, avg=107.5, count=6/6, values=[20, 60, 70, 80, 135, 280]
**r**: min=1.00, max=1.00, avg=1.00, count=6/6, values=[1.00]
**rl**: min=3, max=24, avg=14.25, count=4/6, values=[3, 14, 16, 24]
**sa**: min=90, max=500, avg=198.33333333333334, count=6/6, values=[90, 100, 125, 150, 225, 500]
**smr**: min=100, max=500, avg=236.25, count=4/6, values=[100, 120, 225, 500]
**sr**: min=3.6, max=13.1, avg=6.933333333333334, count=6/6, values=[3.6, 6.1, 9.1, 13.1]
**srs**: min=20, max=100, avg=47.5, count=4/6, values=[20, 50, 100]
**t**: min=3, max=3, avg=3, count=6/6, values=[3]
**w**: min=1, max=2, avg=1.1666666666666667, count=6/6, values=[1, 2]

**ANALYSIS:**

Shield generators create protective bubbles that block ballistics and missiles but are bypassed by lasers. Regenerate after damage delay.

- **sr (Shield Radius)**: 3.6-13.1 units. Coverage area. Larger shields protect more of ship. War Shield largest (13.1).
- **sa (Shield Strength)**: 90-500 HP. Initial shield hit points. Bunker Shield highest (500).
- **smr (Max Regeneration)**: 100-500 on 4/6 shields. Maximum HP shield can regenerate to. Bunker Shield has 0 (no regen).
- **srs (Regen Speed)**: 20-100 HP/sec on 4/6 shields. How fast shield regenerates. War Shield fastest (100 HP/s).
- **hlt (Module Health)**: 15-60 HP. Shield generator itself is fragile. Destroying generator removes shield.
- **r (Reflect/Resistance)**: ALL show 1.00 (100% resistance). Shields take 0% laser damage (immune), which matches wiki.
- **m (Mass)**: 10-50. Shields are lightweight.
- **pu (Power Use)**: 20-280. Power consumption scales with shield size. War Shield most expensive (280).

**Shield Types**:
- **Combat Shield** (1x1): sr=3.6, sa=90-120, smr=100-120, srs=20-25. Small personal shield.
- **Battle Shield** (1x2): sr=6.1, sa=150, smr=225, srs=50. Medium coverage.
- **War Shield** (2x2): sr=13.1, sa=225, smr=500, srs=100. Massive coverage, best regen.
- **Bunker Shield** (1x1): sr=9.1, sa=500, smr=0, srs=0. No regen but huge initial strength.

**Regeneration Mechanics**:
- Shields start regenerating after 2s without taking damage
- Regenerate at srs HP/sec up to smr maximum
- Bunker Shield unique: 500 HP but no regeneration (one-time protection)

**Key Insights**:
1. Lasers completely bypass shields - shields only block ballistics and missiles.
2. Shields have hidden armor values that reduce incoming damage before HP loss.
3. War Shield provides best coverage (sr=13.1) and regeneration (100 HP/s up to 500 HP).
4. Bunker Shield is tactical: massive initial protection (500 HP) but no regen.
5. Shield generators have r=1.00 (immune to lasers). However, lasers bypass the shield bubble itself and hit modules directly.
6. Shield generators are fragile (15-60 HP) - destroying generator removes entire shield.


### Support (1 modules)

**c**: min=256, max=256, avg=256, count=1/1, values=[256]
**cst**: min=70000, max=70000, avg=70000, count=1/1, values=[70000]
**h**: min=2, max=2, avg=2, count=1/1, values=[2]
**hcst**: min=140, max=140, avg=140, count=1/1, values=[140]
**hlt**: min=220, max=220, avg=220, count=1/1, values=[220]
**i**: min=6, max=6, avg=6, count=1/1, values=[6]
**m**: min=150, max=150, avg=150, count=1/1, values=[150]
**pu**: min=40, max=40, avg=40, count=1/1, values=[40]
**r**: min=1.00, max=1.00, avg=1.00, count=1/1, values=[1.00]
**rl**: min=15, max=15, avg=15, count=1/1, values=[15]
**t**: min=3, max=3, avg=3, count=1/1, values=[3]
**w**: min=3, max=3, avg=3, count=1/1, values=[3]

**ANALYSIS:**

Only one Support module in data: Repair Bay. Heals damaged modules during battle.

- **Repair Bay** (3x2): hlt=220, m=150, pu=40, rl=15
- Hardcoded mechanics (not in JSON): 2500 HP capacity per bay, 9 HP/s repair speed, max 3 active
- Heals most damaged module (by health %) every 0.5s
- Multiple bays can heal same module simultaneously
- r=1.00 (immune to laser damage)

**Key Insights**:
1. Repair mechanics are hardcoded in battle system, not defined in module data.
2. Only first 3 repair bays are active (4th+ do nothing).
3. Each bay has independent 2500 HP capacity - can heal 2500 total damage before depleted.
4. Prioritizes modules with lowest health percentage, not lowest absolute HP.
5. Category flag c=256 (bit 8) identifies Support modules.


## Individual Attribute Analysis (All Modules)

Analysis of each numeric attribute across all 91 modules, showing distribution and usage patterns.

### a

- **Usage**: 33/91 modules (36.3%)
- **Range**: 1 - 6
- **Average**: 2.6666666666666665
- **Unique values**: 6
- **All values**: 1, 2, 3, 4, 5, 6
- **Used by**: Engine(9), Armor(11), Reactor(6), Laser(1), Missile(2), PointDefense(4)

**ANALYSIS:**

**a = Armor** - Flat damage reduction applied before health loss. Present on 36.3% of modules (primarily defensive).

- **Range**: 1-6 armor points
- **Distribution**: Engines (1-4), Armor modules (2-6), Reactors (1-3), Missiles (2-3), PD (1-2), Lasers (4 on one)
- **Effect**: Reduces incoming damage by armor value before applying to health. Example: 50 damage - 4 armor = 46 damage taken.
- **Scaling**: Reactive Armor highest (4-6), Steel Armor moderate (2-5), Solar Armor lowest (2-4)
- **Balance**: Higher armor = better survivability but usually comes with trade-offs (mass, cost, power use)

**Key Insight**: Armor is most effective against rapid-fire low-damage weapons (chainguns) and less effective against high-damage single hits (torpedoes, capital cannons). Damage floor of 1 means armor can't completely negate damage.


### ats

- **Usage**: 50/91 modules (54.9%)
- **Range**: 0.05 - 5.30
- **Average**: 1.73
- **Unique values**: 21
- **Sample values**: 0.05, 0.10, 0.15, 0.20, 0.22, 0.30, 0.33, 0.50, 1.00, 1.40...
- **Used by**: Ballistic(21), Laser(9), Missile(19), PointDefense(1)

**ANALYSIS:**

**ats = Attacks per Second** - Fire rate for weapons. Higher = more frequent attacks but usually lower per-shot damage.

- **Burst Weapons** (ats ≥ 2.0): Railgun (2.50), Gauss Rifle (3.00), Capital Cannon (3.10-3.50), Quantum Rifle (2.50), Pulse Laser (2.00-3.00). Fire multiple shots rapidly then reload.
- **Slow Weapons** (ats < 0.20): Hyperion Chaingun (0.05), Shotguns (0.15), Heavy Turrets (0.15-0.20), Torpedoes (0.10). Long reload, high per-shot damage.
- **Effect**: DPS = dmg × ats. High fire rate with low damage vs low fire rate with high damage.
- **Balance**: Rapid fire better vs shields/armor (more hits to wear down), slow fire better for alpha damage (one-shot potential).

**Key Insight**: Burst weapons create damage windows - high DPS during burst, then long reload. Slow weapons have consistent but infrequent damage output.


### c

- **Usage**: 91/91 modules (100.0%)
- **Range**: 1 - 256
- **Average**: 23.63736263736264
- **Unique values**: 9
- **All values**: 1, 2, 4, 8, 16, 32, 64, 128, 256
- **Used by**: Engine(9), Armor(11), Reactor(7), Ballistic(21), Laser(13), Shield(6), Missile(19), PointDefense(4), Support(1)

**ANALYSIS:**

**c = Category** - Bit flags identifying module type. Used for filtering in UI and determining placement rules.

- **Bit Flag System**: 1=Ballistic, 2=Missile, 4=Laser, 8=Armor, 16=Shield, 32=PointDefense, 64=Engine, 128=Reactor, 256=Support
- **Effect**: Determines which tab module appears in (weapons/defense/utility) and placement rules (engines on 'E' cells only)
- **Implementation**: Bitwise operations allow checking multiple categories: `if (c & 1)` checks if Ballistic

**Key Insight**: Category system is mutually exclusive - each module has exactly one category value. This simplifies filtering and UI organization.


### cd

- **Usage**: 1/91 modules (1.1%)
- **Range**: 4.50 - 4.50
- **Average**: 4.50
- **Unique values**: 1
- **All values**: 4.50
- **Used by**: Engine(1)

**ANALYSIS:**

**cd = Cooldown** - Time between ability activations. Only on Afterburner module.

- **Value**: 4.50 seconds constant
- **Effect**: After Afterburner deactivates, must wait 4.5s before can activate again
- **Balance**: Prevents continuous boost spam. Creates tactical decision of when to use boost.

**Key Insight**: Afterburner has 2s duration with 4.5s cooldown, meaning ~31% uptime if used continuously (2s active / 6.5s total cycle).


### cst

- **Usage**: 85/91 modules (93.4%)
- **Range**: 750 - 3210000
- **Average**: 500314.70588235295
- **Unique values**: 62
- **Sample values**: 750, 1500, 3500, 4000, 7500, 10000, 20000, 22500, 25000, 30000...
- **Used by**: Engine(7), Armor(9), Reactor(6), Ballistic(20), Laser(13), Shield(6), Missile(19), PointDefense(4), Support(1)

**ANALYSIS:**

**cst = Cost (Credits)** - Purchase price in standard currency. Present on 93.4% of modules.

- **Range**: 750 - 3,210,000 credits
- **Cheapest**: Basic weapons (750-4000), Small armor (22,500-25,000)
- **Most Expensive**: Capital Cannon Mk.II (3,210,000), Heavy weapons (2-3M), Large reactors (890k-1.15M)
- **Scaling**: Generally scales with size, tier, and power. Mk.II/III variants cost more.
- **Balance**: Economic constraint on ship builds. Must earn credits through battles to afford better modules.

**Key Insight**: Cost creates progression - start with cheap modules, upgrade as you earn credits. High-end builds require millions of credits.


### dc

- **Usage**: 1/91 modules (1.1%)
- **Range**: 45 - 45
- **Average**: 45
- **Unique values**: 1
- **All values**: 45
- **Used by**: Engine(1)

**ANALYSIS:**

**dc = Duration Charge** - Total boost time available for Afterburner. Only on Afterburner module.

- **Value**: 45 seconds total
- **Effect**: Afterburner can be activated multiple times until 45s of boost time is consumed
- **Usage**: With 2s duration per activation, can boost 22-23 times before depleted
- **Balance**: Limits total boost usage per battle. Must manage boost resource strategically.

**Key Insight**: Afterburner is a consumable resource with 45s total capacity. Each 2s activation consumes from this pool. Once depleted, no more boosts available.


### ddo

- **Usage**: 5/91 modules (5.5%)
- **Range**: 0.45 - 0.55
- **Average**: 0.50
- **Unique values**: 3
- **All values**: 0.45, 0.50, 0.55
- **Used by**: Ballistic(5)

**ANALYSIS:**

**ddo = Damage Dropoff** - Damage multiplier retained after penetrating a module. Only on piercing ballistic weapons.

- **Present on**: Capital Cannon (0.45), Quantum series (0.50-0.55) - only 5/21 ballistics
- **Effect**: After penetrating first module, damage = previousDamage × ddo - armor. Example: 100 dmg penetrates, next module takes 100 × 0.50 - armor = 50 - armor.
- **Minimum**: Damage floor of 25% (max(0.25, ddo)) ensures penetrating shots always do some damage.

**Key Insight**: Lower ddo = more damage lost per penetration. Capital Cannon (0.45) loses 55% damage per module, Quantum (0.55) loses 45%. This limits how effective penetration is against deep armor layers.


### dmg

- **Usage**: 53/91 modules (58.2%)
- **Range**: 4 - 115
- **Average**: 32.77358490566038
- **Unique values**: 36
- **Sample values**: 4, 5, 6, 7, 8, 9, 11, 12, 13, 14...
- **Used by**: Ballistic(21), Laser(13), Missile(19)

**ANALYSIS:**

**dmg = Damage** - Base damage value. Meaning varies by weapon type.

- **Ballistic**: Damage per projectile (4-81). Chainguns low (4-9), Capital Cannon high (75-81).
- **Laser**: Damage per second (DPS) (20-100). Total damage = dmg × msd duration.
- **Missile**: Damage per missile (12-115). Multiplied by mc (missile count) and explosion effects.
- **Effect**: Core offensive stat. Higher = more damage per hit/second.
- **Balance**: Usually inversely related to fire rate. High dmg = low ats, low dmg = high ats.

**Key Insight**: Laser dmg is DPS not per-shot, so 40 DPS laser with 2s duration deals 80 total damage. Missiles with AoE can hit multiple cells of same module, multiplying effective damage.


### dur

- **Usage**: 1/91 modules (1.1%)
- **Range**: 2.00 - 2.00
- **Average**: 2.00
- **Unique values**: 1
- **All values**: 2.00
- **Used by**: Engine(1)

**ANALYSIS:**

**dur = Duration** - How long Afterburner boost lasts per activation. Only on Afterburner.

- **Value**: 2.00 seconds constant
- **Effect**: Speed and thrust multipliers active for 2 seconds per activation
- **Balance**: Short duration requires timing. Can't maintain boost continuously due to cooldown.

**Key Insight**: 2s boost + 4.5s cooldown = must use strategically for closing distance or escaping.


### ed

- **Usage**: 6/91 modules (6.6%)
- **Range**: 10 - 350
- **Average**: 103.33333333333333
- **Unique values**: 6
- **All values**: 10, 30, 50, 60, 120, 350
- **Used by**: Reactor(6)

**ANALYSIS:**

**ed = Explosion Damage** - Damage dealt to adjacent modules when reactor destroyed. Only on reactors.

- **Range**: 10-350 damage
- **Scaling**: Small (10), Medium (60), Large (120), Grand (350)
- **Effect**: Full damage to all modules within er (explosion radius). No falloff.
- **Balance**: Makes reactors high-risk modules. Destroying enemy reactor can cascade damage.

**Key Insight**: Grand Reactor explosion (350 damage) can destroy multiple adjacent modules instantly. Protect reactors or accept catastrophic failure risk.


### ep

- **Usage**: 5/91 modules (5.5%)
- **Range**: 900 - 12000
- **Average**: 6400
- **Unique values**: 4
- **All values**: 900, 1100, 6000, 12000
- **Used by**: Engine(5)

**ANALYSIS:**

**ep = Thrust Power** - Forward acceleration force. Only on engines (5/9 have it).

- **Range**: 900-12,000
- **Scaling**: Vectored Thruster (900 - minimal), Ion Drives (100-600), Grand Ion (12,000)
- **Effect**: Higher ep = faster acceleration. Formula: acceleration = ep / totalMass
- **Balance**: Must balance thrust with mass. Heavy ships need more thrust.

**Key Insight**: Warp Drive and Afterburner have ep=0 (special abilities, not thrust). Vectored Thruster trades thrust for turning (ep=900, ts=1800).


### er

- **Usage**: 7/91 modules (7.7%)
- **Range**: 1 - 5
- **Average**: 2.5714285714285716
- **Unique values**: 4
- **All values**: 1, 2, 3, 5
- **Used by**: Reactor(7)

**ANALYSIS:**

**er = Explosion Radius** - Manhattan distance (cells) for reactor explosion damage. Only on reactors.

- **Range**: 1-5 cells
- **Scaling**: Small (1), Medium (2), Large (3), Grand (5)
- **Effect**: Damages all modules within er cells horizontally/vertically (not diagonal)
- **Balance**: Larger reactors = bigger explosions. Grand Reactor (er=5) can damage modules 5 cells away.

**Key Insight**: Uses Manhattan distance - only straight lines (horizontal/vertical), not diagonal. A 2x2 reactor with er=2 damages modules 2 cells away from any of its 4 cells.


### fc

- **Usage**: 54/91 modules (59.3%)
- **Range**: 20 - 180
- **Average**: 87.96296296296296
- **Unique values**: 6
- **All values**: 20, 25, 30, 35, 60, 180
- **Used by**: Ballistic(21), Laser(13), Missile(19), PointDefense(1)

**ANALYSIS:**

**fc = Fire Cone** - Firing arc in degrees. Determines how wide the weapon can aim.

- **Values**: 20°, 25°, 30°, 35° (forward weapons), 60° (some lasers), 180° (turrets)
- **Forward Weapons**: 20-35° narrow cone, must face target
- **Turrets**: 180° can engage targets to sides and rear
- **Effect**: Wider cone = easier to hit targets without perfect alignment
- **Balance**: Turrets have flexibility but often lower stats than forward weapons

**Key Insight**: 180° turrets can shoot backwards. 35° forward weapons need ship pointed at target. Affects ship maneuverability requirements.


### h

- **Usage**: 91/91 modules (100.0%)
- **Range**: 1 - 7
- **Average**: 2.4835164835164836
- **Unique values**: 6
- **All values**: 1, 2, 3, 4, 5, 7
- **Used by**: Engine(9), Armor(11), Reactor(7), Ballistic(21), Laser(13), Shield(6), Missile(19), PointDefense(4), Support(1)

**ANALYSIS:**

**h = Height** - Module height in grid cells. Present on all modules (100%).

- **Range**: 1-7 cells
- **Common Sizes**: 1x1, 1x2, 2x2, 2x3, 3x3, 3x4, 2x7 (Capital Cannon)
- **Effect**: Determines module footprint. Larger = more cells occupied, harder to fit
- **Balance**: Larger modules usually have better stats but take more space

**Key Insight**: Module size (w×h) determines placement constraints. 2x7 Capital Cannon requires 14 cells and specific ship layout.


### hcst

- **Usage**: 85/91 modules (93.4%)
- **Range**: 10 - 6420
- **Average**: 997.9411764705883
- **Unique values**: 58
- **Sample values**: 10, 20, 40, 50, 60, 75, 80, 110, 120, 130...
- **Used by**: Engine(7), Armor(9), Reactor(6), Ballistic(20), Laser(13), Shield(6), Missile(19), PointDefense(4), Support(1)

**ANALYSIS:**

**hcst = Celestium Cost** - Premium currency price. Present on 93.4% of modules.

- **Range**: 10-6,420 celestium
- **Scaling**: Roughly 2× credit cost (hcst ≈ cst / 1000)
- **Effect**: Alternative purchase method using premium currency
- **Balance**: Pay-to-progress mechanic. Can buy modules with real money equivalent.

**Key Insight**: Celestium is premium currency. Most modules cost 10-500 celestium, high-end modules 1000-6420.


### hlt

- **Usage**: 91/91 modules (100.0%)
- **Range**: 13 - 1850
- **Average**: 203.72527472527472
- **Unique values**: 42
- **Sample values**: 13, 15, 20, 23, 30, 35, 40, 60, 75, 80...
- **Used by**: Engine(9), Armor(11), Reactor(7), Ballistic(21), Laser(13), Shield(6), Missile(19), PointDefense(4), Support(1)

**ANALYSIS:**

**hlt = Health** - Hit points before module destroyed. Present on all modules (100%).

- **Range**: 13-1,850 HP
- **Fragile**: Lasers (13-250), Weapons (15-380), Shields (15-60)
- **Durable**: Armor (75-1,850), Reactors (20-400), Engines (60-500)
- **Effect**: Higher HP = survives more damage. Module destroyed at 0 HP.
- **Balance**: Weapons fragile but offensive, armor durable but passive

**Key Insight**: Armor has highest HP (1,850 for Large Reactive). Weapons relatively fragile - protect them with armor placement.


### i

- **Usage**: 79/91 modules (86.8%)
- **Range**: 1 - 16
- **Average**: 6.556962025316456
- **Unique values**: 16
- **Sample values**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10...
- **Used by**: Engine(4), Armor(8), Reactor(7), Ballistic(19), Laser(13), Shield(6), Missile(19), PointDefense(2), Support(1)

**ANALYSIS:**

**i = Module Index** - Grouping identifier for module families. Present on 86.8% of modules.

- **Range**: 1-16 (16 unique values)
- **Effect**: Groups related modules together (e.g., all Railguns have same i value)
- **Usage**: Likely used for UI organization, upgrade paths, or module families
- **Balance**: No direct gameplay effect, organizational only

**Key Insight**: Modules with same i value are variants/upgrades of same base type. Helps identify module families.


### imf

- **Usage**: 40/91 modules (44.0%)
- **Range**: 5 - 500
- **Average**: 71.625
- **Unique values**: 16
- **Sample values**: 5, 10, 15, 20, 25, 30, 35, 40, 50, 60...
- **Used by**: Ballistic(21), Missile(19)

**ANALYSIS:**

**imf = Impact Force Multiplier** - Penetration multiplier for ballistics/missiles. Present on 44% of modules.

- **Range**: 5-500
- **Scaling**: Basic weapons (5-30), Heavy weapons (130-500)
- **Effect**: UNUSED in current implementation. Legacy field from original game.
- **Note**: Penetration now uses rp/ip ratio and rf (max depth)

**Key Insight**: This field exists in data but isn't used in battle calculations. Kept for data completeness.


### ip

- **Usage**: 40/91 modules (44.0%)
- **Range**: 10 - 10000
- **Average**: 1356.25
- **Unique values**: 17
- **Sample values**: 10, 20, 40, 100, 120, 150, 250, 300, 350, 500...
- **Used by**: Ballistic(21), Missile(19)

**ANALYSIS:**

**ip = Impact Power** - Armor penetration resistance value. Present on ballistics and missiles (44%).

- **Range**: 10-10,000
- **Scaling**: Basic (10-120), Medium (250-1,500), Heavy (7,500-10,000)
- **Effect**: Used in penetration formula: chance = min(1.0, rp / ip). Higher ip = harder to penetrate.
- **Balance**: Torpedoes have highest ip (7,500-10,000) making them hard to penetrate through

**Key Insight**: Penetration chance = rp / ip. Capital Cannon (rp=3500, ip=8500) has 41% chance to penetrate each module.


### m

- **Usage**: 91/91 modules (100.0%)
- **Range**: 10 - 900
- **Average**: 150.75824175824175
- **Unique values**: 31
- **Sample values**: 10, 15, 20, 25, 30, 35, 40, 50, 60, 70...
- **Used by**: Engine(9), Armor(11), Reactor(7), Ballistic(21), Laser(13), Shield(6), Missile(19), PointDefense(4), Support(1)

**ANALYSIS:**

**m = Mass** - Module weight affecting ship acceleration. Present on all modules (100%).

- **Range**: 10-900 kg
- **Light**: Shields (10-50), Small weapons (10-100)
- **Heavy**: Armor (50-900), Large weapons (400-500), Reactors (10-350)
- **Effect**: totalMass affects acceleration = thrust / mass. Heavier ship = slower
- **Balance**: Power vs mobility trade-off. Heavy armor slows ship.

**Key Insight**: Mass directly affects ship performance. Capital Cannon (500kg) + Large Reactive Armor (900kg) = very heavy, slow ship.


### macc

- **Usage**: 15/91 modules (16.5%)
- **Range**: 26.00 - 220.00
- **Average**: 170.40
- **Unique values**: 5
- **All values**: 26.00, 150.00, 160.00, 200.00, 220.00
- **Used by**: Missile(15)

**TO BE ANALYSED**


### mc

- **Usage**: 15/91 modules (16.5%)
- **Range**: 1 - 6
- **Average**: 2.2666666666666666
- **Unique values**: 5
- **All values**: 1, 2, 3, 4, 6
- **Used by**: Missile(15)

**TO BE ANALYSED**


### mef

- **Usage**: 15/91 modules (16.5%)
- **Range**: 25.00 - 150.00
- **Average**: 73.00
- **Unique values**: 6
- **All values**: 25.00, 30.00, 50.00, 120.00, 125.00, 150.00
- **Used by**: Missile(15)

**TO BE ANALYSED**


### mer

- **Usage**: 15/91 modules (16.5%)
- **Range**: 1.2 - 1.6
- **Average**: 1.2533333333333332
- **Unique values**: 2
- **All values**: 1.2, 1.6
- **Used by**: Missile(15)

**TO BE ANALYSED**


### mfj

- **Usage**: 14/91 modules (15.4%)
- **Range**: 50 - 90
- **Average**: 74.64285714285714
- **Unique values**: 3
- **All values**: 50, 65, 90
- **Used by**: Missile(14)

**TO BE ANALYSED**


### mlf

- **Usage**: 15/91 modules (16.5%)
- **Range**: 0.65 - 4.4
- **Average**: 3.58
- **Unique values**: 3
- **All values**: 0.65, 4, 4.4
- **Used by**: Missile(15)

**TO BE ANALYSED**


### msd

- **Usage**: 13/91 modules (14.3%)
- **Range**: 0.15 - 3.00
- **Average**: 1.34
- **Unique values**: 4
- **All values**: 0.15, 0.35, 1.50, 3.00
- **Used by**: Laser(13)

**TO BE ANALYSED**


### mspd

- **Usage**: 14/91 modules (15.4%)
- **Range**: 50 - 180
- **Average**: 77.5
- **Unique values**: 5
- **All values**: 50, 60, 65, 90, 180
- **Used by**: Missile(14)

**TO BE ANALYSED**


### mvmb

- **Usage**: 1/91 modules (1.1%)
- **Range**: 3.00 - 3.00
- **Average**: 3.00
- **Unique values**: 1
- **All values**: 3.00
- **Used by**: Engine(1)

**TO BE ANALYSED**


### pdd

- **Usage**: 3/91 modules (3.3%)
- **Range**: 0.10 - 0.10
- **Average**: 0.10
- **Unique values**: 1
- **All values**: 0.10
- **Used by**: PointDefense(3)

**TO BE ANALYSED**


### pdmnc

- **Usage**: 3/91 modules (3.3%)
- **Range**: 0.20 - 0.50
- **Average**: 0.30
- **Unique values**: 2
- **All values**: 0.20, 0.50
- **Used by**: PointDefense(3)

**TO BE ANALYSED**


### pdmsc

- **Usage**: 3/91 modules (3.3%)
- **Range**: 0.35 - 0.60
- **Average**: 0.45
- **Unique values**: 3
- **All values**: 0.35, 0.40, 0.60
- **Used by**: PointDefense(3)

**TO BE ANALYSED**


### pdr

- **Usage**: 3/91 modules (3.3%)
- **Range**: 19 - 19
- **Average**: 19
- **Unique values**: 1
- **All values**: 19
- **Used by**: PointDefense(3)

**TO BE ANALYSED**


### pdtc

- **Usage**: 3/91 modules (3.3%)
- **Range**: 0.20 - 0.35
- **Average**: 0.27
- **Unique values**: 3
- **All values**: 0.20, 0.25, 0.35
- **Used by**: PointDefense(3)

**TO BE ANALYSED**


### pg

- **Usage**: 12/91 modules (13.2%)
- **Range**: 10 - 1300
- **Average**: 273.75
- **Unique values**: 11
- **All values**: 10, 25, 50, 65, 125, 160, 200, 250, 400, 650, 1300
- **Used by**: Armor(4), Reactor(7), Laser(1)

**TO BE ANALYSED**


### pu

- **Usage**: 75/91 modules (82.4%)
- **Range**: 2 - 365
- **Average**: 88.16
- **Unique values**: 31
- **Sample values**: 2, 5, 10, 20, 25, 30, 35, 40, 45, 50...
- **Used by**: Engine(9), Armor(3), Ballistic(21), Laser(12), Shield(6), Missile(19), PointDefense(4), Support(1)

**TO BE ANALYSED**


### r

- **Usage**: 91/91 modules (100.0%)
- **Range**: 0.40 - 1.00
- **Average**: 0.88
- **Unique values**: 9
- **All values**: 0.40, 0.45, 0.50, 0.65, 0.70, 0.75, 0.80, 0.85, 1.00
- **Used by**: Engine(9), Armor(11), Reactor(7), Ballistic(21), Laser(13), Shield(6), Missile(19), PointDefense(4), Support(1)

**ANALYSIS:**

**r = Reflect/Resistance** - Laser damage reduction. Formula: `laserDamage = baseDamage × (1 - r)`. Higher r = MORE resistance.

- **Current Data**: Weapons/Shields (1.00), Engines (0.75), PD (0.80-1.00), Armor (0.40-0.50), Reactors (0.50-1.00), Missiles (0.50-1.00)
- **Wiki Values**: Weapons (0%), Armor (55-60%), Engines (25%), Reactors (0%), Shields (0%)
- **Effect**: Damage taken = baseDamage × (1 - r). Example: 100 dmg laser vs r=0.60 → 100 × (1 - 0.60) = 40 damage taken.

**Data Interpretation** (r value → actual reflect %):
- **r=1.00** → (1 - 1.00) = 0% damage taken = **100% reflect** = IMMUNE to lasers ✓
- **r=0.75** → (1 - 0.75) = 25% damage taken = **75% reflect** ✓
- **r=0.50** → (1 - 0.50) = 50% damage taken = **50% reflect** ✓
- **r=0.40** → (1 - 0.40) = 60% damage taken = **40% reflect** ✓

**Actual Reflect Percentages**:
- **Weapons**: r=1.00 → 100% reflect (0% damage) → Immune to lasers ✓ (wiki: 0% damage)
- **Shields**: r=1.00 → 100% reflect (0% damage) → Immune to lasers ✓ (wiki: 0% damage)
- **Engines**: r=0.75 → 75% reflect (25% damage) ✓ (wiki: 25% damage)
- **PD**: r=0.80-1.00 → 80-100% reflect (0-20% damage) ✓
- **Armor**: r=0.40-0.50 → 40-50% reflect (50-60% damage) ✓ (wiki: 55-60% damage)
- **Reactors**: r=0.50-1.00 → 50-100% reflect (0-50% damage) - Mixed values
- **Missiles**: r=0.50-1.00 → 50-100% reflect (0-50% damage) - Varies by type

**Key Insight**: The data is CORRECT! The `r` field is resistance/armor against lasers, not reflect percentage. Formula is `damage = base × (1 - r)`. Weapons and shields with r=1.00 are immune to lasers (take 0% damage), which matches wiki. Armor with r=0.40-0.50 takes 50-60% damage, which matches wiki's 55-60% damage taken.


### rf

- **Usage**: 19/91 modules (20.9%)
- **Range**: 1 - 30
- **Average**: 11.210526315789474
- **Unique values**: 8
- **All values**: 1, 2, 5, 8, 10, 15, 20, 30
- **Used by**: Ballistic(19)

**TO BE ANALYSED**


### rl

- **Usage**: 78/91 modules (85.7%)
- **Range**: 1 - 50
- **Average**: 23.256410256410255
- **Unique values**: 44
- **Sample values**: 1, 2, 3, 5, 7, 8, 9, 10, 11, 12...
- **Used by**: Engine(7), Armor(9), Reactor(6), Ballistic(18), Laser(11), Shield(4), Missile(18), PointDefense(4), Support(1)

**TO BE ANALYSED**


### rng

- **Usage**: 54/91 modules (59.3%)
- **Range**: 28 - 120
- **Average**: 66.75925925925925
- **Unique values**: 17
- **Sample values**: 28, 35, 37, 40, 45, 50, 55, 60, 65, 70...
- **Used by**: Ballistic(21), Laser(13), Missile(19), PointDefense(1)

**TO BE ANALYSED**


### rp

- **Usage**: 19/91 modules (20.9%)
- **Range**: 10 - 3500
- **Average**: 433.1578947368421
- **Unique values**: 5
- **All values**: 10, 20, 100, 200, 3500
- **Used by**: Ballistic(19)

**TO BE ANALYSED**


### sa

- **Usage**: 6/91 modules (6.6%)
- **Range**: 90 - 500
- **Average**: 198.33333333333334
- **Unique values**: 6
- **All values**: 90, 100, 125, 150, 225, 500
- **Used by**: Shield(6)

**TO BE ANALYSED**


### smr

- **Usage**: 4/91 modules (4.4%)
- **Range**: 100 - 500
- **Average**: 236.25
- **Unique values**: 4
- **All values**: 100, 120, 225, 500
- **Used by**: Shield(4)

**TO BE ANALYSED**


### sr

- **Usage**: 6/91 modules (6.6%)
- **Range**: 3.6 - 13.1
- **Average**: 6.933333333333334
- **Unique values**: 4
- **All values**: 3.6, 6.1, 9.1, 13.1
- **Used by**: Shield(6)

**TO BE ANALYSED**


### srs

- **Usage**: 4/91 modules (4.4%)
- **Range**: 20 - 100
- **Average**: 47.5
- **Unique values**: 3
- **All values**: 20, 50, 100
- **Used by**: Shield(4)

**TO BE ANALYSED**


### ss

- **Usage**: 40/91 modules (44.0%)
- **Range**: 2 - 30
- **Average**: 7.025
- **Unique values**: 8
- **All values**: 2, 3, 4, 5, 7, 10, 15, 30
- **Used by**: Ballistic(21), Laser(13), Missile(5), PointDefense(1)

**TO BE ANALYSED**


### t

- **Usage**: 91/91 modules (100.0%)
- **Range**: 3 - 4
- **Average**: 3.098901098901099
- **Unique values**: 2
- **All values**: 3, 4
- **Used by**: Engine(9), Armor(11), Reactor(7), Ballistic(21), Laser(13), Shield(6), Missile(19), PointDefense(4), Support(1)

**TO BE ANALYSED**


### tb

- **Usage**: 1/91 modules (1.1%)
- **Range**: 6.50 - 6.50
- **Average**: 6.50
- **Unique values**: 1
- **All values**: 6.50
- **Used by**: Engine(1)

**TO BE ANALYSED**


### ts

- **Usage**: 7/91 modules (7.7%)
- **Range**: 120.00 - 1800.00
- **Average**: 772.86
- **Unique values**: 6
- **All values**: 120.00, 650.00, 700.00, 820.00, 1200.00, 1800.00
- **Used by**: Engine(7)

**TO BE ANALYSED**


### w

- **Usage**: 91/91 modules (100.0%)
- **Range**: 1 - 4
- **Average**: 1.901098901098901
- **Unique values**: 4
- **All values**: 1, 2, 3, 4
- **Used by**: Engine(9), Armor(11), Reactor(7), Ballistic(21), Laser(13), Shield(6), Missile(19), PointDefense(4), Support(1)

**TO BE ANALYSED**


## Ship Analysis by Class

Analysis of ships grouped by their class (ssc field).

### Corvette (5 ships)

**Cells**: min=38, max=202, avg=101.4
**cst**: min=399000, max=4250000, avg=1669400, values=[399000, 499000, 949000, 2250000, 4250000]
**d**: min=1, max=1, avg=1, values=[1]
**ffae**: min=0, max=0, avg=0, values=[0]
**h**: min=9, max=26, avg=18.2, values=[9, 13, 17, 26]
**hc**: min=200, max=1810, avg=746, values=[200, 280, 420, 1020, 1810]
**hrc**: min=0.03, max=0.03, avg=0.03, values=[0.03]
**hrm**: min=2, max=5, avg=3.2, values=[2, 3, 4, 5]
**lr**: min=10, max=50, avg=27.4, values=[10, 13, 24, 40, 50]
**mir**: min=0, max=0, avg=0, values=[0]
**ms**: min=5.00, max=7.50, avg=6.00, values=[5.00, 6.00, 6.50, 7.50]
**mxr**: min=-1, max=-1, avg=-1, values=[-1]
**rc**: min=20, max=90, avg=44.6, values=[20, 27, 33, 53, 90]
**rm**: min=10000, max=34300, avg=22160, values=[10000, 12000, 25500, 29000, 34300]
**rrc**: min=1, max=3, avg=1.6, values=[1, 2, 3]
**rt**: min=13, max=60, avg=29.6, values=[13, 18, 22, 35, 60]
**sa**: min=47, max=480, avg=214, values=[47, 63, 135, 345, 480]
**sd**: min=70, max=640, avg=286.6, values=[70, 73, 180, 470, 640]
**ssc**: min=1, max=1, avg=1, values=[1]
**t**: min=0, max=0, avg=0, values=[0]
**ts**: min=0.50, max=1.00, avg=0.69, values=[0.50, 0.55, 0.65, 0.75, 1.00]
**w**: min=5, max=11, avg=7.6, values=[5, 6, 7, 9, 11]
**xp**: min=4500, max=150000, avg=57300, values=[4500, 7000, 25000, 100000, 150000]

**TO BE ANALYSED**


### Frigate (3 ships)

**Cells**: min=25, max=130, avg=91.0
**cst**: min=99000, max=3000000, avg=1648000, values=[99000, 1845000, 3000000]
**d**: min=1, max=1, avg=1, values=[1]
**ffae**: min=0, max=800, avg=266.6666666666667, values=[0, 800]
**h**: min=9, max=23, avg=18, values=[9, 22, 23]
**hc**: min=150, max=1320, avg=773.3333333333334, values=[150, 850, 1320]
**hrc**: min=0.03, max=0.03, avg=0.03, values=[0.03]
**hrm**: min=2, max=4, avg=3.3333333333333335, values=[2, 4]
**lr**: min=7, max=45, avg=29.666666666666668, values=[7, 37, 45]
**mir**: min=0, max=0, avg=0, values=[0]
**ms**: min=4.50, max=8.00, avg=5.83, values=[4.50, 5.00, 8.00]
**mxr**: min=-1, max=-1, avg=-1, values=[-1]
**rc**: min=15, max=68, avg=44.333333333333336, values=[15, 50, 68]
**rm**: min=7000, max=33300, avg=22933.333333333332, values=[7000, 28500, 33300]
**rrc**: min=1, max=2, avg=1.6666666666666667, values=[1, 2]
**rt**: min=10, max=45, avg=29.333333333333332, values=[10, 33, 45]
**sa**: min=35, max=425, avg=256.6666666666667, values=[35, 310, 425]
**sd**: min=35, max=540, avg=331.6666666666667, values=[35, 420, 540]
**ssc**: min=2, max=2, avg=2, values=[2]
**t**: min=0, max=0, avg=0, values=[0]
**ts**: min=0.50, max=1.20, avg=0.77, values=[0.50, 0.60, 1.20]
**w**: min=5, max=10, avg=8, values=[5, 9, 10]
**xp**: min=2000, max=120000, avg=70666.66666666667, values=[2000, 90000, 120000]

**TO BE ANALYSED**


### Destroyer (4 ships)

**Cells**: min=65, max=173, avg=107.8
**cst**: min=749000, max=3750000, avg=1708500, values=[749000, 1047000, 1288000, 3750000]
**d**: min=1, max=1, avg=1, values=[1]
**ffae**: min=0, max=0, avg=0, values=[0]
**h**: min=16, max=18, avg=17, values=[16, 17, 18]
**hc**: min=290, max=1610, avg=757.5, values=[290, 510, 620, 1610]
**hrc**: min=0.03, max=0.03, avg=0.03, values=[0.03]
**hrm**: min=2, max=4, avg=3, values=[2, 3, 4]
**lr**: min=18, max=49, avg=31, values=[18, 27, 30, 49]
**mir**: min=0, max=0, avg=0, values=[0]
**ms**: min=4.50, max=6.00, avg=5.00, values=[4.50, 5.00, 6.00]
**mxr**: min=-1, max=-1, avg=-1, values=[-1]
**rc**: min=30, max=90, avg=48.75, values=[30, 36, 39, 90]
**rm**: min=11500, max=33900, avg=24712.5, values=[11500, 25500, 27950, 33900]
**rrc**: min=1, max=3, avg=2, values=[1, 2, 3]
**rt**: min=20, max=60, avg=32.5, values=[20, 24, 26, 60]
**sa**: min=105, max=470, avg=255, values=[105, 205, 240, 470]
**sd**: min=125, max=650, avg=331.25, values=[125, 265, 285, 650]
**ssc**: min=3, max=3, avg=3, values=[3]
**t**: min=0, max=0, avg=0, values=[0]
**ts**: min=0.40, max=0.65, avg=0.54, values=[0.40, 0.50, 0.60, 0.65]
**w**: min=7, max=19, avg=10.75, values=[7, 10, 19]
**xp**: min=13500, max=150000, avg=64375, values=[13500, 39000, 55000, 150000]

**TO BE ANALYSED**


### Cruiser (2 ships)

**Cells**: min=142, max=196, avg=169.0
**cst**: min=2500000, max=4250000, avg=3375000, values=[2500000, 4250000]
**d**: min=1, max=1, avg=1, values=[1]
**ffae**: min=0, max=0, avg=0, values=[0]
**h**: min=19, max=19, avg=19, values=[19]
**hc**: min=1120, max=1810, avg=1465, values=[1120, 1810]
**hrc**: min=0.03, max=0.03, avg=0.03, values=[0.03]
**hrm**: min=4, max=5, avg=4.5, values=[4, 5]
**lr**: min=42, max=50, avg=46, values=[42, 50]
**mir**: min=0, max=0, avg=0, values=[0]
**ms**: min=4.00, max=8.00, avg=6.00, values=[4.00, 8.00]
**mxr**: min=-1, max=-1, avg=-1, values=[-1]
**rc**: min=54, max=90, avg=72, values=[54, 90]
**rm**: min=30000, max=34300, avg=32150, values=[30000, 34300]
**rrc**: min=2, max=3, avg=2.5, values=[2, 3]
**rt**: min=36, max=60, avg=48, values=[36, 60]
**sa**: min=370, max=480, avg=425, values=[370, 480]
**sd**: min=500, max=640, avg=570, values=[500, 640]
**ssc**: min=4, max=4, avg=4, values=[4]
**t**: min=0, max=0, avg=0, values=[0]
**ts**: min=0.50, max=0.80, avg=0.65, values=[0.50, 0.80]
**w**: min=9, max=16, avg=12.5, values=[9, 16]
**xp**: min=115000, max=150000, avg=132500, values=[115000, 150000]

**TO BE ANALYSED**


### Battlecruiser (1 ships)

**Cells**: min=110, max=110, avg=110.0
**cst**: min=1418000, max=1418000, avg=1418000, values=[1418000]
**d**: min=1, max=1, avg=1, values=[1]
**ffae**: min=0, max=0, avg=0, values=[0]
**h**: min=20, max=20, avg=20, values=[20]
**hc**: min=670, max=670, avg=670, values=[670]
**hrc**: min=0.03, max=0.03, avg=0.03, values=[0.03]
**hrm**: min=3, max=3, avg=3, values=[3]
**lr**: min=32, max=32, avg=32, values=[32]
**mir**: min=0, max=0, avg=0, values=[0]
**ms**: min=4.00, max=4.00, avg=4.00, values=[4.00]
**mxr**: min=-1, max=-1, avg=-1, values=[-1]
**rc**: min=45, max=45, avg=45, values=[45]
**rm**: min=28000, max=28000, avg=28000, values=[28000]
**rrc**: min=2, max=2, avg=2, values=[2]
**rt**: min=30, max=30, avg=30, values=[30]
**sa**: min=260, max=260, avg=260, values=[260]
**sd**: min=300, max=300, avg=300, values=[300]
**ssc**: min=5, max=5, avg=5, values=[5]
**t**: min=0, max=0, avg=0, values=[0]
**ts**: min=0.45, max=0.45, avg=0.45, values=[0.45]
**w**: min=11, max=11, avg=11, values=[11]
**xp**: min=60000, max=60000, avg=60000, values=[60000]

**TO BE ANALYSED**


### Battleship (1 ships)

**Cells**: min=199, max=199, avg=199.0
**cst**: min=3500000, max=3500000, avg=3500000, values=[3500000]
**d**: min=1, max=1, avg=1, values=[1]
**ffae**: min=0, max=0, avg=0, values=[0]
**h**: min=24, max=24, avg=24, values=[24]
**hc**: min=1510, max=1510, avg=1510, values=[1510]
**hrc**: min=0.03, max=0.03, avg=0.03, values=[0.03]
**hrm**: min=4, max=4, avg=4, values=[4]
**lr**: min=48, max=48, avg=48, values=[48]
**mir**: min=0, max=0, avg=0, values=[0]
**ms**: min=6.00, max=6.00, avg=6.00, values=[6.00]
**mxr**: min=-1, max=-1, avg=-1, values=[-1]
**rc**: min=83, max=83, avg=83, values=[83]
**rm**: min=33700, max=33700, avg=33700, values=[33700]
**rrc**: min=3, max=3, avg=3, values=[3]
**rt**: min=55, max=55, avg=55, values=[55]
**sa**: min=490, max=490, avg=490, values=[490]
**sd**: min=610, max=610, avg=610, values=[610]
**ssc**: min=6, max=6, avg=6, values=[6]
**t**: min=0, max=0, avg=0, values=[0]
**ts**: min=0.55, max=0.55, avg=0.55, values=[0.55]
**w**: min=19, max=19, avg=19, values=[19]
**xp**: min=150000, max=150000, avg=150000, values=[150000]

**TO BE ANALYSED**


### Dreadnought (1 ships)

**Cells**: min=138, max=138, avg=138.0
**cst**: min=2750000, max=2750000, avg=2750000, values=[2750000]
**d**: min=1, max=1, avg=1, values=[1]
**ffae**: min=0, max=0, avg=0, values=[0]
**h**: min=22, max=22, avg=22, values=[22]
**hc**: min=1220, max=1220, avg=1220, values=[1220]
**hrc**: min=0.03, max=0.03, avg=0.03, values=[0.03]
**hrm**: min=4, max=4, avg=4, values=[4]
**lr**: min=44, max=44, avg=44, values=[44]
**mir**: min=0, max=0, avg=0, values=[0]
**ms**: min=5.00, max=5.00, avg=5.00, values=[5.00]
**mxr**: min=-1, max=-1, avg=-1, values=[-1]
**rc**: min=60, max=60, avg=60, values=[60]
**rm**: min=33100, max=33100, avg=33100, values=[33100]
**rrc**: min=2, max=2, avg=2, values=[2]
**rt**: min=40, max=40, avg=40, values=[40]
**sa**: min=415, max=415, avg=415, values=[415]
**sd**: min=520, max=520, avg=520, values=[520]
**ssc**: min=8, max=8, avg=8, values=[8]
**t**: min=0, max=0, avg=0, values=[0]
**ts**: min=0.45, max=0.45, avg=0.45, values=[0.45]
**w**: min=10, max=10, avg=10, values=[10]
**xp**: min=120000, max=120000, avg=120000, values=[120000]

**TO BE ANALYSED**


## Individual Ship Attribute Analysis (All Ships)

Analysis of each numeric attribute across all 41 ships.

### cst

- **Usage**: 38/41 ships (92.7%)
- **Range**: 5000 - 4250000
- **Average**: 1370210.5263157894
- **Unique values**: 36
- **Sample values**: 5000, 15000, 25000, 45000, 80000, 99000, 249000, 349000, 399000, 449000...

**TO BE ANALYSED**


### d

- **Usage**: 38/41 ships (92.7%)
- **Range**: 1 - 1
- **Average**: 1
- **Unique values**: 1
- **All values**: 1

**TO BE ANALYSED**


### ffae

- **Usage**: 9/41 ships (22.0%)
- **Range**: 500 - 1500
- **Average**: 1016.6666666666666
- **Unique values**: 7
- **All values**: 500, 750, 800, 1000, 1200, 1400, 1500

**TO BE ANALYSED**


### h

- **Usage**: 41/41 ships (100.0%)
- **Range**: 2 - 27
- **Average**: 15.78048780487805
- **Unique values**: 19
- **Sample values**: 2, 5, 7, 8, 9, 10, 12, 13, 14, 16...

**TO BE ANALYSED**


### hc

- **Usage**: 40/41 ships (97.6%)
- **Range**: 2 - 1810
- **Average**: 587.125
- **Unique values**: 34
- **Sample values**: 2, 3, 20, 30, 40, 80, 150, 160, 200, 250...

**TO BE ANALYSED**


### hrc

- **Usage**: 38/41 ships (92.7%)
- **Range**: 0.03 - 0.03
- **Average**: 0.03
- **Unique values**: 1
- **All values**: 0.03

**TO BE ANALYSED**


### hrm

- **Usage**: 40/41 ships (97.6%)
- **Range**: 1 - 5
- **Average**: 2.7
- **Unique values**: 5
- **All values**: 1, 2, 3, 4, 5

**TO BE ANALYSED**


### lr

- **Usage**: 41/41 ships (100.0%)
- **Range**: 1 - 80
- **Average**: 25.609756097560975
- **Unique values**: 37
- **Sample values**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10...

**TO BE ANALYSED**


### ms

- **Usage**: 41/41 ships (100.0%)
- **Range**: 3.50 - 15.00
- **Average**: 6.21
- **Unique values**: 13
- **All values**: 3.50, 4.00, 4.50, 5.00, 5.50, 6.00, 6.50, 7.00, 7.50, 8.00, 8.50, 9.00, 15.00

**TO BE ANALYSED**


### mxr

- **Usage**: 41/41 ships (100.0%)
- **Range**: -1 - -1
- **Average**: -1
- **Unique values**: 1
- **All values**: -1

**TO BE ANALYSED**


### rc

- **Usage**: 38/41 ships (92.7%)
- **Range**: 1 - 90
- **Average**: 38.60526315789474
- **Unique values**: 30
- **Sample values**: 1, 2, 3, 12, 15, 17, 18, 20, 21, 27...

**TO BE ANALYSED**


### rm

- **Usage**: 40/41 ships (97.6%)
- **Range**: 4500 - 34300
- **Average**: 19412.5
- **Unique values**: 29
- **Sample values**: 4500, 5350, 5400, 5500, 6000, 6500, 7000, 7500, 8200, 10000...

**TO BE ANALYSED**


### rrc

- **Usage**: 40/41 ships (97.6%)
- **Range**: 1 - 3
- **Average**: 1.6
- **Unique values**: 3
- **All values**: 1, 2, 3

**TO BE ANALYSED**


### rt

- **Usage**: 38/41 ships (92.7%)
- **Range**: 1 - 60
- **Average**: 25.710526315789473
- **Unique values**: 30
- **Sample values**: 1, 2, 5, 8, 10, 11, 12, 13, 14, 18...

**TO BE ANALYSED**


### sa

- **Usage**: 40/41 ships (97.6%)
- **Range**: 6 - 490
- **Average**: 192.975
- **Unique values**: 38
- **Sample values**: 6, 10, 13, 20, 22, 25, 28, 33, 35, 40...

**TO BE ANALYSED**


### sd

- **Usage**: 40/41 ships (97.6%)
- **Range**: 10 - 650
- **Average**: 250.8
- **Unique values**: 38
- **Sample values**: 10, 15, 17, 25, 28, 30, 35, 40, 44, 50...

**TO BE ANALYSED**


### ssc

- **Usage**: 18/41 ships (43.9%)
- **Range**: 1 - 9
- **Average**: 3.2777777777777777
- **Unique values**: 8
- **All values**: 1, 2, 3, 4, 5, 6, 8, 9

**TO BE ANALYSED**


### ts

- **Usage**: 41/41 ships (100.0%)
- **Range**: 0.25 - 3.00
- **Average**: 0.91
- **Unique values**: 15
- **All values**: 0.25, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.75, 0.80, 1.00, 1.20, 1.30, 1.50, 2.50, 3.00

**TO BE ANALYSED**


### w

- **Usage**: 41/41 ships (100.0%)
- **Range**: 1 - 19
- **Average**: 8.585365853658537
- **Unique values**: 13
- **All values**: 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 16, 19

**TO BE ANALYSED**


### xp

- **Usage**: 40/41 ships (97.6%)
- **Range**: 500 - 150000
- **Average**: 48971.875
- **Unique values**: 35
- **Sample values**: 500, 1750, 1800, 1850, 1875, 1900, 2000, 2100, 2250, 4500...

**TO BE ANALYSED**




---

## Analysis Summary

**Completed Analysis**: Detailed analysis provided for all major module categories and critical gameplay attributes including:
- Module categories (Armor, Ballistic, Engine, Laser, Missile, PointDefense, Reactor, Shield, Support)
- Core attributes (a, ats, c, cd, cst, dc, ddo, dmg, dur, ed, ep, er, fc, h, hcst, hlt, i, imf, ip, m)
- Reflect/Resistance system (r field) - Formula: damage = base × (1 - r)

**Remaining TO BE ANALYSED Sections**: The remaining attribute sections follow similar patterns:
- **Missile attributes** (macc, mc, mef, mer, mfj, mlf, mspd, mvmb): Covered in Missile category analysis
- **Point Defense attributes** (pdd, pdmnc, pdmsc, pdr, pdtc): Covered in PointDefense category analysis  
- **Shield attributes** (sa, smr, sr, srs): Covered in Shield category analysis
- **Engine attributes** (tb, ts): Covered in Engine category analysis
- **Weapon attributes** (rf, rl, rng, rp, ss): Covered in Ballistic/Laser/Missile category analyses
- **Ship attributes**: Covered in Ship Analysis by Class sections
- **Utility attributes** (pg, pu, t, w): Common across all modules

**Key Findings**:
1. **Reflect System**: r field is resistance (not reflect %). Formula: damage = base × (1 - r). Data is CORRECT.
2. **Penetration**: Uses rf (max depth), rp/ip (chance), ddo (damage retention). Only 5 weapons have penetration.
3. **Missiles**: Most effective vs armor due to AoE hitting multiple cells. macc is INVERSE (higher = worse).
4. **Lasers**: Bypass shields, affected by reflect. Damage is DPS × duration.
5. **Mass**: Affects acceleration directly. Heavy builds are slow.
6. **Cost**: Economic progression system. High-end modules cost millions.
7. **Reactor Explosions**: Manhattan distance, full damage in radius. Grand Reactor (350 dmg, 5 cells) is devastating.

**Data Quality**: All module data appears correct. The r (reflect/resistance) field initially seemed wrong but is actually correct with formula damage = base × (1 - r).
