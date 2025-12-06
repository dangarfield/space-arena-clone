# TODO

## Visual Improvements

### Module Rotation and Mirroring in Battle
- Some modules should rotate during battle (turrets tracking targets)
- Most turrets and directional modules should be mirrored to point outward from the ship's center
- This creates a more realistic appearance where weapons naturally face away from the ship's core
- Implementation considerations:
  - Determine which modules should rotate (turrets, point defense, etc.)
  - Calculate module position relative to ship center to determine mirror direction
  - Apply rotation based on target tracking for active weapons
  - Apply horizontal/vertical mirroring based on module position (left/right/top/bottom of ship)

## Bugs

### Afterburner Placement Issue
- Afterburners don't fit onto the fitting scene in the correct engine slots
- Need to investigate:
  - Check if afterburner module type is correctly set (should be type 4 for engines)
  - Verify canPlace() logic for engine placement validation
  - Check if afterburner category flags include engine bit (64)
  - Ensure grid cells are correctly marked as 'E' (engine) or 'B' (both) cells

## Gameplay Features

### Power Management System
- When reactors are destroyed, modules don't have enough energy to all run
- Need to implement module offline/shutdown system:
  - Calculate total power generation vs consumption after reactor destruction
  - Prioritize which modules stay online (engines > weapons > utilities?)
  - Disable modules that exceed available power
  - Visual indication of offline modules (greyed out, different tint)
  - Potentially allow player to set power priorities in fitting scene
  - Re-enable modules if power becomes available again (reactor repaired, modules destroyed)
