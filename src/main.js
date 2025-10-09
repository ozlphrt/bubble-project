import { Bubble } from './modules/bubble.js';
import { Physics } from './modules/physics.js';
import { Renderer } from './modules/renderer.js';
import { Interactions } from './modules/interactions.js';
import { Controls } from './modules/controls.js';
import { TooltipManager } from './modules/tooltip.js';

export class Simulation {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.bubbles = [];
    this.physics = new Physics();
    this.renderer = new Renderer(this.canvas, this.ctx);
    this.renderer.simulation = this; // Pass simulation reference for spatial manager updates
    this.interactions = new Interactions(this.canvas, this); // Pass 'this' for callbacks
    this.controls = new Controls(this);
    this.tooltipManager = new TooltipManager();
    
    // Initialize spatial partitioning for performance optimization
    this.physics.initializeSpatial(this.canvas.width, this.canvas.height);

    this.lastFrameTime = performance.now();
    this.fps = 0;
    this.frameTimes = [];
    
    // Performance monitoring
    this.performanceStats = {
      collisionChecks: 0,
      gradientCreations: 0,
      gradientCacheHits: 0,
      lastStatsTime: performance.now()
    };

    this.compressionActive = false;
    this.compressionStartTime = 0;
    this.compressionDuration = 2000; // 2 seconds in milliseconds
    this.lastCompressionForce = 0;
    
    this.currentJunctions = []; // Cache Plateau border junctions

    this.targetRadius = 20; // Base radius for new bubbles

    const initialBubbleCount = this.controls.getValue('bubbleCount') ?? 300;
    this.initBubbles(initialBubbleCount); // Start with bubble count from controls
    
    // Make simulation globally accessible for controls
    window.simulation = this;
    
    // DEBUG: Add test function to force equal sizes
    window.testEqualSizes = () => {
      console.log('===== MANUAL TEST: Forcing all bubbles to equal size =====');
      const baseSize = this.targetRadius;
      this.bubbles.forEach((bubble, i) => {
        bubble.radius = baseSize;
        bubble.targetRadius = baseSize;
        if (i < 5) {
          console.log(`  Bubble ${i}: Set to radius=${bubble.radius}, targetRadius=${bubble.targetRadius}`);
        }
      });
      console.log(`Total bubbles updated: ${this.bubbles.length}`);
    };
    
    // Set up size control callbacks
    this.controls.controls.averageSize.onChange = () => {
      this.updateBubbleSizes();
    };
    this.controls.controls.sizeVariation.onChange = (newValue) => {
      console.log('===== sizeVariation onChange callback triggered =====');
      console.log(`New sizeVariation value: ${newValue}`);
      this.updateBubbleSizes();
    };
    this.controls.controls.bubbleCount.onChange = () => {
      this.adjustBubbleCount();
    };
    
    // Initialize control panel immediately
    this.renderer.ensureControlPanelExists(this.controls);
    
    // Initialize pin button, palette buttons, and faucet button after control panel is created
    this.interactions.initializePinButton();
    this.interactions.initializePaletteButtons();
    this.interactions.initializeFaucetButton();
    
    // Schedule initial auto-hide after 3 seconds
    this.interactions.scheduleInitialAutoHide();
    
    this.animate();
  }

  initBubbles(count) {
    this.bubbles = [];
    for (let i = 0; i < count; i++) {
      this.addBubble();
    }
  }

  addBubble(x = null, y = null) {
    if (x === null) x = Math.random() * (this.canvas.width - 100) + 50;
    if (y === null) y = Math.random() * (this.canvas.height - 100) + 50;
    
    // Better size distribution: favor smaller bubbles for balanced visual area
    const radius = this.generateBalancedRadius();
    this.bubbles.push(new Bubble(x, y, radius, 0.04)); // Fixed theme value
  }

  generateBalancedRadius() {
    // Use size controls to determine bubble size
    const averageSize = this.controls.getValue('averageSize') ?? 1.0;
    const sizeVariation = this.controls.getValue('sizeVariation') ?? 0.8;
    
    // Base size with average multiplier
    const baseSize = this.targetRadius * averageSize;
    
    // Apply variation: 0 = all same size, 1 = full variation
    if (sizeVariation <= 0.001) { // Use small threshold instead of exact 0
      return baseSize; // All bubbles same size
    }
    
    // Weighted size distribution for better visual balance
    // Scale the multiplier ranges by sizeVariation
    const random = Math.random() * 100;
    
    let sizeMultiplier;
    if (random < 65) {
      // Small bubbles: 65% of bubbles
      // At sizeVariation=0: all 1.0x, at sizeVariation=1: 0.3-0.8x
      const minMult = 1.0 - (0.7 * sizeVariation); // 1.0 → 0.3
      const maxMult = 1.0 - (0.2 * sizeVariation); // 1.0 → 0.8
      sizeMultiplier = minMult + Math.random() * (maxMult - minMult);
    } else if (random < 90) {
      // Medium bubbles: 25% of bubbles
      // At sizeVariation=0: all 1.0x, at sizeVariation=1: 0.8-1.5x
      const minMult = 1.0 - (0.2 * sizeVariation); // 1.0 → 0.8
      const maxMult = 1.0 + (0.5 * sizeVariation); // 1.0 → 1.5
      sizeMultiplier = minMult + Math.random() * (maxMult - minMult);
    } else {
      // Large bubbles: 10% of bubbles
      // At sizeVariation=0: all 1.0x, at sizeVariation=1: 1.5-3.0x
      const minMult = 1.0 + (0.5 * sizeVariation); // 1.0 → 1.5
      const maxMult = 1.0 + (2.0 * sizeVariation); // 1.0 → 3.0
      sizeMultiplier = minMult + Math.random() * (maxMult - minMult);
    }
    
    const finalSize = baseSize * sizeMultiplier;
    
    // Ensure minimum size - prevent tiny "nail" bubbles
    return Math.max(finalSize, this.targetRadius * 0.3);
  }

  // Update existing bubble sizes based on current size controls
  updateBubbleSizes() {
    const averageSize = this.controls.getValue('averageSize') ?? 1.0;
    const sizeVariation = this.controls.getValue('sizeVariation') ?? 0.8;
    const baseSize = this.targetRadius * averageSize;
    
    console.log(`updateBubbleSizes called: averageSize=${averageSize}, sizeVariation=${sizeVariation}, baseSize=${baseSize}`);
    console.log(`Size variation check: ${sizeVariation} <= 0.001? ${sizeVariation <= 0.001}`);
    
    let sameSize = true;
    this.bubbles.forEach(bubble => {
      let newRadius;
      
      if (sizeVariation <= 0.001) { // Use small threshold instead of exact 0
        // All bubbles same size
        newRadius = baseSize;
      } else {
        sameSize = false;
        // Weighted size distribution scaled by sizeVariation
        const random = Math.random() * 100;
        
        let sizeMultiplier;
        if (random < 65) {
          // Small bubbles: 65% of bubbles
          const minMult = 1.0 - (0.7 * sizeVariation);
          const maxMult = 1.0 - (0.2 * sizeVariation);
          sizeMultiplier = minMult + Math.random() * (maxMult - minMult);
        } else if (random < 90) {
          // Medium bubbles: 25% of bubbles
          const minMult = 1.0 - (0.2 * sizeVariation);
          const maxMult = 1.0 + (0.5 * sizeVariation);
          sizeMultiplier = minMult + Math.random() * (maxMult - minMult);
        } else {
          // Large bubbles: 10% of bubbles
          const minMult = 1.0 + (0.5 * sizeVariation);
          const maxMult = 1.0 + (2.0 * sizeVariation);
          sizeMultiplier = minMult + Math.random() * (maxMult - minMult);
        }
        
        newRadius = baseSize * sizeMultiplier;
      }
      
      // Ensure minimum size and maximum size to prevent physics errors
      newRadius = Math.max(newRadius, this.targetRadius * 0.3); // Increased from 0.1 to 0.3
      newRadius = Math.min(newRadius, this.targetRadius * 20); // Max 20x base size
      
      // Ensure the value is finite
      if (!isFinite(newRadius) || isNaN(newRadius)) {
        console.warn('Invalid radius calculated, using base size:', newRadius);
        newRadius = baseSize;
      }
      
      bubble.radius = newRadius;
      bubble.targetRadius = newRadius;
    });
    
    if (sameSize) {
      console.log(`All bubbles set to same size: ${baseSize}, total bubbles: ${this.bubbles.length}`);
      // Log first 5 bubble sizes to verify
      this.bubbles.slice(0, 5).forEach((b, i) => {
        console.log(`  Bubble ${i}: radius=${b.radius.toFixed(2)}, targetRadius=${b.targetRadius.toFixed(2)}`);
      });
    }
  }

  // Adjust the number of bubbles based on the bubble count control
  adjustBubbleCount() {
    const targetCount = this.controls.getValue('bubbleCount') ?? 300;
    const currentCount = this.bubbles.length;
    
    if (targetCount > currentCount) {
      // Add more bubbles
      const bubblesToAdd = targetCount - currentCount;
      for (let i = 0; i < bubblesToAdd; i++) {
        const bubble = new Bubble(
          Math.random() * this.canvas.width,
          Math.random() * this.canvas.height,
          this.generateBalancedRadius(),
          0.04 // Fixed theme value
        );
        this.bubbles.push(bubble);
      }
    } else if (targetCount < currentCount) {
      // Remove bubbles (remove from the end to avoid index issues)
      this.bubbles.splice(targetCount);
    }
  }


  restart() {
    // Restart simulation with current control values (old reset behavior)
    const bubbleCount = this.controls.getValue('bubbleCount') ?? 300;
    this.initBubbles(bubbleCount); // Use current bubble count setting
    this.compressionActive = false;
    this.lastCompressionForce = 0;
  }

  resetToDefaults() {
    // Reset all controls to their default values
    this.controls.resetToDefaults();
    
    // Reinitialize bubbles with default settings
    const bubbleCount = this.controls.getValue('bubbleCount') ?? 300;
    this.initBubbles(bubbleCount);
    this.compressionActive = false;
    this.lastCompressionForce = 0;
  }

  resetControlsToDefaults() {
    this.controls.resetToDefaults();
  }

  // Preset configurations for different foam behaviors
  async applyPreset(presetName) {
    switch(presetName) {
      case 'honeycomb':
        // Honeycomb formation with hexagonal deformation and minimal pinching
        this.controls.setValue('targetDist', 0.880000);
        this.controls.setValue('separation', 0.320000);
        this.controls.setValue('collisionStrength', 0.045000);
        this.controls.setValue('wallBounce', 0.503000);
        this.controls.setValue('deformationStrength', 1.000000);
        this.controls.setValue('influenceThreshold', 0.380000);
        this.controls.setValue('surfaceTension', 0.750000);
        this.controls.setValue('plateauForceStrength', 0.240000);
        this.controls.setValue('gravity', 0.000000);
        this.controls.setValue('damping', 0.015325);
        this.controls.setValue('coalescenceRate', 0.000171);
        this.controls.setValue('bubbleCount', 98);
        this.controls.setValue('averageSize', 3.440000);
        this.controls.setValue('sizeVariation', 0.000000);
        
        // Set fire palette for both display and spawning (await to ensure it's set before restart)
        const bubbleModule = await import('./modules/bubble.js');
        bubbleModule.Bubble.currentPalette = 'fire';
        
        // Set spawn color mode to use blues palette
        this.physics.spawnColorMode = 'palette';
        this.physics.spawnPaletteMode = 'blues';
        
        // Restart with new settings
        this.restart();
        this.compress();
        break;
        
      case 'pebbles':
        // Small, compact bubbles like smooth pebbles
        this.controls.setValue('targetDist', 1.012430);
        this.controls.setValue('separation', 0.116645);
        this.controls.setValue('collisionStrength', 0.030000);
        this.controls.setValue('wallBounce', 0.450000);
        this.controls.setValue('deformationStrength', 1.096074);
        this.controls.setValue('influenceThreshold', 0.417972);
        this.controls.setValue('surfaceTension', 0.305453);
        this.controls.setValue('plateauForceStrength', 0.200000);
        this.controls.setValue('gravity', 0.040000);
        this.controls.setValue('damping', 0.020000);
        this.controls.setValue('coalescenceRate', 0.000119);
        this.controls.setValue('bubbleCount', 325);
        this.controls.setValue('averageSize', 1.658752);
        this.controls.setValue('sizeVariation', 0.432122);
        
        // Set mono palette for both display and spawning (await to ensure it's set before restart)
        const bubbleModule2 = await import('./modules/bubble.js');
        bubbleModule2.Bubble.currentPalette = 'mono';
        
        // Set spawn color mode to use ocean palette
        this.physics.spawnColorMode = 'palette';
        this.physics.spawnPaletteMode = 'ocean';
        
        // Restart with new settings
        this.restart();
        break;
        
      case 'tight-pack':
        // Rubber balls - bouncy dense pack with minimal deformation
        this.controls.setValue('targetDist', 0.866543);
        this.controls.setValue('separation', 0.406273);
        this.controls.setValue('collisionStrength', 0.080000);
        this.controls.setValue('wallBounce', 0.359882);
        this.controls.setValue('deformationStrength', 1.030000);
        this.controls.setValue('influenceThreshold', 0.000000);
        this.controls.setValue('surfaceTension', 1.500000);
        this.controls.setValue('plateauForceStrength', 0.123201);
        this.controls.setValue('gravity', 0.198183);
        this.controls.setValue('damping', 0.018000);
        this.controls.setValue('coalescenceRate', 0.000120);
        this.controls.setValue('bubbleCount', 240);
        this.controls.setValue('averageSize', 1.457085);
        this.controls.setValue('sizeVariation', 0.800000);
        
        // Set rainbow palette for display and ocean for spawning
        const bubbleModule3 = await import('./modules/bubble.js');
        bubbleModule3.Bubble.currentPalette = 'rainbow';
        
        // Set spawn color mode to use ocean palette
        this.physics.spawnColorMode = 'palette';
        this.physics.spawnPaletteMode = 'ocean';
        
        this.restart();
        break;
        
      case 'soap':
        // Realistic soap bubble behavior
        this.controls.setValue('targetDist', 0.862252);
        this.controls.setValue('separation', 0.180000);
        this.controls.setValue('collisionStrength', 0.030000);
        this.controls.setValue('wallBounce', 0.530000);
        this.controls.setValue('deformationStrength', 1.031620);
        this.controls.setValue('influenceThreshold', 0.138919);
        this.controls.setValue('surfaceTension', 0.873450);
        this.controls.setValue('plateauForceStrength', 0.270000);
        this.controls.setValue('gravity', 0.040000);
        this.controls.setValue('damping', 0.020000);
        this.controls.setValue('coalescenceRate', 0.000120);
        this.controls.setValue('bubbleCount', 431);
        this.controls.setValue('averageSize', 1.000000);
        this.controls.setValue('sizeVariation', 0.846899);
        
        // Set blues palette for display and fire for spawning
        const bubbleModule4 = await import('./modules/bubble.js');
        bubbleModule4.Bubble.currentPalette = 'blues';
        
        // Set spawn color mode to use fire palette
        this.physics.spawnColorMode = 'palette';
        this.physics.spawnPaletteMode = 'fire';
        
        this.restart();
        break;
        
      case 'pearls':
        // Rubber Pearls preset - smooth, elegant bubble behavior
        this.controls.setValue('targetDist', 1.030000);
        this.controls.setValue('separation', 0.390000);
        this.controls.setValue('collisionStrength', 0.030000);
        this.controls.setValue('wallBounce', 0.450000);
        this.controls.setValue('deformationStrength', 1.470000);
        this.controls.setValue('influenceThreshold', 0.100000);
        this.controls.setValue('surfaceTension', 0.030000);
        this.controls.setValue('plateauForceStrength', 0.020000);
        this.controls.setValue('gravity', 0.040000);
        this.controls.setValue('damping', 0.990000);
        this.controls.setValue('coalescenceRate', 0.00012);
        this.controls.setValue('bubbleCount', 300);
        this.controls.setValue('averageSize', 1.000000);
        this.controls.setValue('sizeVariation', 0.800000);
        this.controls.setValue('compressionForce', 0.060000);
        this.controls.setValue('interpolationFactor', 0.030000);
        
        this.restart();
        this.compress();
        break;
    }
  }

  // Gradually adjust existing bubble sizes to match new distribution

  // Calculate what the average bubble size should be for a given distribution power
  calculateTargetAverage(distributionPower) {
    // Sample the distribution to get an average
    let totalSize = 0;
    const samples = 100;
    
    for (let i = 0; i < samples; i++) {
      totalSize += this.generateBalancedRadius();
    }
    
    return totalSize / samples;
  }

  // Calculate target average from percentage distribution

  compress() {
    this.compressionActive = true;
    this.compressionStartTime = performance.now();
    this.lastCompressionForce = 0.001; // Much weaker compression force
  }

  applyCompressionForces() {
    if (this.compressionActive) {
      const elapsed = performance.now() - this.compressionStartTime;
      const progress = Math.min(elapsed / this.compressionDuration, 1.0);

      if (progress >= 1.0) {
        this.compressionActive = false;
        this.lastCompressionForce = 0;
        return;
      }

      // Get control values or use defaults
      const compressionForce = this.controls.getValue('compressionForce') ?? 0.001;
      const interpolationFactor = this.controls.getValue('interpolationFactor') ?? 0.05;

      // Calculate target force using smoother curve
      const targetForce = compressionForce * Math.exp(-progress * 2);

      // Smoothly interpolate from last force to target force
      this.lastCompressionForce += (targetForce - this.lastCompressionForce) * interpolationFactor;

      this.bubbles.forEach(bubble => {
        const dx = this.canvas.width / 2 - bubble.x;
        const dy = this.canvas.height / 2 - bubble.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          // Add some random direction to make compression more interesting
          const randomAngle = (Math.random() - 0.5) * 0.3; // ±0.15 radians
          const angle = Math.atan2(dy, dx) + randomAngle;
          const force = this.lastCompressionForce;
          
          bubble.vx += Math.cos(angle) * force * dist * 0.01;
          bubble.vy += Math.sin(angle) * force * dist * 0.01;
        }
      });
    }
  }

  update(dt) {
    this.applyCompressionForces();
    this.physics.updatePositions(this.bubbles, dt, this.canvas, this.controls);
    this.physics.applyPressureForces(this.bubbles); // Re-enabled with subtle forces
    
    // Update contact durations for coalescence tracking
    this.bubbles.forEach(bubble => {
      const contacts = this.physics.findContacts(bubble, this.bubbles, this.physics.contactCacheFrame);
      bubble.updateContactDurations(contacts);
    });
    
    // Process coalescence (bubble merging) with canvas for spawning new bubbles
    const coalescenceRate = this.controls.getValue('coalescenceRate') ?? 0.01;
    this.bubbles = this.physics.processCoalescence(this.bubbles, coalescenceRate, this.canvas);
    
    // Apply Plateau forces to push junctions toward 120° angles
    this.currentJunctions = this.physics.detectPlateauBorders(this.bubbles);
    this.physics.applyPlateauForces(this.currentJunctions, this.controls);
    
    this.physics.detectCollisions(this.bubbles, this.controls, this.performanceStats);
  }

  render() {
    const theme = this.controls.getValue('theme') ?? 0;
    this.renderer.clear(theme);
    
    // Draw bubbles (including merge animations)
    this.renderer.renderBubbles(this.bubbles, this.physics, this.physics.contactCacheFrame, this.controls, this.performanceStats);
    
    // Render Plateau borders (use cached junctions from update)
    this.renderer.renderPlateauBorders(this.currentJunctions || [], this.controls);
    
    // Render UI
    this.renderer.renderUI(this.fps, this.bubbles.length, this.compressionActive, this.lastCompressionForce, this.controls, this.bubbles, this.performanceStats);
  }

  animate() {
    const currentTime = performance.now();
    const dt = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Calculate FPS
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 60) { // Average over 60 frames
      this.frameTimes.shift();
    }
    const averageDt = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.fps = Math.round(1000 / averageDt);

    // Clear contact cache for new frame
    this.physics.contactCache.clear();
    this.physics.contactCacheFrame++;
    
    // Reset performance stats every second
    if (currentTime - this.performanceStats.lastStatsTime >= 1000) {
      this.performanceStats.collisionChecks = 0;
      this.performanceStats.gradientCreations = 0;
      this.performanceStats.gradientCacheHits = 0;
      this.performanceStats.lastStatsTime = currentTime;
    }

    this.update(dt);
    this.render();

    requestAnimationFrame(this.animate.bind(this));
  }
}

window.onload = () => {
  new Simulation();
};