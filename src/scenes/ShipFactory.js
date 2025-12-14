import ModuleFactory from './modules/ModuleFactory';

const CELL_SIZE = 1;

export default class ShipFactory {
  static createBattleShip(scene, config, position, rotation) {
    // Create container for all ship modules
    const container = scene.add.container(position.x, position.y);
    container.setRotation(rotation);
    
    const ship = {
      config: config,
      pos: position,
      rotation: rotation,
      velocity: { x: 0, y: 0 },
      modules: [],
      container: container,
      destroyed: false,
      speedMultiplier: 1,
      thrustMultiplier: 1
    };
    
    // Create module instances using factory
    config.modules.forEach((moduleConfig) => {
      const module = ModuleFactory.createModule(moduleConfig, ship, scene);
      
      // Calculate position relative to ship center
      const localPos = ShipFactory.gridToLocal(module.col, module.row, module.size, ship);
      module.createSprite(localPos.x, localPos.y, 0, CELL_SIZE);
      module.updateLocalPosition(localPos);
      
      // Create weapon/shield/PD visuals if applicable
      if (module.createVisuals) {
        module.createVisuals(localPos.x, localPos.y);
        if (module.rangeGraphics) container.add(module.rangeGraphics);
        if (module.shieldGraphics) container.add(module.shieldGraphics);
        if (module.pdGraphics) container.add(module.pdGraphics);
      }
      
      // Add sprites to container
      if (module.healthCell) container.add(module.healthCell);
      if (module.sprite) container.add(module.sprite);
      
      ship.modules.push(module);
    });
    
    return ship;
  }

  static gridToLocal(col, row, moduleSize, ship) {
    // Convert grid coordinates to local position relative to ship center
    // col, row are display coordinates (same as FittingScene stores)
    const shipData = ship.config.ship;
    const gridWidth = shipData.w || 6;
    const gridHeight = shipData.h || 5;
    
    // Use display coordinates directly
    const moduleCenterCol = col + moduleSize.w / 2;
    const moduleCenterRow = row + moduleSize.h / 2;
    
    const offsetX = (moduleCenterCol - gridWidth / 2) * CELL_SIZE;
    const offsetY = (moduleCenterRow - gridHeight / 2) * CELL_SIZE;
    
    return { x: offsetX, y: offsetY };
  }

  static gridToWorld(col, row, moduleSize, ship) {
    const local = ShipFactory.gridToLocal(col, row, moduleSize, ship);
    
    const actualRotation = ship.rotation + Math.PI / 2;
    const cos = Math.cos(actualRotation);
    const sin = Math.sin(actualRotation);
    
    const rotatedX = local.x * cos - local.y * sin;
    const rotatedY = local.x * sin + local.y * cos;
    
    return {
      x: ship.pos.x + rotatedX,
      y: ship.pos.y + rotatedY
    };
  }
}
