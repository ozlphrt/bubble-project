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
    this.interactions = new Interactions(this.canvas, this); // Pass 'this' for callbacks
    this.controls = new Controls();
    this.tooltipManager = new TooltipManager();

    this.lastFrameTime = performance.now();
    this.fps = 0;
    this.frameTimes = [];

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
    
    // Initialize pin icon state
    this.interactions.updatePinIcon();
    
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
    const random = Math.random() * 100;
    
    let sizeMultiplier;
    if (random < 65) {
      // Small bubbles: 65% of bubbles, 0.3-0.8x base size
      sizeMultiplier = 0.3 + Math.random() * 0.5;
    } else if (random < 90) {
      // Medium bubbles: 25% of bubbles, 0.8-1.5x base size
      sizeMultiplier = 0.8 + Math.random() * 0.7;
    } else {
      // Large bubbles: 10% of bubbles, 1.5-3.0x base size
      sizeMultiplier = 1.5 + Math.random() * 1.5;
    }
    
    // Apply size variation to the category
    const categorySize = baseSize * sizeMultiplier;
    const variationRange = categorySize * sizeVariation * 0.3; // Reduced variation within categories
    const randomVariation = (Math.random() - 0.5) * 2; // -1 to 1
    const finalSize = categorySize + (randomVariation * variationRange);
    
    // Ensure minimum size
    return Math.max(finalSize, this.targetRadius * 0.1);
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
        // Weighted size distribution for better visual balance
        const random = Math.random() * 100;
        
        let sizeMultiplier;
        if (random < 65) {
          // Small bubbles: 65% of bubbles, 0.3-0.8x base size
          sizeMultiplier = 0.3 + Math.random() * 0.5;
        } else if (random < 90) {
          // Medium bubbles: 25% of bubbles, 0.8-1.5x base size
          sizeMultiplier = 0.8 + Math.random() * 0.7;
        } else {
          // Large bubbles: 10% of bubbles, 1.5-3.0x base size
          sizeMultiplier = 1.5 + Math.random() * 1.5;
        }
        
        // Apply size variation to the category
        const categorySize = baseSize * sizeMultiplier;
        const variationRange = categorySize * sizeVariation * 0.3; // Reduced variation within categories
        const randomVariation = (Math.random() - 0.5) * 2; // -1 to 1
        newRadius = categorySize + (randomVariation * variationRange);
      }
      
      // Ensure minimum size and maximum size to prevent physics errors
      newRadius = Math.max(newRadius, this.targetRadius * 0.1);
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


  reset() {
    const bubbleCount = this.controls.getValue('bubbleCount') ?? 300;
    this.initBubbles(bubbleCount); // Use current bubble count setting
    this.compressionActive = false;
    this.lastCompressionForce = 0;
  }

  resetControlsToDefaults() {
    this.controls.resetToDefaults();
  }

  // Preset configurations for different foam behaviors
  applyPreset(presetName) {
    switch(presetName) {
      case 'perfect-honeycomb':
        // Updated perfect honeycomb values for optimal formation
        this.controls.setValue('targetDist', 0.682039);
        this.controls.setValue('separation', 0.300000);
        this.controls.setValue('collisionStrength', 0.030000);
        this.controls.setValue('wallBounce', 0.450000);
        this.controls.setValue('deformationStrength', 1.691778);
        this.controls.setValue('influenceThreshold', 0.330368);
        this.controls.setValue('surfaceTension', 0.248242);
        this.controls.setValue('plateauForceStrength', 0.163963);
        this.controls.setValue('gravity', 0.000000);
        this.controls.setValue('damping', 0.950000);
        this.controls.setValue('coalescenceRate', 0.000000);
        this.controls.setValue('bubbleCount', 763);
        this.controls.setValue('averageSize', 2.734310);
        this.controls.setValue('sizeVariation', 0.000000);
        this.controls.setValue('compressionForce', 0.060000);
        this.controls.setValue('interpolationFactor', 0.030000);
        this.compress();
        break;
        
      case 'stable-foam':
        // Calm, realistic soap foam
        this.controls.setValue('targetDist', 1.02);
        this.controls.setValue('separation', 0.4);
        this.controls.setValue('collisionStrength', 0.03);
        this.controls.setValue('influenceThreshold', 0.1);
        this.controls.setValue('deformationStrength', 1.5);
        this.controls.setValue('wallBounce', 0.45);
        this.controls.setValue('damping', 0.99);
        this.controls.setValue('surfaceTension', 0.5); // Moderate surface tension
        this.controls.setValue('plateauForceStrength', 0.05);
        this.controls.setValue('compressionForce', 0.06);
        this.controls.setValue('gravity', 0.04);
        this.compress();
        break;
        
      case 'bouncy-foam':
        // Active, bouncy bubbles
        this.controls.setValue('targetDist', 1.03);
        this.controls.setValue('separation', 0.35);
        this.controls.setValue('collisionStrength', 0.06);
        this.controls.setValue('influenceThreshold', 0.1);
        this.controls.setValue('deformationStrength', 1.8);
        this.controls.setValue('wallBounce', 0.6);
        this.controls.setValue('damping', 0.995);
        this.controls.setValue('surfaceTension', 0.2); // Lower for more bounce
        this.controls.setValue('plateauForceStrength', 0.03);
        this.controls.setValue('compressionForce', 0.08);
        this.controls.setValue('gravity', 0.06);
        this.compress();
        break;
        
      case 'tight-pack':
        // Dense foam with heavy deformation
        this.controls.setValue('targetDist', 1.01);
        this.controls.setValue('separation', 0.5);
        this.controls.setValue('collisionStrength', 0.02);
        this.controls.setValue('influenceThreshold', 0.08);
        this.controls.setValue('deformationStrength', 2.2);
        this.controls.setValue('wallBounce', 0.35);
        this.controls.setValue('damping', 0.98);
        this.controls.setValue('surfaceTension', 0.3);
        this.controls.setValue('plateauForceStrength', 0.1);
        this.controls.setValue('compressionForce', 0.1);
        this.controls.setValue('gravity', 0.05);
        this.compress();
        break;
        
      case 'soap':
        // Realistic soap bubble behavior
        this.controls.setValue('targetDist', 0.760000);
        this.controls.setValue('separation', 0.180000);
        this.controls.setValue('collisionStrength', 0.030000);
        this.controls.setValue('wallBounce', 0.530000);
        this.controls.setValue('deformationStrength', 1.210000);
        this.controls.setValue('influenceThreshold', 0.230000);
        this.controls.setValue('surfaceTension', 0.500000);
        this.controls.setValue('plateauForceStrength', 0.270000);
        this.controls.setValue('gravity', 0.040000);
        this.controls.setValue('damping', 0.990000);
        this.controls.setValue('coalescenceRate', 0.000010);
        this.controls.setValue('bubbleCount', 300);
        this.controls.setValue('averageSize', 1.000000);
        this.controls.setValue('sizeVariation', 0.800000);
        this.controls.setValue('compressionForce', 0.060000);
        this.controls.setValue('interpolationFactor', 0.030000);
        this.compress();
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
        this.controls.setValue('coalescenceRate', 0.000010);
        this.controls.setValue('bubbleCount', 300);
        this.controls.setValue('averageSize', 1.000000);
        this.controls.setValue('sizeVariation', 0.800000);
        this.controls.setValue('compressionForce', 0.060000);
        this.controls.setValue('interpolationFactor', 0.030000);
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
      const contacts = this.physics.findContacts(bubble, this.bubbles);
      bubble.updateContactDurations(contacts);
    });
    
    // Process coalescence (bubble merging)
    const coalescenceRate = this.controls.getValue('coalescenceRate') ?? 0.01;
    this.bubbles = this.physics.processCoalescence(this.bubbles, coalescenceRate);
    
    // Apply Plateau forces to push junctions toward 120° angles
    this.currentJunctions = this.physics.detectPlateauBorders(this.bubbles);
    this.physics.applyPlateauForces(this.currentJunctions, this.controls);
    
    this.physics.detectCollisions(this.bubbles, this.controls);
  }

  render() {
    const theme = this.controls.getValue('theme') ?? 0;
    this.renderer.clear(theme);
    
    // Draw bubbles (including merge animations)
    this.renderer.renderBubbles(this.bubbles, this.physics);
    
    // Render Plateau borders (use cached junctions from update)
    this.renderer.renderPlateauBorders(this.currentJunctions || [], this.controls);
    
    // Render UI
    this.renderer.renderUI(this.fps, this.bubbles.length, this.compressionActive, this.lastCompressionForce, this.controls, this.bubbles);
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

    this.update(dt);
    this.render();

    requestAnimationFrame(this.animate.bind(this));
  }
}

window.onload = () => {
  new Simulation();
};