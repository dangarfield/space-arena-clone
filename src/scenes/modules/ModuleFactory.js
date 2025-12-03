import BaseModule from './BaseModule.js';
import WeaponModule from './WeaponModule.js';
import EngineModule from './EngineModule.js';
import ShieldModule from './ShieldModule.js';

export default class ModuleFactory {
  static createModule(config, ship, scene) {
    // Category is at top level in processed format
    const category = config.module.category || 0;
    
    // Category flags: 1=Ballistic, 2=Missile, 4=Laser, 8=Armor, 16=Shield, 32=PointDefense, 64=Engine, 128=Reactor, 256=Support
    
    // Check if it's a weapon (has any weapon flag)
    if ((category & 1) || (category & 2) || (category & 4)) {
      return new WeaponModule(config, ship, scene);
    }
    
    // Check if it's a shield
    if (category & 16) {
      return new ShieldModule(config, ship, scene);
    }
    
    // Check if it's an engine
    if (category & 64) {
      return new EngineModule(config, ship, scene);
    }
    
    // Default to base module for armor, shields, reactors, etc.
    return new BaseModule(config, ship, scene);
  }
}
