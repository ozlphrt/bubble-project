/**
 * Physics Module
 * 
 * This module handles all physics calculations for the soap bubble simulation,
 * including collision detection, contact resolution, and force application.
 * 
 * @fileoverview Physics engine for soap bubble simulation
 * @version 1.0.0
 * @author Soap Bubble Simulation Team
 */

import { Bubble } from './bubble.js';
import { SpatialManager } from './spatial.js';

/**
 * Physics engine class for handling bubble interactions
 */
export class Physics {
  constructor() {
    this.spatialManager = null;
    this.coalescenceRate = 0.00001; // Very low default probability per frame per pair
    this.contactDurationThreshold = 300; // Frames before merge can occur (5 seconds at 60fps for rare, realistic merging)
    this.customSpawnColor = 'rgb(255, 0, 0)'; // Default to full red
    this.contactCache = new Map(); // Cache contacts to avoid redundant calculations
    this.contactCacheFrame = 0; // Track which frame the cache is from
  }

  /**
   * Initialize spatial manager with canvas dimensions
   */
  initializeSpatial(canvasWidth, canvasHeight) {
    this.spatialManager = new SpatialManager(canvasWidth, canvasHeight);
  }

  /**
   * Detect and resolve collisions between bubbles
   * @param {Array<Bubble>} bubbles - Array of all bubbles
   */
  detectCollisions(bubbles, controls = null, performanceStats = null) {
    // Get control values or use defaults
    const targetDistMultiplier = controls?.getValue('targetDist') || 1.02;
    const separationMultiplier = controls?.getValue('separation') || 0.6;
    const collisionStrengthBase = controls?.getValue('collisionStrength') || 0.03;
    
    // Use spatial partitioning for O(n log n) collision detection
    if (this.spatialManager) {
      // Run collision detection multiple times per frame for better separation
      // More passes when gravity is high to prevent overlapping
      const gravity = controls?.getValue('gravity') || 0;
      const passes = gravity > 0.05 ? 3 : 2; // Only extra pass for very high gravity
      for (let pass = 0; pass < passes; pass++) {
        this.spatialManager.rebuild(bubbles);
        
        // Get collision pairs using spatial partitioning (O(n log n) instead of O(n²))
        const collisionPairs = this.spatialManager.getAllCollisionPairs(bubbles);
        
        // Track performance stats (only on first pass)
        if (performanceStats && pass === 0) {
          performanceStats.collisionChecks = collisionPairs.length;
        }
        
        // Process only the potential collision pairs
        for (const [bubble1, bubble2] of collisionPairs) {
        const dx = bubble2.x - bubble1.x;
        const dy = bubble2.y - bubble1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = bubble1.radius + bubble2.radius;
          
        const targetDist = minDist * targetDistMultiplier;
        if (dist < targetDist && dist > 0.1) { // Minimum distance to avoid division by zero
          const overlap = targetDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          
          // Mass-based separation: lighter bubbles move more
          const totalMass = bubble1.mass + bubble2.mass;
          const massRatio_1 = bubble2.mass / totalMass; // Inverse - lighter moves more
          const massRatio_2 = bubble1.mass / totalMass;
          
          // Apply size-dependent separation force - much gentler for small bubbles
          const avgRadius = (bubble1.radius + bubble2.radius) / 2;
          const sizeFactor = Math.min(1.0, avgRadius / 15.0); // More gradual scaling
          const gravity = controls?.getValue('gravity') || 0;
          // Use sqrt for diminishing returns at high gravity (prevents jittering)
          const gravityFactor = 1.0 + Math.sqrt(gravity) * 0.5;
          const separation = overlap * separationMultiplier * (0.8 + sizeFactor * 1.2) * gravityFactor;
          bubble1.x -= nx * separation * massRatio_1;
          bubble1.y -= ny * separation * massRatio_1;
          bubble2.x += nx * separation * massRatio_2;
          bubble2.y += ny * separation * massRatio_2;
          
          const dvx = bubble2.vx - bubble1.vx;
          const dvy = bubble2.vy - bubble1.vy;
          const dvn = dvx * nx + dvy * ny;
          
          // Mass-based collision response: heavier bubbles transfer less momentum
          const sizeRatio = Math.max(bubble1.radius, bubble2.radius) / Math.min(bubble1.radius, bubble2.radius);
          const collisionStrength = collisionStrengthBase + (sizeRatio - 1) * 0.02;
          
          // Dampen collision response at high gravity to prevent jittering
          const collisionDamping = gravity > 0.05 ? 0.7 : 1.0;
          
          // Apply impulse scaled by mass ratios
          bubble1.vx += nx * dvn * collisionStrength * massRatio_1 * collisionDamping;
          bubble1.vy += ny * dvn * collisionStrength * massRatio_1 * collisionDamping;
          bubble2.vx -= nx * dvn * collisionStrength * massRatio_2 * collisionDamping;
          bubble2.vy -= ny * dvn * collisionStrength * massRatio_2 * collisionDamping;
        }
        }
      }
    } else {
      // Using O(n²) collision detection (spatial partitioning disabled for debugging)
      if (performanceStats) {
        performanceStats.collisionChecks = (bubbles.length * (bubbles.length - 1)) / 2;
      }
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const dx = bubbles[j].x - bubbles[i].x;
          const dy = bubbles[j].y - bubbles[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = bubbles[i].radius + bubbles[j].radius;
            
          const targetDist = minDist * targetDistMultiplier;
          if (dist < targetDist && dist > 0.1) {
            const overlap = targetDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            
            const totalMass = bubbles[i].mass + bubbles[j].mass;
            const massRatio_i = bubbles[j].mass / totalMass;
            const massRatio_j = bubbles[i].mass / totalMass;
            
            // Apply size-dependent separation force - much gentler for small bubbles
            const avgRadius = (bubbles[i].radius + bubbles[j].radius) / 2;
            const sizeFactor = Math.min(1.0, avgRadius / 15.0); // More gradual scaling
            const gravity = controls?.getValue('gravity') || 0;
            // Use sqrt for diminishing returns at high gravity (prevents jittering)
            const gravityFactor = 1.0 + Math.sqrt(gravity) * 0.5;
            const separation = overlap * separationMultiplier * (0.8 + sizeFactor * 1.2) * gravityFactor;
            bubbles[i].x -= nx * separation * massRatio_i;
            bubbles[i].y -= ny * separation * massRatio_i;
            bubbles[j].x += nx * separation * massRatio_j;
            bubbles[j].y += ny * separation * massRatio_j;
            
            const dvx = bubbles[j].vx - bubbles[i].vx;
            const dvy = bubbles[j].vy - bubbles[i].vy;
            const dvn = dvx * nx + dvy * ny;
            
            const sizeRatio = Math.max(bubbles[i].radius, bubbles[j].radius) / Math.min(bubbles[i].radius, bubbles[j].radius);
            const collisionStrength = collisionStrengthBase + (sizeRatio - 1) * 0.02;
            
            // Dampen collision response at high gravity to prevent jittering
            const collisionDamping = gravity > 0.05 ? 0.7 : 1.0;
            
            bubbles[i].vx += nx * dvn * collisionStrength * massRatio_i * collisionDamping;
            bubbles[i].vy += ny * dvn * collisionStrength * massRatio_i * collisionDamping;
            bubbles[j].vx -= nx * dvn * collisionStrength * massRatio_j * collisionDamping;
            bubbles[j].vy -= ny * dvn * collisionStrength * massRatio_j * collisionDamping;
          }
        }
      }
    }
  }

  /**
   * Find bubbles in contact with a given bubble
   * @param {Bubble} bubble - Bubble to find contacts for
   * @param {Array<Bubble>} allBubbles - All bubbles in simulation
   * @returns {Array<Bubble>} Array of bubbles in contact
   */
  findContacts(bubble, allBubbles, frameNumber = 0) {
    // Use cache if it's from the current frame
    if (this.contactCacheFrame === frameNumber && this.contactCache.has(bubble.id)) {
      return this.contactCache.get(bubble.id);
    }
    
    // Use spatial partitioning for contact detection if available
    let contacts;
    if (this.spatialManager) {
      const candidates = this.spatialManager.getCollisionCandidates(bubble);
      contacts = candidates.filter(other => {
        if (other === bubble) return false;
        const dx = other.x - bubble.x;
        const dy = other.y - bubble.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < bubble.radius + other.radius * 1.05; // Allow closer contact for better deformation
      });
    } else {
      // Fallback to O(n) search
      contacts = allBubbles.filter(other => {
        if (other === bubble) return false;
        const dx = other.x - bubble.x;
        const dy = other.y - bubble.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < bubble.radius + other.radius * 1.05;
      });
    }
    
    // Cache the result
    if (this.contactCacheFrame === frameNumber) {
      this.contactCache.set(bubble.id, contacts);
    }
    
    return contacts;
  }

  /**
   * Update positions of all bubbles
   * @param {Array<Bubble>} bubbles - Array of all bubbles
   * @param {number} dt - Delta time
   * @param {HTMLCanvasElement} canvas - Canvas for boundary checking
   */
  updatePositions(bubbles, dt, canvas, controls = null) {
    bubbles.forEach(bubble => {
      bubble.update(dt, canvas, controls);
    });
  }

  /**
   * Apply pressure-based forces between bubbles (Young-Laplace effect)
   * Smaller bubbles have higher pressure and push away larger bubbles
   * @param {Array<Bubble>} bubbles - Array of all bubbles
   */
  applyPressureForces(bubbles) {
    for (let i = 0; i < bubbles.length; i++) {
      for (let j = i + 1; j < bubbles.length; j++) {
        const bubble1 = bubbles[i];
        const bubble2 = bubbles[j];
        
        const dx = bubble2.x - bubble1.x;
        const dy = bubble2.y - bubble1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Only apply pressure forces if bubbles are very close and touching
        if (dist < (bubble1.radius + bubble2.radius) * 1.1) {
          const nx = dx / dist;
          const ny = dy / dist;
          
          // Pressure difference creates force
          const pressureDiff = bubble1.pressure - bubble2.pressure;
          const pressureForce = pressureDiff * 0.5; // Very strong force - increased for visibility
          
          // Apply forces (smaller bubble pushes larger bubble)
          bubble1.vx -= nx * pressureForce;
          bubble1.vy -= ny * pressureForce;
          bubble2.vx += nx * pressureForce;
          bubble2.vy += ny * pressureForce;
        }
      }
    }
  }

  /**
   * Apply compression forces to all bubbles
   * @param {Array<Bubble>} bubbles - Array of all bubbles
   * @param {number} force - Compression force magnitude
   * @param {HTMLCanvasElement} canvas - Canvas for center calculation
   */
  applyCompressionForces(bubbles, force, canvas) {
    bubbles.forEach(bubble => {
      const dx = canvas.width / 2 - bubble.x;
      const dy = canvas.height / 2 - bubble.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        bubble.vx += nx * force;
        bubble.vy += ny * force;
      }
    });
  }

  /**
   * Detect Plateau borders (triple junctions where 3+ bubbles meet)
   * @param {Array<Bubble>} bubbles - Array of all bubbles
   * @returns {Array<Object>} Array of junction objects with position, bubbles, and angles
   */
  detectPlateauBorders(bubbles) {
    const junctions = [];
    
    // For each bubble, find all its contacts
    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];
      const contacts = this.findContacts(bubble, bubbles);
      
      // Need at least 2 contacts to form a junction
      if (contacts.length >= 2) {
        // Check all pairs of contacts to find triple junctions
        for (let j = 0; j < contacts.length; j++) {
          for (let k = j + 1; k < contacts.length; k++) {
            const contact1 = contacts[j];
            const contact2 = contacts[k];
            
            // Check if contact1 and contact2 are also in contact with each other
            const dx = contact2.x - contact1.x;
            const dy = contact2.y - contact1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < (contact1.radius + contact2.radius) * 1.1) {
              // Found a triple junction! Calculate the junction point
              const junctionX = (bubble.x + contact1.x + contact2.x) / 3;
              const junctionY = (bubble.y + contact1.y + contact2.y) / 3;
              
              // Calculate angles between the three bubbles
              const angle1 = Math.atan2(bubble.y - junctionY, bubble.x - junctionX);
              const angle2 = Math.atan2(contact1.y - junctionY, contact1.x - junctionX);
              const angle3 = Math.atan2(contact2.y - junctionY, contact2.x - junctionX);
              
              // Calculate the angles between each pair
              let angleDiff1 = Math.abs(angle2 - angle1);
              let angleDiff2 = Math.abs(angle3 - angle2);
              let angleDiff3 = Math.abs(angle1 - angle3);
              
              // Normalize angles to [0, 2π]
              if (angleDiff1 > Math.PI) angleDiff1 = 2 * Math.PI - angleDiff1;
              if (angleDiff2 > Math.PI) angleDiff2 = 2 * Math.PI - angleDiff2;
              if (angleDiff3 > Math.PI) angleDiff3 = 2 * Math.PI - angleDiff3;
              
              // Check if junction already exists (avoid duplicates)
              const exists = junctions.some(j => 
                Math.abs(j.x - junctionX) < 5 && Math.abs(j.y - junctionY) < 5
              );
              
              if (!exists) {
                // Calculate how close the angles are to 120° (2π/3 radians)
                const idealAngle = (2 * Math.PI) / 3; // 120 degrees
                const angleError1 = Math.abs(angleDiff1 - idealAngle);
                const angleError2 = Math.abs(angleDiff2 - idealAngle);
                const angleError3 = Math.abs(angleDiff3 - idealAngle);
                const avgError = (angleError1 + angleError2 + angleError3) / 3;
                
                // Consider it a "good" Plateau border if average error < 10° (0.174 radians)
                const isPerfect = avgError < 0.174; // ~10 degrees
                
                junctions.push({
                  x: junctionX,
                  y: junctionY,
                  bubbles: [bubble, contact1, contact2],
                  angles: [angleDiff1, angleDiff2, angleDiff3],
                  avgError: avgError,
                  isPerfect: isPerfect
                });
              }
            }
          }
        }
      }
    }
    
    return junctions;
  }

  /**
   * Apply forces at Plateau borders to push angles toward 120°
   * This enforces Plateau's First Law: three films meet at 120° angles
   * @param {Array<Object>} junctions - Array of junction objects from detectPlateauBorders
   * @param {Controls} controls - Controls object to get force strength
   */
  applyPlateauForces(junctions, controls = null) {
    const forceStrength = controls?.getValue('plateauForceStrength') || 0.1;
    
    // Always apply Plateau forces (toggle removed)
    
    junctions.forEach(junction => {
      // Skip if junction is already perfect (within tolerance)
      if (junction.isPerfect) return;
      
      const [bubble1, bubble2, bubble3] = junction.bubbles;
      const idealAngle = (2 * Math.PI) / 3; // 120 degrees
      
      // Calculate current angles from junction to each bubble
      const angle1 = Math.atan2(bubble1.y - junction.y, bubble1.x - junction.x);
      const angle2 = Math.atan2(bubble2.y - junction.y, bubble2.x - junction.x);
      const angle3 = Math.atan2(bubble3.y - junction.y, bubble3.x - junction.x);
      
      // Sort angles to get them in order around the junction
      let angles = [
        { angle: angle1, bubble: bubble1 },
        { angle: angle2, bubble: bubble2 },
        { angle: angle3, bubble: bubble3 }
      ].sort((a, b) => a.angle - b.angle);
      
      // For each pair of adjacent bubbles, calculate the angle between them
      for (let i = 0; i < 3; i++) {
        const current = angles[i];
        const next = angles[(i + 1) % 3];
        
        // Calculate angle difference
        let angleDiff = next.angle - current.angle;
        if (angleDiff < 0) angleDiff += 2 * Math.PI;
        
        // Calculate error from ideal 120°
        const angleError = angleDiff - idealAngle;
        
        // Apply corrective forces perpendicular to the radial direction
        // This will rotate the bubbles around the junction
        // Use larger tolerance to prevent endless oscillation
        if (Math.abs(angleError) > 0.1) { // Only apply if error > ~6 degrees
          // Scale force down as we get closer to ideal angle (proportional control)
          const errorMagnitude = Math.abs(angleError);
          const scaleFactor = Math.min(1, errorMagnitude / 0.5); // Reduces force near target
          const force = angleError * forceStrength * scaleFactor;
          
          // Calculate perpendicular directions (tangent to circle around junction)
          const dist1 = Math.sqrt(
            Math.pow(current.bubble.x - junction.x, 2) + 
            Math.pow(current.bubble.y - junction.y, 2)
          );
          const dist2 = Math.sqrt(
            Math.pow(next.bubble.x - junction.x, 2) + 
            Math.pow(next.bubble.y - junction.y, 2)
          );
          
          if (dist1 > 0 && dist2 > 0) {
            // Perpendicular force (rotate current bubble clockwise if angle too large)
            const perpX1 = -(current.bubble.y - junction.y) / dist1;
            const perpY1 = (current.bubble.x - junction.x) / dist1;
            
            const perpX2 = -(next.bubble.y - junction.y) / dist2;
            const perpY2 = (next.bubble.x - junction.x) / dist2;
            
            // Apply forces to rotate bubbles toward ideal angle
            current.bubble.vx += perpX1 * force * 0.5;
            current.bubble.vy += perpY1 * force * 0.5;
            next.bubble.vx -= perpX2 * force * 0.5;
            next.bubble.vy -= perpY2 * force * 0.5;
          }
        }
      }
    });
  }
  
  /**
   * Check if two bubbles should coalesce (merge)
   * @param {Bubble} bubble1 - First bubble
   * @param {Bubble} bubble2 - Second bubble
   * @param {number} coalescenceRate - Rate of coalescence (0-1)
   * @returns {boolean} True if bubbles should merge
   */
  shouldCoalesce(bubble1, bubble2, coalescenceRate) {
    // Check if bubbles have been in contact long enough
    const contactDuration1 = bubble1.contactDurations.get(bubble2.id) || 0;
    const contactDuration2 = bubble2.contactDurations.get(bubble1.id) || 0;
    const maxContactDuration = Math.max(contactDuration1, contactDuration2);
    
    if (maxContactDuration < this.contactDurationThreshold) {
      return false;
    }
    
    // Calculate pressure differential (smaller bubbles have higher pressure)
    const pressure1 = 1.0 / bubble1.radius; // Simplified pressure calculation
    const pressure2 = 1.0 / bubble2.radius;
    const pressureDiff = Math.abs(pressure1 - pressure2);
    
    // Higher pressure difference = higher merge probability
    const baseProbability = coalescenceRate * (1.0 + pressureDiff * 0.5);
    
    // Stochastic rupture
    return Math.random() < baseProbability;
  }
  
  /**
   * Merge two bubbles into one
   * @param {Bubble} bubble1 - First bubble (will be removed)
   * @param {Bubble} bubble2 - Second bubble (will become the merged bubble)
   * @param {HTMLCanvasElement} canvas - Canvas for spawning new bubble
   * @returns {Bubble} The merged bubble
   */
  mergeBubbles(bubble1, bubble2, canvas = null, audioCallback = null) {
    // Safety check: ensure both bubbles have positive radius
    if (bubble1.radius <= 0 || bubble2.radius <= 0) {
      console.warn('Attempted to merge bubble with non-positive radius');
      return;
    }
    
    // Volume conservation: r_new = sqrt(r1² + r2²) for 2D area
    const newRadius = Math.sqrt(bubble1.radius * bubble1.radius + bubble2.radius * bubble2.radius);
    
    // Play coalescence sound if audio callback provided
    if (audioCallback) {
      audioCallback(bubble1.radius, bubble2.radius, newRadius);
    }
    
    // Position: weighted center of mass
    const totalMass = bubble1.mass + bubble2.mass;
    const newX = (bubble1.x * bubble1.mass + bubble2.x * bubble2.mass) / totalMass;
    const newY = (bubble1.y * bubble1.mass + bubble2.y * bubble2.mass) / totalMass;
    
    // Momentum conservation
    const newVx = (bubble1.vx * bubble1.mass + bubble2.vx * bubble2.mass) / totalMass;
    const newVy = (bubble1.vy * bubble1.mass + bubble2.vy * bubble2.mass) / totalMass;
    
    // Update bubble2 to be the merged bubble
    bubble2.x = newX;
    bubble2.y = newY;
    bubble2.radius = newRadius;
    bubble2.vx = newVx;
    bubble2.vy = newVy;
    bubble2.mass = Math.PI * newRadius * newRadius;
    
    // Color blending (weighted average)
    const color1 = this.hexToRgb(bubble1.color);
    const color2 = this.hexToRgb(bubble2.color);
    const weight1 = bubble1.mass / totalMass;
    const weight2 = bubble2.mass / totalMass;
    
    const newR = Math.round(color1.r * weight1 + color2.r * weight2);
    const newG = Math.round(color1.g * weight1 + color2.g * weight2);
    const newB = Math.round(color1.b * weight1 + color2.b * weight2);
    
    bubble2.color = `rgb(${newR}, ${newG}, ${newB})`;
    
    // Mark bubble1 for removal
    bubble1.merging = true;
    bubble1.mergingWith = bubble2;
    bubble1.mergeProgress = 0;
    
    // Trigger post-merge oscillation (vibration) for bubble2
    bubble2.justMerged = true;
    bubble2.mergeOscillation = 0;
    bubble2.mergeOscillationAmplitude = newRadius * 0.15; // 15% of radius
    
    // Store canvas reference for spawning new bubble
    this.lastMergeCanvas = canvas;
    this.spawnBubbleOnMerge = true;
    
    return bubble2;
  }
  
  /**
   * Convert hex or rgb color to RGB object
   * @param {string} color - Hex color string (#ff0000) or rgb string (rgb(255, 0, 0))
   * @returns {Object} RGB object
   */
  hexToRgb(color) {
    // Try to parse as rgb() format first
    const rgbMatch = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.exec(color);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10)
      };
    }
    
    // Try to parse as hex format
    const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (hexMatch) {
      return {
        r: parseInt(hexMatch[1], 16),
        g: parseInt(hexMatch[2], 16),
        b: parseInt(hexMatch[3], 16)
      };
    }
    
    // Default to gray if parsing fails
    return { r: 128, g: 128, b: 128 };
  }
  
  /**
   * Process coalescence for all bubbles
   * @param {Array<Bubble>} bubbles - Array of all bubbles
   * @param {number} coalescenceRate - Rate of coalescence (0-1)
   * @param {HTMLCanvasElement} canvas - Canvas for spawning new bubbles
   * @returns {Array<Bubble>} Updated array of bubbles
   */
  processCoalescence(bubbles, coalescenceRate, canvas = null, audioCallback = null) {
    // Skip entirely if coalescence rate is zero
    if (coalescenceRate === 0) {
      return bubbles;
    }
    
    const bubblesToRemove = [];
    
    for (let i = 0; i < bubbles.length; i++) {
      const bubble1 = bubbles[i];
      
      // Skip if already merging
      if (bubble1.merging) continue;
      
      for (let j = i + 1; j < bubbles.length; j++) {
        const bubble2 = bubbles[j];
        
        // Skip if already merging
        if (bubble2.merging) continue;
        
        // Check if bubbles are in contact
        const dx = bubble2.x - bubble1.x;
        const dy = bubble2.y - bubble1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const contactDistance = bubble1.radius + bubble2.radius;
        
        if (distance < contactDistance && this.shouldCoalesce(bubble1, bubble2, coalescenceRate)) {
          // Mark bubble1 for merging animation
          bubble1.merging = true;
          bubble1.mergingWith = bubble2;
          bubble1.mergeProgress = 0;
          
          // Merge bubbles and pass canvas for spawning
          this.mergeBubbles(bubble1, bubble2, canvas, audioCallback);
          bubblesToRemove.push(bubble1);
          break; // bubble1 is now marked for removal
        }
      }
    }
    
    // Remove merged bubbles
    const updatedBubbles = bubbles.filter(bubble => !bubblesToRemove.includes(bubble));
    
    // Calculate canvas density (bubbles per unit area)
    if (canvas) {
      const canvasArea = canvas.width * canvas.height;
      const totalBubbleArea = updatedBubbles.reduce((sum, b) => sum + Math.PI * b.radius * b.radius, 0);
      const density = totalBubbleArea / canvasArea;
      
      // Dynamic spawn rate based on density
      // Low density (lots of gaps) -> spawn more bubbles
      // High density (crowded) -> spawn fewer bubbles
      const targetDensity = 0.3; // Target ~30% coverage
      const densityRatio = density / targetDensity;
      
      // Determine how many bubbles to spawn
      let spawnCount = bubblesToRemove.length; // Base: replace merged bubbles
      
      if (densityRatio < 0.7) {
        // Low density - spawn extra bubbles to fill gaps
        spawnCount = Math.min(bubblesToRemove.length + 2, 3);
      } else if (densityRatio > 1.3) {
        // High density - spawn fewer bubbles
        spawnCount = Math.max(1, Math.floor(bubblesToRemove.length * 0.5));
      }
      
      // Add new bubbles from top-left corner
      if (bubblesToRemove.length > 0) {
        for (let i = 0; i < spawnCount; i++) {
          const newBubble = this.createBubbleFromCorner(canvas, updatedBubbles);
          if (newBubble) {
            updatedBubbles.push(newBubble);
          }
        }
      }
    }
    
    return updatedBubbles;
  }
  
  /**
   * Create a new bubble from a random corner
   * @param {HTMLCanvasElement} canvas - Canvas for positioning
   * @param {Array<Bubble>} existingBubbles - Existing bubbles to determine size
   * @returns {Bubble} New bubble from corner
   */
  createBubbleFromCorner(canvas, existingBubbles) {
    // Calculate average radius from existing bubbles for size variation base
    const avgRadius = existingBubbles.length > 0 
      ? existingBubbles.reduce((sum, b) => sum + b.radius, 0) / existingBubbles.length 
      : 20;
    
    // Create random size variation (0.5x to 1.5x average)
    const sizeVariation = 0.5 + Math.random();
    const radius = avgRadius * sizeVariation;
    
    const margin = Math.max(radius + 10, 30); // Margin from edge (ensure minimum margin)
    
    // Always spawn from top-left corner
    const x = margin;
    const y = margin;
    
    // Create new bubble at corner position
    const newBubble = new Bubble(x, y, radius, 0);
    
    // Apply spawn color based on mode
    if (this.spawnColorMode === 'custom' && this.customSpawnColor) {
      // Custom color from color picker
      newBubble.color = this.customSpawnColor;
    } else if (this.spawnColorMode === 'palette' && this.spawnPaletteMode) {
      // Different palette for spawned bubbles
      import('./bubble.js').then(module => {
        const colors = module.Bubble.getPaletteColors(this.spawnPaletteMode);
        newBubble.color = colors[Math.floor(Math.random() * colors.length)];
      });
    }
    // else: use current palette (default behavior)
    
    // Give it a small downward and rightward velocity (scaled by size - smaller bubbles faster)
    const speedScale = Math.sqrt(20 / radius); // Smaller bubbles fall faster
    newBubble.vx = 1 * speedScale; // Move right from top-left
    newBubble.vy = 2 * speedScale;
    
    return newBubble;
  }
}