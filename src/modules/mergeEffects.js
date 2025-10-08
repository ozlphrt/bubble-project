/**
 * Merge Effects Module
 * 
 * Handles visual effects for bubble merging including particles, ripples, and glow
 * 
 * @fileoverview Visual effects for bubble coalescence
 * @version 1.0.0
 */

/**
 * Particle class for merge effect particles
 */
class MergeParticle {
  constructor(x, y, angle, speed, color) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1.0; // 1.0 = full life, 0.0 = dead
    this.decay = 0.02 + Math.random() * 0.02; // Random decay rate
    this.size = 2 + Math.random() * 3;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.vx *= 0.95; // Slow down
    this.vy *= 0.95;
  }

  draw(ctx) {
    if (this.life <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.life;
    
    // Create gradient for particle
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size
    );
    
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

/**
 * Ripple effect for bubble merging
 */
class MergeRipple {
  constructor(x, y, maxRadius, color) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = maxRadius;
    this.life = 1.0;
    this.decay = 0.03;
    this.color = color;
  }

  update() {
    this.radius += this.maxRadius * 0.08; // Expand quickly
    this.life -= this.decay;
  }

  draw(ctx) {
    if (this.life <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.life * 0.6;
    
    // Draw expanding ring
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw inner glow
    ctx.globalAlpha = this.life * 0.3;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

/**
 * Glow effect for merging bubbles
 */
class MergeGlow {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.life = 1.0;
    this.decay = 0.04;
    this.color = color;
    this.pulsePhase = 0;
  }

  update() {
    this.life -= this.decay;
    this.pulsePhase += 0.3;
  }

  draw(ctx) {
    if (this.life <= 0) return;

    ctx.save();
    
    // Pulsing glow effect
    const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
    const glowRadius = this.radius * (1.5 + pulse * 0.5);
    
    ctx.globalAlpha = this.life * 0.4 * pulse;
    
    // Create radial gradient for glow
    const gradient = ctx.createRadialGradient(
      this.x, this.y, this.radius * 0.5,
      this.x, this.y, glowRadius
    );
    
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.color.replace('rgb', 'rgba').replace(')', ', 0.5)'));
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

/**
 * Merge Effects Manager
 */
export class MergeEffects {
  constructor() {
    this.particles = [];
    this.ripples = [];
    this.glows = [];
  }

  /**
   * Create merge effect at bubble merge location
   */
  createMergeEffect(x, y, radius, color, mergedRadius) {
    // Create particles
    const particleCount = Math.min(30, Math.floor(radius * 2));
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 4;
      this.particles.push(new MergeParticle(x, y, angle, speed, color));
    }

    // Create ripples (2-3 ripples at different speeds)
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.ripples.push(new MergeRipple(x, y, mergedRadius * 1.5, color));
      }, i * 100); // Stagger ripples
    }

    // Create glow effect
    this.glows.push(new MergeGlow(x, y, mergedRadius, color));
  }

  /**
   * Update all active effects
   */
  update() {
    // Update and remove dead particles
    this.particles = this.particles.filter(particle => {
      particle.update();
      return !particle.isDead();
    });

    // Update and remove dead ripples
    this.ripples = this.ripples.filter(ripple => {
      ripple.update();
      return !ripple.isDead();
    });

    // Update and remove dead glows
    this.glows = this.glows.filter(glow => {
      glow.update();
      return !glow.isDead();
    });
  }

  /**
   * Render all active effects
   */
  render(ctx) {
    // Draw glows first (behind everything)
    this.glows.forEach(glow => glow.draw(ctx));
    
    // Draw ripples
    this.ripples.forEach(ripple => ripple.draw(ctx));
    
    // Draw particles on top
    this.particles.forEach(particle => particle.draw(ctx));
  }

  /**
   * Get total active effects count
   */
  getActiveCount() {
    return this.particles.length + this.ripples.length + this.glows.length;
  }

  /**
   * Clear all effects
   */
  clear() {
    this.particles = [];
    this.ripples = [];
    this.glows = [];
  }
}

