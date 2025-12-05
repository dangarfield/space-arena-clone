---
inclusion: always
---

# Project Documentation

This steering file ensures that key documentation files are always available for context.

## Documentation Files

The following files contain critical project information:

### README.md
User-facing documentation describing what the game is, how to play it, and how to run it.

#[[file:../../README.md]]

### AGENTS.md
Technical reference for AI agents working on this codebase. Contains implementation details, file structure, code patterns, and current status.

#[[file:../../AGENTS.md]]

### BATTLE.md
Complete combat mechanics and formulas documentation. Describes all calculations, hardcoded values, and battle system implementation.

#[[file:../../BATTLE.md]]

### DATA_ANALYSIS.md
Statistical analysis of all modules and ships. Provides insights into attribute distributions, balance analysis, and gameplay effects. References DATA_MODULES.md and DATA_SHIPS.md for complete data tables.

#[[file:../../DATA_ANALYSIS.md]]

## Usage

These files are automatically included in all agent interactions to provide comprehensive context about:
- Game mechanics and features
- Technical implementation details
- Combat formulas and calculations
- Data analysis and balance insights
- Current implementation status
- Code patterns and best practices

## Additional Data References

The following files are referenced in the documentation but not auto-included (available on demand):
- `DATA_MODULES.md` - Complete module data tables (all 91 modules with all fields)
- `DATA_SHIPS.md` - Complete ship data tables (all 41 ships with all fields)
- `DATA_COMPARE.md` - Curated module comparison tables
- `DATA_KEYS.md` - JSON field mappings and definitions
