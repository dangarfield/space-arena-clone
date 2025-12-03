export default class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'GameScene' });
	}

	create() {
		const { width, height } = this.cameras.main;

		// Get ship configuration
		const shipConfig = this.registry.get('shipConfiguration');
		
		// Create starfield
		this.createStarfield();

		// Create ships with modules
		this.player = this.createShipFromConfig(width / 4, height / 2, shipConfig, 'player');
		this.enemy = this.createEnemyShip(width * 3 / 4, height / 2);

		// Projectiles
		this.projectiles = this.physics.add.group();
		this.missiles = this.physics.add.group();

		// Visual effects
		this.explosions = this.add.group();
		this.shields = this.add.group();

		// UI
		this.createUI();

		// Battle state
		this.battleActive = true;
		this.time = 0;
	}

	createStarfield() {
		for (let i = 0; i < 150; i++) {
			const x = Phaser.Math.Between(0, this.cameras.main.width);
			const y = Phaser.Math.Between(0, this.cameras.main.height);
			const size = Phaser.Math.Between(1, 3);
			this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.3, 0.9));
		}
	}

	createShipFromConfig(x, y, config, team) {
		const ship = this.add.container(x, y);
		
		// Physics
		this.physics.add.existing(ship);
		ship.body.setCollideWorldBounds(true);
		
		// Ship properties
		ship.team = team;
		ship.config = config;
		ship.modules = [];
		ship.destroyed = false;
		ship.totalMass = config.resources.mass;
		ship.speed = Math.max(50, 200 - ship.totalMass / 10);
		ship.turnSpeed = Math.max(0.5, 2 - ship.totalMass / 100);
		
		// Create modules from config
		const cellSize = 35;
		const gridOffsetX = -(config.ship.grid.width * cellSize) / 2;
		const gridOffsetY = -(config.ship.grid.height * cellSize) / 2;
		
		config.modules.forEach(moduleData => {
			const module = this.createModule(
				gridOffsetX + moduleData.position.col * cellSize + (moduleData.size.w * cellSize) / 2,
				gridOffsetY + moduleData.position.row * cellSize + (moduleData.size.h * cellSize) / 2,
				moduleData,
				ship,
				cellSize
			);
			ship.modules.push(module);
			ship.add(module.visual);
		});
		
		return ship;
	}

	createModule(x, y, moduleData, ship, cellSize) {
		const module = {
			name: moduleData.name,
			type: moduleData.type,
			stats: moduleData.stats,
			size: moduleData.size,
			x: x,
			y: y,
			ship: ship,
			destroyed: false,
			health: parseInt(moduleData.stats.Health || '100'),
			maxHealth: parseInt(moduleData.stats.Health || '100'),
			armor: parseInt(moduleData.stats.Armor || '0'),
			lastFired: 0,
		};

		// Visual representation
		const color = this.getModuleColor(moduleData.type);
		const width = moduleData.size.w * cellSize - 4;
		const height = moduleData.size.h * cellSize - 4;
		
		const visual = this.add.container(x, y);
		const rect = this.add.rectangle(0, 0, width, height, color, 0.9)
			.setStrokeStyle(2, 0xffffff);
		
		const text = this.add.text(0, 0, moduleData.name.substring(0, 8), {
			fontSize: Math.min(10, width / 8),
			color: '#ffffff',
		}).setOrigin(0.5);
		
		visual.add([rect, text]);
		module.visual = visual;
		module.rect = rect;
		module.text = text;
		
		// Add physics hitbox
		this.physics.add.existing(visual);
		visual.body.setSize(width, height);
		
		return module;
	}

	getModuleColor(type) {
		switch(type) {
			case 'weapon': return 0xff4444;
			case 'defense': return 0x4444ff;
			case 'utility': return 0xffaa00;
			default: return 0x888888;
		}
	}

	createEnemyShip(x, y) {
		// Create a simple enemy ship for now
		const enemyConfig = {
			ship: { name: 'Enemy', grid: { width: 6, height: 5 } },
			modules: [
				{
					name: 'chaingun',
					type: 'weapon',
					stats: { Health: '50', Damage: '8', 'Fire Rate': '2.5/s', Range: '350', Size: '1x1' },
					position: { col: 2, row: 1 },
					size: { w: 1, h: 1 }
				},
				{
					name: 'small reactor',
					type: 'utility',
					stats: { Health: '80', Power: '-15', Size: '1x1' },
					position: { col: 2, row: 3 },
					size: { w: 1, h: 1 }
				},
				{
					name: 'small steel armor',
					type: 'defense',
					stats: { Health: '200', Armor: '5', Size: '1x1' },
					position: { col: 1, row: 2 },
					size: { w: 1, h: 1 }
				},
			],
			resources: { mass: 100 }
		};
		
		return this.createShipFromConfig(x, y, enemyConfig, 'enemy');
	}

	createUI() {
		const { width, height } = this.cameras.main;
		
		// Player info
		this.add.text(20, 20, 'PLAYER', { fontSize: '20px', color: '#00aaff', fontStyle: 'bold' });
		this.playerModuleText = this.add.text(20, 45, 'Modules: 0/0', { fontSize: '16px', color: '#ffffff' });
		
		// Enemy info
		this.add.text(width - 120, 20, 'ENEMY', { fontSize: '20px', color: '#ff4444', fontStyle: 'bold' });
		this.enemyModuleText = this.add.text(width - 120, 45, 'Modules: 0/0', { fontSize: '16px', color: '#ffffff' });
	}

	update(time, delta) {
		if (!this.battleActive) return;
		
		this.time = time;
		
		// Update ships
		this.updateShip(this.player, this.enemy, delta);
		this.updateShip(this.enemy, this.player, delta);
		
		// Update projectiles
		this.updateProjectiles();
		
		// Update UI
		this.updateUI();
		
		// Check win condition
		this.checkBattleEnd();
	}

	updateShip(ship, target, delta) {
		if (ship.destroyed) return;
		
		// Calculate distance to target
		const dx = target.x - ship.x;
		const dy = target.y - ship.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		
		// Find weapons and their max range
		const weapons = ship.modules.filter(m => !m.destroyed && m.type === 'weapon');
		const maxRange = weapons.length > 0 
			? Math.max(...weapons.map(w => parseInt(w.stats.Range || '300')))
			: 300;
		
		// Movement AI
		const optimalRange = maxRange * 0.7;
		if (distance > optimalRange) {
			// Move toward target
			const angle = Math.atan2(dy, dx);
			ship.body.setVelocity(
				Math.cos(angle) * ship.speed,
				Math.sin(angle) * ship.speed
			);
		} else if (distance < optimalRange * 0.5) {
			// Move away
			const angle = Math.atan2(dy, dx);
			ship.body.setVelocity(
				-Math.cos(angle) * ship.speed * 0.5,
				-Math.sin(angle) * ship.speed * 0.5
			);
		} else {
			// Strafe
			const angle = Math.atan2(dy, dx) + Math.PI / 2;
			ship.body.setVelocity(
				Math.cos(angle) * ship.speed * 0.3,
				Math.sin(angle) * ship.speed * 0.3
			);
		}
		
		// Fire weapons
		weapons.forEach(weapon => {
			this.updateWeapon(weapon, ship, target);
		});
		
		// Update shields
		const shields = ship.modules.filter(m => !m.destroyed && m.name.toLowerCase().includes('shield'));
		shields.forEach(shield => {
			this.updateShield(shield, ship);
		});
	}

	updateWeapon(weapon, ship, target) {
		const range = parseInt(weapon.stats.Range || '300');
		const fireRateStr = weapon.stats['Fire Rate'] || '1/s';
		const fireRate = parseFloat(fireRateStr) * 1000; // Convert to ms
		const cooldown = 1000 / (fireRate / 1000);
		
		// Check if can fire
		if (this.time - weapon.lastFired < cooldown) return;
		
		// Check range
		const dx = target.x - (ship.x + weapon.x);
		const dy = target.y - (ship.y + weapon.y);
		const distance = Math.sqrt(dx * dx + dy * dy);
		
		if (distance > range) return;
		
		// Fire!
		weapon.lastFired = this.time;
		
		// Determine weapon type
		const weaponName = weapon.name.toLowerCase();
		if (weaponName.includes('missile') || weaponName.includes('rocket')) {
			this.fireMissile(weapon, ship, target);
		} else if (weaponName.includes('laser')) {
			this.fireLaser(weapon, ship, target);
		} else {
			// Ballistic
			this.fireBallistic(weapon, ship, target);
		}
	}

	fireBallistic(weapon, ship, target) {
		const worldX = ship.x + weapon.x;
		const worldY = ship.y + weapon.y;
		
		// Aim at target with some spread
		const dx = target.x - worldX;
		const dy = target.y - worldY;
		const angle = Math.atan2(dy, dx) + Phaser.Math.FloatBetween(-0.1, 0.1);
		
		const projectile = this.add.circle(worldX, worldY, 3, 0xffff00);
		this.physics.add.existing(projectile);
		
		const speed = 500;
		projectile.body.setVelocity(
			Math.cos(angle) * speed,
			Math.sin(angle) * speed
		);
		
		projectile.damage = parseInt(weapon.stats.Damage || '10');
		projectile.owner = ship;
		projectile.weaponType = 'ballistic';
		
		this.projectiles.add(projectile);
		
		// Muzzle flash
		const flash = this.add.circle(worldX, worldY, 8, 0xffaa00, 0.8);
		this.tweens.add({
			targets: flash,
			alpha: 0,
			scale: 2,
			duration: 100,
			onComplete: () => flash.destroy()
		});
		
		// Auto-destroy after 3 seconds
		this.time.delayedCall(3000, () => {
			if (projectile.active) projectile.destroy();
		});
	}

	fireLaser(weapon, ship, target) {
		const worldX = ship.x + weapon.x;
		const worldY = ship.y + weapon.y;
		
		const dx = target.x - worldX;
		const dy = target.y - worldY;
		const angle = Math.atan2(dy, dx);
		const distance = Math.sqrt(dx * dx + dy * dy);
		
		// Create laser beam
		const beam = this.add.rectangle(
			worldX + Math.cos(angle) * distance / 2,
			worldY + Math.sin(angle) * distance / 2,
			distance,
			3,
			ship.team === 'player' ? 0x00ffff : 0xff0000,
			0.8
		);
		beam.setRotation(angle);
		
		// Fade out
		this.tweens.add({
			targets: beam,
			alpha: 0,
			duration: 200,
			onComplete: () => beam.destroy()
		});
		
		// Hit target modules
		const damage = parseInt(weapon.stats.Damage || '15');
		target.modules.forEach(module => {
			if (!module.destroyed) {
				const moduleWorldX = target.x + module.x;
				const moduleWorldY = target.y + module.y;
				const distToModule = Phaser.Math.Distance.Between(worldX, worldY, moduleWorldX, moduleWorldY);
				
				if (distToModule < distance + 20) {
					this.damageModule(module, damage, 'laser');
				}
			}
		});
	}

	fireMissile(weapon, ship, target) {
		const worldX = ship.x + weapon.x;
		const worldY = ship.y + weapon.y;
		
		const missile = this.add.triangle(worldX, worldY, 0, 0, 10, 5, 10, -5, 0xff8800);
		this.physics.add.existing(missile);
		
		missile.damage = parseInt(weapon.stats.Damage || '25');
		missile.owner = ship;
		missile.target = target;
		missile.weaponType = 'missile';
		missile.speed = 300;
		
		// Smoke trail
		missile.trail = [];
		
		this.missiles.add(missile);
		
		// Auto-destroy after 5 seconds
		this.time.delayedCall(5000, () => {
			if (missile.active) {
				this.createExplosion(missile.x, missile.y, 30);
				missile.destroy();
			}
		});
	}

	updateProjectiles() {
		// Update missiles (tracking)
		this.missiles.getChildren().forEach(missile => {
			if (!missile.active || !missile.target) return;
			
			const dx = missile.target.x - missile.x;
			const dy = missile.target.y - missile.y;
			const angle = Math.atan2(dy, dx);
			
			missile.setRotation(angle);
			missile.body.setVelocity(
				Math.cos(angle) * missile.speed,
				Math.sin(angle) * missile.speed
			);
			
			// Smoke trail
			if (Math.random() < 0.3) {
				const smoke = this.add.circle(missile.x, missile.y, 3, 0x888888, 0.5);
				this.tweens.add({
					targets: smoke,
					alpha: 0,
					scale: 2,
					duration: 500,
					onComplete: () => smoke.destroy()
				});
			}
			
			// Check collision with target modules
			missile.target.modules.forEach(module => {
				if (module.destroyed) return;
				
				const moduleWorldX = missile.target.x + module.x;
				const moduleWorldY = missile.target.y + module.y;
				const dist = Phaser.Math.Distance.Between(missile.x, missile.y, moduleWorldX, moduleWorldY);
				
				if (dist < 20) {
					this.createExplosion(missile.x, missile.y, 40);
					this.damageModule(module, missile.damage, 'missile');
					missile.destroy();
				}
			});
		});
		
		// Check ballistic projectile collisions
		this.projectiles.getChildren().forEach(projectile => {
			if (!projectile.active) return;
			
			const target = projectile.owner === this.player ? this.enemy : this.player;
			
			target.modules.forEach(module => {
				if (module.destroyed) return;
				
				const moduleWorldX = target.x + module.x;
				const moduleWorldY = target.y + module.y;
				const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, moduleWorldX, moduleWorldY);
				
				if (dist < 15) {
					this.damageModule(module, projectile.damage, projectile.weaponType);
					projectile.destroy();
				}
			});
		});
	}

	damageModule(module, damage, damageType) {
		if (module.destroyed) return;
		
		// Apply armor reduction for ballistic/missile
		let finalDamage = damage;
		if (damageType === 'ballistic' || damageType === 'missile') {
			finalDamage = Math.max(1, damage - module.armor);
		}
		
		// Apply damage
		module.health -= finalDamage;
		
		// Visual feedback
		this.tweens.add({
			targets: module.visual,
			alpha: 0.3,
			duration: 100,
			yoyo: true
		});
		
		// Damage number
		const damageText = this.add.text(
			module.ship.x + module.x,
			module.ship.y + module.y - 20,
			`-${Math.floor(finalDamage)}`,
			{ fontSize: '14px', color: '#ff0000', fontStyle: 'bold' }
		).setOrigin(0.5);
		
		this.tweens.add({
			targets: damageText,
			y: damageText.y - 30,
			alpha: 0,
			duration: 1000,
			onComplete: () => damageText.destroy()
		});
		
		// Check if destroyed
		if (module.health <= 0) {
			this.destroyModule(module);
		}
	}

	destroyModule(module) {
		module.destroyed = true;
		module.health = 0;
		
		// Explosion
		this.createExplosion(
			module.ship.x + module.x,
			module.ship.y + module.y,
			50
		);
		
		// Visual
		module.rect.setFillStyle(0x000000, 0.3);
		module.text.setText('X');
		module.text.setColor('#ff0000');
		
		// Reactor explosion damages nearby modules
		if (module.name.toLowerCase().includes('reactor')) {
			const explosionRadius = parseInt(module.stats['Explosion Radius'] || '50');
			const explosionDamage = parseInt(module.stats['Explosion Damage'] || '50');
			
			module.ship.modules.forEach(otherModule => {
				if (otherModule === module || otherModule.destroyed) return;
				
				const dist = Phaser.Math.Distance.Between(module.x, module.y, otherModule.x, otherModule.y);
				if (dist < explosionRadius) {
					this.damageModule(otherModule, explosionDamage, 'explosion');
				}
			});
			
			// Bigger explosion
			this.createExplosion(
				module.ship.x + module.x,
				module.ship.y + module.y,
				explosionRadius * 2
			);
		}
		
		// Check if ship is destroyed
		const activeModules = module.ship.modules.filter(m => !m.destroyed);
		if (activeModules.length === 0) {
			module.ship.destroyed = true;
		}
	}

	updateShield(shield, ship) {
		// Create shield visual if not exists
		if (!shield.shieldVisual) {
			const shieldRadius = 80;
			const shieldGraphic = this.add.circle(0, 0, shieldRadius, 0x00aaff, 0.2)
				.setStrokeStyle(2, 0x00ffff, 0.5);
			
			ship.add(shieldGraphic);
			shield.shieldVisual = shieldGraphic;
			shield.shieldHealth = parseInt(shield.stats['Shield Health'] || '300');
			shield.maxShieldHealth = shield.shieldHealth;
		}
		
		// Pulse effect
		const pulse = 1 + Math.sin(this.time / 200) * 0.1;
		shield.shieldVisual.setScale(pulse);
		
		// Update shield opacity based on health
		const healthPercent = shield.shieldHealth / shield.maxShieldHealth;
		shield.shieldVisual.setAlpha(0.1 + healthPercent * 0.2);
	}

	createExplosion(x, y, size) {
		const explosion = this.add.circle(x, y, 5, 0xff8800);
		
		this.tweens.add({
			targets: explosion,
			radius: size,
			alpha: 0,
			duration: 300,
			onComplete: () => explosion.destroy()
		});
		
		// Particles
		for (let i = 0; i < 8; i++) {
			const angle = (Math.PI * 2 * i) / 8;
			const particle = this.add.circle(x, y, 3, 0xff4400);
			
			this.tweens.add({
				targets: particle,
				x: x + Math.cos(angle) * size,
				y: y + Math.sin(angle) * size,
				alpha: 0,
				duration: 400,
				onComplete: () => particle.destroy()
			});
		}
	}

	updateUI() {
		const playerActive = this.player.modules.filter(m => !m.destroyed).length;
		const playerTotal = this.player.modules.length;
		this.playerModuleText.setText(`Modules: ${playerActive}/${playerTotal}`);
		
		const enemyActive = this.enemy.modules.filter(m => !m.destroyed).length;
		const enemyTotal = this.enemy.modules.length;
		this.enemyModuleText.setText(`Modules: ${enemyActive}/${enemyTotal}`);
	}

	checkBattleEnd() {
		if (this.player.destroyed || this.enemy.destroyed) {
			this.endBattle();
		}
	}

	endBattle() {
		if (!this.battleActive) return;
		this.battleActive = false;
		
		const winner = this.player.destroyed ? 'ENEMY WINS!' : 'PLAYER WINS!';
		const color = this.player.destroyed ? '#ff4444' : '#00aaff';
		
		this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, winner, {
			fontSize: '64px',
			color: color,
			stroke: '#000000',
			strokeThickness: 6
		}).setOrigin(0.5).setDepth(1000);
		
		// Buttons
		this.time.delayedCall(2000, () => {
			const restartBtn = this.add.text(
				this.cameras.main.width / 2 - 100,
				this.cameras.main.height / 2 + 80,
				'RESTART',
				{
					fontSize: '28px',
					color: '#ffffff',
					backgroundColor: '#003366',
					padding: { x: 20, y: 10 }
				}
			).setOrigin(0.5).setInteractive().setDepth(1000);
			
			restartBtn.on('pointerdown', () => {
				this.scene.restart();
			});
			
			const menuBtn = this.add.text(
				this.cameras.main.width / 2 + 100,
				this.cameras.main.height / 2 + 80,
				'MENU',
				{
					fontSize: '28px',
					color: '#ffffff',
					backgroundColor: '#003366',
					padding: { x: 20, y: 10 }
				}
			).setOrigin(0.5).setInteractive().setDepth(1000);
			
			menuBtn.on('pointerdown', () => {
				this.scene.start('MenuScene');
			});
		});
	}
}
