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
    this.vy += gravityAccel * dt * 0.03; // Reduced from 0.1 to 0.03 for gentler gravity
    
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

    // Dynamic damping (inverted for intuitive slider: higher = more friction)
    // damping slider is 0.001-0.02, we need to convert to velocity retention (0.98-0.999)
    const velocityRetention = 1.0 - damping;
    this.vx *= velocityRetention;
    this.vy *= velocityRetention;
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
      'spectrum': [
        'rgb(255, 0, 0)',      // #FF0000 - Red
        'rgb(255, 127, 0)',    // #FF7F00 - Orange
        'rgb(255, 255, 0)',    // #FFFF00 - Yellow
        'rgb(127, 255, 0)',    // #7FFF00 - Chartreuse
        'rgb(0, 255, 0)',      // #00FF00 - Green
        'rgb(0, 255, 127)',    // #00FF7F - Spring green
        'rgb(0, 255, 255)',    // #00FFFF - Cyan
        'rgb(0, 127, 255)',    // #007FFF - Azure
        'rgb(0, 0, 255)',      // #0000FF - Blue
        'rgb(127, 0, 255)',    // #7F00FF - Violet
        'rgb(255, 0, 255)',    // #FF00FF - Magenta
        'rgb(255, 0, 127)'     // #FF007F - Rose
      ],
      'neon': [
        'rgb(255, 0, 255)',    // #FF00FF - Magenta
        'rgb(0, 255, 255)',    // #00FFFF - Cyan
        'rgb(255, 255, 0)',    // #FFFF00 - Yellow
        'rgb(57, 255, 20)',    // #39FF14 - Neon green
        'rgb(255, 16, 240)',   // #FF10F0 - Neon pink
        'rgb(0, 255, 127)',    // #00FF7F - Spring green
        'rgb(255, 20, 147)',   // #FF1493 - Deep pink
        'rgb(0, 191, 255)'     // #00BFFF - Deep sky blue
      ],
      'sunset': [
        'rgb(255, 69, 0)',     // #FF4500 - Orange red
        'rgb(255, 140, 0)',    // #FF8C00 - Dark orange
        'rgb(255, 215, 0)',    // #FFD700 - Gold
        'rgb(255, 99, 71)',    // #FF6347 - Tomato
        'rgb(220, 20, 60)',    // #DC143C - Crimson
        'rgb(255, 165, 0)',    // #FFA500 - Orange
        'rgb(255, 127, 80)',   // #FF7F50 - Coral
        'rgb(178, 34, 34)'     // #B22222 - Firebrick
      ],
      'ocean': [
        'rgb(0, 0, 139)',      // #00008B - Dark blue
        'rgb(0, 128, 128)',    // #008080 - Teal
        'rgb(0, 191, 255)',    // #00BFFF - Deep sky blue
        'rgb(30, 144, 255)',   // #1E90FF - Dodger blue
        'rgb(0, 206, 209)',    // #00CED1 - Dark turquoise
        'rgb(70, 130, 180)',   // #4682B4 - Steel blue
        'rgb(0, 105, 148)',    // #006994 - Strong blue
        'rgb(25, 25, 112)'     // #191970 - Midnight blue
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
  draw(ctx, contacts, controls = null, performanceStats = null) {
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
    this.drawBubbleBody(ctx, displayRadius, controls, performanceStats);
    
    // Draw white highlight in Glossy (2) mode
    const visualStyle = controls?.getValue('visualEffects') ?? 2;
    if (visualStyle >= 2) {
      this.drawBubbleHighlight(ctx, displayRadius);
    }
  }

  /**
   * Get or create a cached gradient
   */
  static getCachedGradient(ctx, x, y, radius, color, visualStyle, opacity, performanceStats = null) {
    // Don't cache gradients - they are position-dependent and caching causes flickering
    // as bubbles move. The performance gain isn't worth the visual artifact.
    
    if (performanceStats) {
      performanceStats.gradientCreations++;
    }
    
    // Create new gradient
    let gradient;
    if (visualStyle === 0) {
      // FLAT: No gradient needed
      return null;
    } else if (visualStyle === 1) {
      // MATTE: Centered gradient
      gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    } else {
      // GLOSSY: Offset gradient
      gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    }
    
    // Add color stops based on visual style
    if (visualStyle === 1) {
      gradient.addColorStop(0, `rgba(${color}, ${opacity/255})`);
      gradient.addColorStop(0.6, `rgba(${color}, ${(opacity*0.7)/255})`);
      gradient.addColorStop(1, `rgba(${color}, ${(opacity*0.4)/255})`);
    } else {
      gradient.addColorStop(0, `rgba(${color}, ${(opacity*0.9)/255})`);
      gradient.addColorStop(0.6, `rgba(${color}, ${(opacity*0.6)/255})`);
      gradient.addColorStop(1, `rgba(${color}, ${(opacity*0.3)/255})`);
    }
    
    return gradient;
  }

  /**
   * Draw the main bubble body with size-based colors and transparency
   */
  drawBubbleBody(ctx, displayRadius, controls = null, performanceStats = null) {
    // Check visual style: 0 = Flat, 1 = Matte, 2 = Glossy
    const visualStyle = controls?.getValue('visualEffects') ?? 2;
    
    // Convert RGB color to RGBA with opacity (no color modification to preserve true colors)
    const colorWithOpacity = (opacity) => {
      if (this.color.startsWith('rgb(')) {
        const rgbMatch = this.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          
          return `rgba(${r}, ${g}, ${b}, ${opacity / 255})`;
        }
        return `rgba(128, 128, 128, ${opacity / 255})`;
      }
      return this.color + opacity.toString(16).padStart(2, '0');
    };
    
    // Extract RGB values for gradient caching
    let r, g, b;
    if (this.color.startsWith('rgb(')) {
      const rgbMatch = this.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        r = parseInt(rgbMatch[1]);
        g = parseInt(rgbMatch[2]);
        b = parseInt(rgbMatch[3]);
      } else {
        r = g = b = 128; // fallback
      }
    } else {
      r = g = b = 128; // fallback
    }
    
    if (visualStyle === 0) {
      // FLAT: Solid flat color (no gradient, very opaque)
      ctx.fillStyle = colorWithOpacity(240); // Nearly opaque (240/255 ≈ 94% opacity)
    } else {
      // Use cached gradient for MATTE and GLOSSY styles
      const opacity = visualStyle === 1 ? 200 : 180;
      const gradient = Bubble.getCachedGradient(ctx, this.x, this.y, displayRadius, `${r}, ${g}, ${b}`, visualStyle, opacity, performanceStats);
      
      if (gradient) {
        ctx.fillStyle = gradient;
      } else {
        // Fallback to direct color if gradient creation failed
        ctx.fillStyle = colorWithOpacity(opacity);
      }
    }
    
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
    const highlightRadius = displayRadius * 0.12;
    
    // Create highlight gradient - much more subtle to preserve colors
    const highlightGradient = ctx.createRadialGradient(
      highlightX, highlightY, 0,
      highlightX, highlightY, highlightRadius
    );
    
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)'); // Subtle white center
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)'); // Gentle fade
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
Bubble.currentPalette = 'rainbow';