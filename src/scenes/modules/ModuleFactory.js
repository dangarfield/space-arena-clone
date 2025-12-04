import BaseModule from './BaseModule.js';
import WeaponModule from './WeaponModule.js';
import EngineModule from './EngineModule.js';
import ShieldModule from './ShieldModule.js';
import WarpModule from './WarpModule.js';
import PointDefenseModule from './PointDefenseModule.js';
import RepairBayModule from './RepairBayModule.js';
import JunkLauncherModule from './JunkLauncherModule.js';
import ArmorGeneratorModule from './ArmorGeneratorModule.js';
import AfterburnerModule from './AfterburnerModule.js';

export default class ModuleFactory {
  static createModule(config, ship, scene) {
    // Category is at top level in processed format
    const category = config.module.category || 0;
    const name = (config.module.name || '').toLowerCase();
    
    // Category flags: 1=Ballistic, 2=Missile, 4=Laser, 8=Armor, 16=Shield, 32=PointDefense, 64=Engine, 128=Reactor, 256=Support
    
    // Check if it's a weapon (has any weapon flag)
    if ((category & 1) || (category & 2) || (category & 4)) {
      return new WeaponModule(config, ship, scene);
    }
    
    // Check if it's a shield
    if (category & 16) {
      return new ShieldModule(config, ship, scene);
    }
    
    // Check if it's point defense
    if (category & 32) {
      if (name.includes('scrap') || name.includes('junk')) {
        return new JunkLauncherModule(config, ship, scene);
      }
      return new PointDefenseModule(config, ship, scene);
    }
    
    // Check if it's support
    if (category & 256) {
      if (name.includes('repair')) {
        return new RepairBayModule(config, ship, scene);
      }
      if (name.includes('armor') && name.includes('generator')) {
        return new ArmorGeneratorModule(config, ship, scene);
      }
      return new BaseModule(config, ship, scene);
    }
    
    // Check if it's an engine
    if (category & 64) {
      // Check if it's a warp engine
      if (name.includes('warp')) {
        return new WarpModule(config, ship, scene);
      }
      // Check if it's an afterburner
      if (name.includes('afterburner')) {
        return new AfterburnerModule(config, ship, scene);
      }
      return new EngineModule(config, ship, scene);
    }
    
    // Default to base module for armor, reactors, etc.
    return new BaseModule(config, ship, scene);
  }
}

