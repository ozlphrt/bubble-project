/**
 * Obstacles Module
 * 
 * This module handles static circular obstacles that bubbles collide with
 * and navigate around in the simulation.
 * 
 * @fileoverview Obstacle management for bubble simulation
 * @version 1.0.0
 */

/**
 * Obstacle class representing a static circular barrier
 */
export class Obstacle {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.id = Obstacle.nextId++;
  }
  
  /**
   * Draw the obstacle
   */
  draw(ctx) {
    ctx.save();
    
    // Draw obstacle with gradient
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3, 
      this.y - this.radius * 0.3, 
      0,
      this.x, 
      this.y, 
      this.radius
    );
    gradient.addColorStop(0, 'rgba(80, 80, 80, 0.9)');
    gradient.addColorStop(0.7, 'rgba(50, 50, 50, 0.8)');
    gradient.addColorStop(1, 'rgba(30, 30, 30, 0.9)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw highlight
    const highlightGradient = ctx.createRadialGradient(
      this.x - this.radius * 0.4,
      this.y - this.radius * 0.4,
      0,
      this.x - this.radius * 0.4,
      this.y - this.radius * 0.4,
      this.radius * 0.3
    );
    highlightGradient.addColorStop(0, 'rgba(150, 150, 150, 0.4)');
    highlightGradient.addColorStop(1, 'rgba(150, 150, 150, 0)');
    
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * Check if a point is inside the obstacle
   */
  containsPoint(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.radius;
  }
}

Obstacle.nextId = 0;

/**
 * Pipe class representing a continuous drawn path
 */
export class Pipe {
  constructor(radius = 40) {
    this.points = [];
    this.originalPoints = []; // Store original positions
    this.radius = radius;
    this.id = Pipe.nextId++;
    
    // Rotation animation properties
    this.rotationAmplitude = 20 * Math.PI / 180; // 20 degrees in radians
    this.rotationSpeed = 0.02; // Slower rotation speed (reduced from 0.05)
    this.rotationPhase = 0; // Current phase of rotation
    this.centerX = 0; // Center of gravity X
    this.centerY = 0; // Center of gravity Y
  }
  
  addPoint(x, y) {
    this.points.push({ x, y });
    this.originalPoints.push({ x, y }); // Store original position
  }
  
  /**
   * Calculate center of gravity (average position of all points)
   */
  calculateCenter() {
    if (this.originalPoints.length === 0) return;
    
    let sumX = 0, sumY = 0;
    for (let i = 0; i < this.originalPoints.length; i++) {
      sumX += this.originalPoints[i].x;
      sumY += this.originalPoints[i].y;
    }
    
    this.centerX = sumX / this.originalPoints.length;
    this.centerY = sumY / this.originalPoints.length;
  }
  
  /**
   * Update rotation animation - rotates the entire pipe around its center of gravity
   */
  updateWave(deltaTime = 16) {
    if (this.originalPoints.length < 1) return;
    
    // Calculate center of gravity if not already done
    if (this.centerX === 0 && this.centerY === 0 && this.originalPoints.length > 0) {
      this.calculateCenter();
    }
    
    // Update rotation phase
    this.rotationPhase += this.rotationSpeed * (deltaTime / 16);
    
    // Calculate current rotation angle (oscillates between -20° and +20°)
    const currentAngle = Math.sin(this.rotationPhase) * this.rotationAmplitude;
    
    // Rotate each point around the center of gravity
    const cosAngle = Math.cos(currentAngle);
    const sinAngle = Math.sin(currentAngle);
    
    for (let i = 0; i < this.points.length; i++) {
      const original = this.originalPoints[i];
      
      // Translate point to origin (relative to center)
      const relativeX = original.x - this.centerX;
      const relativeY = original.y - this.centerY;
      
      // Apply rotation
      const rotatedX = relativeX * cosAngle - relativeY * sinAngle;
      const rotatedY = relativeX * sinAngle + relativeY * cosAngle;
      
      // Translate back to world coordinates
      this.points[i].x = rotatedX + this.centerX;
      this.points[i].y = rotatedY + this.centerY;
    }
  }
  
  /**
   * Draw the pipe as a continuous stroke
   */
  draw(ctx, showPivot = true) {
    if (this.points.length < 2) {
      // Draw single point as circle
      if (this.points.length === 1) {
        const p = this.points[0];
        ctx.save();
        const gradient = ctx.createRadialGradient(
          p.x - this.radius * 0.3, 
          p.y - this.radius * 0.3, 
          0,
          p.x, 
          p.y, 
          this.radius
        );
        gradient.addColorStop(0, 'rgba(220, 220, 240, 0.9)'); // Bright center
        gradient.addColorStop(0.7, 'rgba(180, 180, 200, 0.9)');
        gradient.addColorStop(1, 'rgba(160, 160, 180, 0.9)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(220, 220, 240, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      return;
    }
    
    ctx.save();
    
    // Draw the pipe body as a thick stroke with brighter color
    ctx.strokeStyle = 'rgba(180, 180, 200, 0.9)'; // Much brighter
    ctx.lineWidth = this.radius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    
    // Draw bright border/highlight
    ctx.strokeStyle = 'rgba(220, 220, 240, 0.7)'; // Bright highlight
    ctx.lineWidth = this.radius * 2 + 2;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    
    // Redraw body on top
    ctx.strokeStyle = 'rgba(180, 180, 200, 0.9)';
    ctx.lineWidth = this.radius * 2;
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.stroke();
    
    // Draw pivot point indicator
    if (showPivot && this.originalPoints.length > 0) {
      // Draw crosshair at pivot point
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
      
      // Draw circle
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // Draw crosshair lines
      ctx.beginPath();
      ctx.moveTo(this.centerX - 12, this.centerY);
      ctx.lineTo(this.centerX + 12, this.centerY);
      ctx.moveTo(this.centerX, this.centerY - 12);
      ctx.lineTo(this.centerX, this.centerY + 12);
      ctx.stroke();
      
      // Draw rotation angle indicator arc
      const arcRadius = 30;
      const angleDegrees = this.rotationAmplitude * 180 / Math.PI;
      
      // Draw arc showing rotation range
      ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, arcRadius, -this.rotationAmplitude, this.rotationAmplitude);
      ctx.stroke();
      
      // Draw angle text
      ctx.fillStyle = 'rgba(100, 200, 255, 0.9)';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`±${Math.round(angleDegrees)}°`, this.centerX, this.centerY - arcRadius - 10);
    }
    
    ctx.restore();
  }
  
  /**
   * Check if a point is near the pivot point
   */
  isPivotAt(x, y, threshold = 15) {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }
  
  /**
   * Move pivot point to new position, constrained to the pipe path
   */
  movePivotTo(x, y) {
    if (this.originalPoints.length === 0) return;
    
    // Find the closest point on the original path
    let closestDist = Infinity;
    let closestX = this.originalPoints[0].x;
    let closestY = this.originalPoints[0].y;
    
    for (let i = 0; i < this.originalPoints.length; i++) {
      const p = this.originalPoints[i];
      const dx = x - p.x;
      const dy = y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < closestDist) {
        closestDist = dist;
        closestX = p.x;
        closestY = p.y;
      }
    }
    
    // Set pivot to closest point on path
    this.centerX = closestX;
    this.centerY = closestY;
  }
  
  /**
   * Adjust rotation angle amplitude based on mouse position
   */
  adjustRotationAngle(mouseX, mouseY) {
    // Calculate angle from pivot to mouse
    const dx = mouseX - this.centerX;
    const dy = mouseY - this.centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Map distance to rotation amplitude (0-60 degrees)
    // Closer = less rotation, farther = more rotation
    const maxDistance = 200; // pixels
    const normalizedDist = Math.min(distance / maxDistance, 1.0);
    this.rotationAmplitude = normalizedDist * 60 * Math.PI / 180; // 0-60 degrees
  }
  
  /**
   * Check if a point is near the pipe
   */
  containsPoint(x, y) {
    // Check against all line segments
    for (let i = 0; i < this.points.length; i++) {
      const p = this.points[i];
      const dx = x - p.x;
      const dy = y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < this.radius) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get all collision circles for physics
   */
  getCollisionCircles() {
    return this.points.map(p => ({ x: p.x, y: p.y, radius: this.radius }));
  }
}

Pipe.nextId = 0;

/**
 * ObstacleManager class for managing all obstacles
 */
export class ObstacleManager {
  constructor() {
    this.obstacles = [];
    this.pipes = [];
    this.currentPipe = null; // Pipe being drawn
    this.enabled = false;
    this.draggedPivot = null; // Currently dragged pivot
    this.adjustingAngle = null; // Pipe whose angle is being adjusted
  }
  
  /**
   * Add a new obstacle
   */
  addObstacle(x, y, radius = 40) {
    const obstacle = new Obstacle(x, y, radius);
    this.obstacles.push(obstacle);
    return obstacle;
  }
  
  /**
   * Start drawing a new pipe
   */
  startPipe(x, y, radius = 40) {
    this.currentPipe = new Pipe(radius);
    this.currentPipe.addPoint(x, y);
  }
  
  /**
   * Add a point to the current pipe
   */
  addPointToPipe(x, y) {
    if (this.currentPipe) {
      this.currentPipe.addPoint(x, y);
    }
  }
  
  /**
   * Finish drawing the current pipe
   */
  finishPipe() {
    if (this.currentPipe) {
      this.pipes.push(this.currentPipe);
      this.currentPipe = null;
    }
  }
  
  /**
   * Remove an obstacle or pipe at a specific position
   */
  removeObstacleAt(x, y) {
    // Check pipes first
    const pipeIndex = this.pipes.findIndex(pipe => pipe.containsPoint(x, y));
    if (pipeIndex !== -1) {
      this.pipes.splice(pipeIndex, 1);
      return true;
    }
    
    // Then check obstacles
    const index = this.obstacles.findIndex(obs => obs.containsPoint(x, y));
    if (index !== -1) {
      this.obstacles.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Clear all obstacles
   */
  clearAll() {
    this.obstacles = [];
    this.pipes = [];
    this.currentPipe = null;
  }
  
  /**
   * Update all pipes with wave animation
   */
  update(deltaTime = 16) {
    if (!this.enabled) return;
    
    // Update wave animation for all completed pipes
    this.pipes.forEach(pipe => {
      pipe.updateWave(deltaTime);
    });
  }
  
  /**
   * Draw all obstacles and pipes
   */
  drawAll(ctx) {
    if (!this.enabled) return;
    
    // Draw completed pipes
    this.pipes.forEach(pipe => {
      pipe.draw(ctx);
    });
    
    // Draw current pipe being drawn (no animation while drawing)
    if (this.currentPipe) {
      this.currentPipe.draw(ctx);
    }
    
    // Draw obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.draw(ctx);
    });
  }
  
  /**
   * Apply obstacle collisions to a bubble
   */
  applyCollisions(bubble, wallBounce = 0.7) {
    if (!this.enabled) return;
    
    // Collide with regular obstacles
    this.obstacles.forEach(obstacle => {
      const dx = bubble.x - obstacle.x;
      const dy = bubble.y - obstacle.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = bubble.radius + obstacle.radius;
      
      if (dist < minDist && dist > 0.1) {
        // Push bubble away from obstacle
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        
        bubble.x += nx * overlap;
        bubble.y += ny * overlap;
        
        // Reflect velocity (bounce)
        const dotProduct = bubble.vx * nx + bubble.vy * ny;
        
        if (dotProduct < 0) { // Only bounce if moving toward obstacle
          bubble.vx -= 2 * dotProduct * nx * wallBounce;
          bubble.vy -= 2 * dotProduct * ny * wallBounce;
        }
      }
    });
    
    // Collide with pipes (treat each point as a collision circle)
    this.pipes.forEach(pipe => {
      const circles = pipe.getCollisionCircles();
      circles.forEach(circle => {
        const dx = bubble.x - circle.x;
        const dy = bubble.y - circle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = bubble.radius + circle.radius;
        
        if (dist < minDist && dist > 0.1) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          
          bubble.x += nx * overlap;
          bubble.y += ny * overlap;
          
          const dotProduct = bubble.vx * nx + bubble.vy * ny;
          
          if (dotProduct < 0) {
            bubble.vx -= 2 * dotProduct * nx * wallBounce;
            bubble.vy -= 2 * dotProduct * ny * wallBounce;
          }
        }
      });
    });
    
    // Collide with current pipe being drawn
    if (this.currentPipe) {
      const circles = this.currentPipe.getCollisionCircles();
      circles.forEach(circle => {
        const dx = bubble.x - circle.x;
        const dy = bubble.y - circle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = bubble.radius + circle.radius;
        
        if (dist < minDist && dist > 0.1) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          
          bubble.x += nx * overlap;
          bubble.y += ny * overlap;
          
          const dotProduct = bubble.vx * nx + bubble.vy * ny;
          
          if (dotProduct < 0) {
            bubble.vx -= 2 * dotProduct * nx * wallBounce;
            bubble.vy -= 2 * dotProduct * ny * wallBounce;
          }
        }
      });
    }
  }
  
  /**
   * Check if clicking on a pivot point
   */
  findPivotAt(x, y) {
    for (let pipe of this.pipes) {
      if (pipe.isPivotAt(x, y)) {
        return pipe;
      }
    }
    return null;
  }
  
  /**
   * Start dragging a pivot
   */
  startDraggingPivot(x, y) {
    this.draggedPivot = this.findPivotAt(x, y);
    return this.draggedPivot !== null;
  }
  
  /**
   * Update dragged pivot position
   */
  updateDraggedPivot(x, y) {
    if (this.draggedPivot) {
      this.draggedPivot.movePivotTo(x, y);
    }
  }
  
  /**
   * Stop dragging pivot
   */
  stopDraggingPivot() {
    this.draggedPivot = null;
  }
  
  /**
   * Start adjusting rotation angle
   */
  startAdjustingAngle(x, y) {
    this.adjustingAngle = this.findPivotAt(x, y);
    return this.adjustingAngle !== null;
  }
  
  /**
   * Update rotation angle based on mouse position
   */
  updateRotationAngle(x, y) {
    if (this.adjustingAngle) {
      this.adjustingAngle.adjustRotationAngle(x, y);
    }
  }
  
  /**
   * Stop adjusting angle
   */
  stopAdjustingAngle() {
    this.adjustingAngle = null;
  }
  
  /**
   * Toggle obstacle mode
   */
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

