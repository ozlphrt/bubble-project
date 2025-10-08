/**
 * Bubble Module
 * 
 * This module contains the Bubble class that represents a single soap bubble
 * in the simulation. It handles bubble state, physics properties, and behavior.
 * 
 * @fileoverview Bubble class for soap bubble simulation
 * @version 1.0.0
 * @author Soap Bubble Simulation Team
 */

/**
 * Bubble class representing a single soap bubble
 * 
 * Each bubble has position, velocity, radius, and physics properties
 * that determine its behavior in the simulation. This class is extracted
 * from the working prototype and enhanced with proper documentation.
 */
export class Bubble {
  /**
   * Create a bubble
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels  
   * @param {number} radius - Bubble radius in pixels
   */
  constructor(x, y, radius, theme = 0) {
    // Position
    this.x = x;
    this.y = y;
    
    // Kinematics
    this.radius = radius;
    this.vx = (Math.random() - 0.5) * 2; // Random initial velocity
    this.vy = (Math.random() - 0.5) * 2;
    
    // Visual properties
    this.color = this.generateColor(theme);
    
    // Physics properties
    this.surfaceTension = 0.025; // N/m - typical soap solution
    this.mass = Math.PI * radius * radius; // Area as mass in 2D
    
    // Surface tension physics properties
    this.targetRadius = radius; // The radius the bubble wants to be
    this.pressure = 0; // Internal pressure from Young-Laplace equation
    this.surfaceTensionForce = 0; // Force pulling toward spherical shape
    
    // State tracking
    this.age = 0;
    this.id = Bubble.nextId++;
    
    // Coalescence tracking
    this.contactDurations = new Map(); // Track contact duration with other bubbles
    this.merging = false; // Is this bubble currently merging?
    this.mergingWith = null; // Which bubble is it merging with?
    this.mergeProgress = 0; // Progress of merge animation (0-1)
    this.justMerged = false; // Did this bubble just absorb another?
    this.mergeOscillation = 0; // Oscillation phase for post-merge shake
    this.mergeOscillationAmplitude = 0; // Amplitude of oscillation
  }
  
  /**
   * Calculate Young-Laplace pressure and surface tension forces
   * The Young-Laplace equation: ΔP = γ(1/R1 + 1/R2)
   * For a 2D bubble: ΔP = γ/R (where R is the radius)
   */
  calculateSurfaceTension(controls = null) {
    // Get surface tension from controls or use default
    const surfaceTension = controls?.getValue('surfaceTension') || this.surfaceTension;
    
    // Young-Laplace equation for 2D bubble
    this.pressure = surfaceTension / this.radius;
    
    // Calculate surface tension force toward target radius
    const radiusDifference = this.targetRadius - this.radius;
    this.surfaceTensionForce = radiusDifference * surfaceTension * 20.0; // Very strong force - doubled for visibility
  }

  /**
   * Update bubble physics for one frame
   * @param {number} dt - Delta time (usually 1 frame)
   * @param {HTMLCanvasElement} canvas - Canvas for boundary checking
   */
  update(dt, canvas, controls = null) {
    // Calculate surface tension forces (for pressure calculation only)
    this.calculateSurfaceTension(controls);
    
    // Apply gravity
    const gravity = controls?.getValue('gravity') || 0;
    this.vy += gravity * dt * 0.1; // Much smaller scale for reasonable effect
    
    // Apply surface tension force to radius with safety checks
    const radiusChange = this.surfaceTensionForce * dt * 15.0;
    const newRadius = this.radius + radiusChange;
    
    // Clamp radius to prevent it from becoming negative, too small, or too large
    this.radius = Math.max(5, Math.min(newRadius, 500)); // Min 5px, Max 500px
    
    // If radius is getting too far from target, reset it
    if (Math.abs(this.radius - this.targetRadius) > this.targetRadius * 2) {
      this.radius = this.targetRadius;
    }
    
    // Additional safety check for non-finite values
    if (!isFinite(this.radius) || isNaN(this.radius)) {
      console.warn('Non-finite radius detected in update, resetting to targetRadius');
      this.radius = this.targetRadius || 20;
    }
    
    // Apply velocity with time-based scaling for smoother motion
    const timeScale = Math.min(dt / 16, 2); // Cap at 2x normal speed
    this.x += this.vx * timeScale;
    this.y += this.vy * timeScale;

    // Get control values or use defaults
    const wallBounce = controls?.getValue('wallBounce') || 0.4;
    const damping = controls?.getValue('damping') || 0.995;

    // Dynamic wall collision with proper separation
    if (this.x - this.radius < 0) {
      this.vx *= -wallBounce;
      this.x = this.radius;
    } else if (this.x + this.radius > canvas.width) {
      this.vx *= -wallBounce;
      this.x = canvas.width - this.radius;
    }

    if (this.y - this.radius < 0) {
      this.vy *= -wallBounce;
      this.y = this.radius;
    } else if (this.y + this.radius > canvas.height) {
      this.vy *= -wallBounce;
      this.y = canvas.height - this.radius;
    }

    // Dynamic damping
    this.vx *= damping;
    this.vy *= damping;
    this.age++;
  }
  
  /**
   * Update contact durations with other bubbles
   * @param {Array} contacts - Array of bubbles currently in contact
   */
  updateContactDurations(contacts) {
    // Get all bubble IDs currently in contact
    const currentContactIds = new Set(contacts.map(bubble => bubble.id));
    
    // Increment duration for bubbles still in contact
    for (const [bubbleId, duration] of this.contactDurations) {
      if (currentContactIds.has(bubbleId)) {
        this.contactDurations.set(bubbleId, duration + 1);
      }
    }
    
    // Add new contacts with duration 1
    for (const bubble of contacts) {
      if (!this.contactDurations.has(bubble.id)) {
        this.contactDurations.set(bubble.id, 1);
      }
    }
    
    // Remove contacts that are no longer touching
    for (const [bubbleId] of this.contactDurations) {
      if (!currentContactIds.has(bubbleId)) {
        this.contactDurations.delete(bubbleId);
      }
    }
  }
  
  /**
   * Generate a random color for the bubble
   * @returns {string} Color string
   */
  generateColor(theme = 0) {
    // Continuous theme-based color generation
    // Interpolate between light colors (dark theme) and dark colors (light theme)
    
    const lightColors = [
      [74, 158, 255],   // #4a9eff
      [107, 182, 255],  // #6bb6ff
      [140, 200, 255],  // #8cc8ff
      [168, 216, 255],  // #a8d8ff
      [196, 232, 255],  // #c4e8ff
      [224, 248, 255],  // #e0f8ff
      [240, 248, 255],  // #f0f8ff
      [255, 255, 255]   // #ffffff
    ];
    
    const darkColors = [
      [46, 91, 186],    // #2E5BBA
      [74, 124, 126],   // #4A7C7E
      [107, 91, 149],   // #6B5B95
      [139, 69, 19],    // #8B4513
      [47, 79, 79],     // #2F4F4F
      [139, 0, 0],      // #8B0000
      [0, 100, 0],      // #006400
      [75, 0, 130]      // #4B0082
    ];
    
    const colorIndex = Math.floor(Math.random() * lightColors.length);
    const lightColor = lightColors[colorIndex];
    const darkColor = darkColors[colorIndex];
    
    // Interpolate between light and dark colors based on theme
    const r = Math.round(lightColor[0] + (darkColor[0] - lightColor[0]) * theme);
    const g = Math.round(lightColor[1] + (darkColor[1] - lightColor[1]) * theme);
    const b = Math.round(lightColor[2] + (darkColor[2] - lightColor[2]) * theme);
    
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  /**
   * Check if this bubble is colliding with another
   * @param {Bubble} other - Other bubble to check
   * @returns {boolean} True if colliding
   */
  isCollidingWith(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (this.radius + other.radius) * 1.05; // Allow closer contact for better deformation
  }
  
  /**
   * Draw the bubble with enhanced deformation
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Bubble>} contacts - Bubbles in contact for deformation
   */
  draw(ctx, contacts, controls = null) {
    // Safety check: don't draw bubbles with invalid radius
    if (this.radius <= 0) {
      console.warn('Attempted to draw bubble with non-positive radius:', this.radius);
      return;
    }
    
    // Get control values or use defaults
    const influenceThreshold = controls?.getValue('influenceThreshold') || 0.1;
    const deformationStrength = controls?.getValue('deformationStrength') || 1.0;
    
    // Apply post-merge oscillation (vibration effect)
    let displayRadius = this.radius;
    if (this.justMerged && this.mergeOscillationAmplitude > 0) {
      // Damped oscillation: radius wobbles and settles
      const oscillation = Math.sin(this.mergeOscillation) * this.mergeOscillationAmplitude;
      displayRadius = this.radius + oscillation;
      
      // Update oscillation
      this.mergeOscillation += 0.8; // Oscillation speed
      this.mergeOscillationAmplitude *= 0.92; // Damping (decay)
      
      // Stop oscillation when amplitude is very small
      if (this.mergeOscillationAmplitude < 0.5) {
        this.justMerged = false;
        this.mergeOscillationAmplitude = 0;
        this.mergeOscillation = 0;
      }
    }
    
    ctx.beginPath();
    
    if (contacts.length === 0) {
      // No contacts - draw circle (with oscillation if just merged)
      ctx.arc(this.x, this.y, displayRadius, 0, Math.PI * 2);
    } else {
      // Has contacts - draw deformed shape
      const segments = 32; // Smooth rendering
      const points = [];
      
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        let r = this.radius;
        
        // Check if this angle intersects with any contact
        for (let contact of contacts) {
          const dx = contact.x - this.x;
          const dy = contact.y - this.y;
          const contactAngle = Math.atan2(dy, dx);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate angle difference
          let angleDiff = angle - contactAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          
          // Smooth influence calculation with dynamic threshold
          const influence = Math.max(0, Math.cos(angleDiff));
          
          // Dynamic deformation based on controls
          if (influence > influenceThreshold) {
            const contactRadius = Math.min(this.radius, contact.radius);
            const overlap = Math.max(0, (this.radius + contact.radius) - dist);
            const deformationStrengthCalc = (overlap / (this.radius + contact.radius)) * influence * influence;
            
            const targetRadius = this.radius * (1 - deformationStrengthCalc * deformationStrength);
            r = Math.min(r, targetRadius);
          }
        }
        
        points.push({
          x: this.x + Math.cos(angle) * r,
          y: this.y + Math.sin(angle) * r
        });
      }
      
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
    }
    
    // Comprehensive safety check before drawing gradient
    if (!isFinite(this.radius) || isNaN(this.radius) || this.radius <= 0) {
      console.warn('Invalid bubble radius detected:', this.radius, 'Resetting to targetRadius:', this.targetRadius);
      this.radius = this.targetRadius || 20;
    }
    if (!isFinite(this.x) || isNaN(this.x)) {
      console.warn('Invalid bubble x position:', this.x);
      this.x = 100;
    }
    if (!isFinite(this.y) || isNaN(this.y)) {
      console.warn('Invalid bubble y position:', this.y);
      this.y = 100;
    }
    if (!isFinite(displayRadius) || isNaN(displayRadius) || displayRadius <= 0) {
      console.warn('Invalid displayRadius:', displayRadius, 'Using this.radius:', this.radius);
      displayRadius = this.radius;
    }
    
    // Create radial gradient for glassmorphism effect (use displayRadius for consistency)
    const gradient = ctx.createRadialGradient(
      this.x - displayRadius * 0.3, this.y - displayRadius * 0.3, 0,
      this.x, this.y, displayRadius
    );
    
    // Convert RGB color to RGBA with opacity
    const colorWithOpacity = (opacity) => {
      if (this.color.startsWith('rgb(')) {
        // Extract RGB values from "rgb(r, g, b)" format
        const rgbMatch = this.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const r = rgbMatch[1];
          const g = rgbMatch[2];
          const b = rgbMatch[3];
          return `rgba(${r}, ${g}, ${b}, ${opacity / 255})`;
        }
        // If match fails, return a default
        return `rgba(128, 128, 128, ${opacity / 255})`;
      }
      // Fallback for hex colors
      return this.color + opacity.toString(16).padStart(2, '0');
    };
    
    gradient.addColorStop(0, colorWithOpacity(64)); // More transparent center (40 in hex)
    gradient.addColorStop(0.7, colorWithOpacity(32)); // Very transparent middle (20 in hex)
    gradient.addColorStop(1, colorWithOpacity(16)); // Barely visible edge (10 in hex)
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw outline with reduced opacity to prevent brightness buildup
    this.drawOutline(ctx, contacts);
  }

  drawOutline(ctx, contacts) {
    // Simple outline drawing - no special handling for contacts
    // Convert RGB color to RGBA with opacity
    let outlineColor;
    if (this.color.startsWith('rgb(')) {
      // Extract RGB values from "rgb(r, g, b)" format
      const rgbMatch = this.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = rgbMatch[1];
        const g = rgbMatch[2];
        const b = rgbMatch[3];
        outlineColor = `rgba(${r}, ${g}, ${b}, 0.27)`; // 45/255 ≈ 0.27
      }
    } else {
      // Fallback for hex colors
      outlineColor = this.color + '45';
    }
    
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
  
  /**
   * Create a random bubble
   * @param {HTMLCanvasElement} canvas - Canvas for positioning
   * @param {number} targetRadius - Base radius for size variation
   * @returns {Bubble} New random bubble
   */
  static createRandom(canvas, targetRadius, theme = 0) {
    const radius = targetRadius * (0.2 + Math.random() * 3.0); // Even more size variation with larger max
    return new Bubble(
      Math.random() * (canvas.width - 100) + 50,
      Math.random() * (canvas.height - 100) + 50,
      radius,
      theme
    );
  }
}

// Static counter for unique IDs
Bubble.nextId = 0;