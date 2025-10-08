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
    
    // Apply gravity (force = mass × acceleration, but we apply acceleration directly)
    // Larger bubbles have more mass but in 2D soap films, buoyancy somewhat compensates
    // We scale gravity slightly by inverse of radius to simulate this
    const gravity = controls?.getValue('gravity') || 0;
    const massScale = Math.sqrt(this.mass / (Math.PI * 20 * 20)); // Normalize to radius=20
    const gravityAccel = gravity / Math.max(0.5, massScale); // Larger bubbles fall slower due to air resistance
    this.vy += gravityAccel * dt * 0.1; // Much smaller scale for reasonable effect
    
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
    
    // Update mass when radius changes
    this.mass = Math.PI * this.radius * this.radius;
    
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
   * Generate a random color for the bubble based on current palette
   * @returns {string} Color string
   */
  generateColor(theme = 0) {
    const palette = Bubble.currentPalette || 'blues';
    const colors = Bubble.getPaletteColors(palette);
    
    const colorIndex = Math.floor(Math.random() * colors.length);
    const color = colors[colorIndex];
    
    return color;
  }
  
  /**
   * Get color palette definitions
   */
  static getPaletteColors(paletteId) {
    const palettes = {
      'blues': [
        'rgb(74, 158, 255)',   // #4a9eff
        'rgb(107, 182, 255)',  // #6bb6ff
        'rgb(140, 200, 255)',  // #8cc8ff
        'rgb(168, 216, 255)',  // #a8d8ff
        'rgb(196, 232, 255)',  // #c4e8ff
        'rgb(224, 248, 255)',  // #e0f8ff
        'rgb(240, 248, 255)',  // #f0f8ff
        'rgb(255, 255, 255)'   // #ffffff
      ],
      'neon': [
        'rgb(255, 16, 240)',   // #FF10F0 - Hot pink/magenta
        'rgb(0, 240, 255)',    // #00F0FF - Bright cyan
        'rgb(255, 255, 0)',    // #FFFF00 - Pure yellow
        'rgb(0, 255, 65)',     // #00FF41 - Bright green
        'rgb(255, 0, 255)',    // #FF00FF - Pure magenta
        'rgb(0, 255, 255)',    // #00FFFF - Pure cyan
        'rgb(255, 128, 0)',    // #FF8000 - Bright orange
        'rgb(128, 255, 0)'     // #80FF00 - Lime green
      ],
      'sunset': [
        'rgb(255, 107, 107)',  // #FF6B6B
        'rgb(255, 160, 122)',  // #FFA07A
        'rgb(255, 217, 61)',   // #FFD93D
        'rgb(255, 140, 66)',   // #FF8C42
        'rgb(255, 99, 132)',   // #FF6384
        'rgb(255, 159, 64)',   // #FF9F40
        'rgb(255, 205, 86)',   // #FFCD56
        'rgb(255, 127, 80)'    // #FF7F50
      ],
      'ocean': [
        'rgb(0, 105, 148)',    // #006994
        'rgb(0, 145, 173)',    // #0091AD
        'rgb(0, 180, 216)',    // #00B4D8
        'rgb(72, 202, 228)',   // #48CAE4
        'rgb(144, 224, 239)',  // #90E0EF
        'rgb(174, 233, 242)',  // #ADE8F4
        'rgb(202, 240, 248)',  // #CAF0F8
        'rgb(3, 169, 244)'     // #03A9F4
      ],
      'candy': [
        'rgb(255, 20, 147)',   // #FF1493 - Deep pink
        'rgb(255, 105, 180)',  // #FF69B4 - Hot pink
        'rgb(0, 206, 209)',    // #00CED1 - Turquoise
        'rgb(127, 255, 0)',    // #7FFF00 - Chartreuse
        'rgb(255, 0, 255)',    // #FF00FF - Magenta
        'rgb(0, 255, 255)',    // #00FFFF - Cyan
        'rgb(255, 215, 0)',    // #FFD700 - Gold
        'rgb(138, 43, 226)'    // #8A2BE2 - Blue violet
      ],
      'electric': [
        'rgb(157, 0, 255)',    // #9D00FF - Electric purple
        'rgb(255, 0, 255)',    // #FF00FF - Electric magenta
        'rgb(0, 255, 255)',    // #00FFFF - Electric cyan
        'rgb(0, 255, 0)',      // #00FF00 - Electric green
        'rgb(255, 0, 128)',    // #FF0080 - Electric pink
        'rgb(0, 128, 255)',    // #0080FF - Electric blue
        'rgb(255, 255, 0)',    // #FFFF00 - Electric yellow
        'rgb(128, 0, 255)'     // #8000FF - Deep electric purple
      ],
      'rainbow': [
        'rgb(255, 107, 107)',  // #FF6B6B (Red)
        'rgb(255, 140, 66)',   // #FF8C42 (Orange)
        'rgb(255, 217, 61)',   // #FFD93D (Yellow)
        'rgb(107, 207, 127)',  // #6BCF7F (Green)
        'rgb(77, 150, 255)',   // #4D96FF (Blue)
        'rgb(139, 122, 184)',  // #8B7AB8 (Purple)
        'rgb(255, 179, 186)',  // #FFB3BA (Pink)
        'rgb(144, 224, 239)'   // #90E0EF (Cyan)
      ],
      'mono': [
        'rgb(224, 224, 224)',  // #E0E0E0
        'rgb(204, 204, 204)',  // #CCCCCC
        'rgb(179, 179, 179)',  // #B3B3B3
        'rgb(153, 153, 153)',  // #999999
        'rgb(189, 189, 189)',  // #BDBDBD
        'rgb(238, 238, 238)',  // #EEEEEE
        'rgb(158, 158, 158)',  // #9E9E9E
        'rgb(117, 117, 117)'   // #757575
      ],
      'fire': [
        'rgb(255, 0, 0)',      // #FF0000 - Pure red
        'rgb(255, 69, 0)',     // #FF4500 - Orange red
        'rgb(255, 140, 0)',    // #FF8C00 - Dark orange
        'rgb(255, 215, 0)',    // #FFD700 - Gold
        'rgb(255, 99, 71)',    // #FF6347 - Tomato
        'rgb(255, 165, 0)',    // #FFA500 - Orange
        'rgb(255, 255, 0)',    // #FFFF00 - Yellow
        'rgb(255, 127, 80)'    // #FF7F50 - Coral
      ]
    };
    
    return palettes[paletteId] || palettes['blues'];
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
    
    // Enhanced bubble rendering with visual effects
    this.drawBubbleBody(ctx, displayRadius);
    
    // Only draw visual effects if enabled
    const visualEffectsEnabled = controls?.getValue('visualEffects') ?? 1;
    if (visualEffectsEnabled >= 0.5) {
      this.drawBubbleHighlight(ctx, displayRadius);
    }
  }

  /**
   * Draw the main bubble body with size-based colors and transparency
   */
  drawBubbleBody(ctx, displayRadius) {
    // Create radial gradient for glassmorphism effect
    const gradient = ctx.createRadialGradient(
      this.x - displayRadius * 0.3, this.y - displayRadius * 0.3, 0,
      this.x, this.y, displayRadius
    );
    
    // Size-based color enhancement - smaller bubbles get more vibrant colors
    const sizeFactor = Math.min(1, this.radius / 30); // Normalize size factor
    const vibrancyBoost = 1 + (1 - sizeFactor) * 0.3; // Boost smaller bubbles
    
    // Convert RGB color to RGBA with size-based opacity
    const colorWithOpacity = (opacity) => {
      if (this.color.startsWith('rgb(')) {
        const rgbMatch = this.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          let r = parseInt(rgbMatch[1]) * vibrancyBoost;
          let g = parseInt(rgbMatch[2]) * vibrancyBoost;
          let b = parseInt(rgbMatch[3]) * vibrancyBoost;
          
          // Clamp to valid RGB range
          r = Math.min(255, Math.max(0, r));
          g = Math.min(255, Math.max(0, g));
          b = Math.min(255, Math.max(0, b));
          
          return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${opacity / 255})`;
        }
        return `rgba(128, 128, 128, ${opacity / 255})`;
      }
      return this.color + opacity.toString(16).padStart(2, '0');
    };
    
    // Enhanced gradient with better transparency
    gradient.addColorStop(0, colorWithOpacity(80)); // Brighter center
    gradient.addColorStop(0.6, colorWithOpacity(40)); // Transparent middle
    gradient.addColorStop(1, colorWithOpacity(20)); // Very transparent edge
    
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  /**
   * Draw bubble highlight (white spot) for realism
   */
  drawBubbleHighlight(ctx, displayRadius) {
    if (displayRadius < 5) return; // Skip highlights for very small bubbles
    
    ctx.save();
    
    // Calculate highlight position (slightly offset from center)
    const highlightX = this.x - displayRadius * 0.25;
    const highlightY = this.y - displayRadius * 0.25;
    const highlightRadius = displayRadius * 0.15;
    
    // Create highlight gradient
    const highlightGradient = ctx.createRadialGradient(
      highlightX, highlightY, 0,
      highlightX, highlightY, highlightRadius
    );
    
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Bright white center
    highlightGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)'); // Fade out
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Transparent edge
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Draw bubble rim lighting for depth
   */
  drawBubbleRim(ctx, displayRadius) {
    ctx.save();
    
    // Create rim lighting effect
    const rimGradient = ctx.createRadialGradient(
      this.x, this.y, displayRadius * 0.8,
      this.x, this.y, displayRadius
    );
    
    // Extract base color for rim
    let rimColor = 'rgba(255, 255, 255, 0.3)'; // Default white rim
    if (this.color.startsWith('rgb(')) {
      const rgbMatch = this.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = rgbMatch[1];
        const g = rgbMatch[2];
        const b = rgbMatch[3];
        rimColor = `rgba(${r}, ${g}, ${b}, 0.4)`;
      }
    }
    
    rimGradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Transparent center
    rimGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0)'); // Still transparent
    rimGradient.addColorStop(1, rimColor); // Colored rim
    
    ctx.fillStyle = rimGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, displayRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
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

// Static current palette
Bubble.currentPalette = 'blues';