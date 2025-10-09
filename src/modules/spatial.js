/**
 * Spatial Partitioning Module
 * 
 * This module provides spatial partitioning using a quadtree to optimize
 * collision detection and contact finding from O(n²) to O(n log n).
 * 
 * @fileoverview Spatial partitioning for performance optimization
 * @version 1.0.0
 * @author Soap Bubble Simulation Team
 */

/**
 * Quadtree node for spatial partitioning
 */
class QuadNode {
  constructor(bounds, maxObjects = 10, maxLevels = 5, level = 0) {
    this.bounds = bounds; // {x, y, width, height}
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.level = level;
    
    this.objects = [];
    this.nodes = [];
    this.divided = false;
  }

  /**
   * Clear the quadtree
   */
  clear() {
    this.objects = [];
    this.divided = false;
    this.nodes = [];
  }

  /**
   * Split the node into 4 subnodes
   */
  split() {
    const subWidth = this.bounds.width / 2;
    const subHeight = this.bounds.height / 2;
    const x = this.bounds.x;
    const y = this.bounds.y;

    this.nodes[0] = new QuadNode({
      x: x + subWidth,
      y: y,
      width: subWidth,
      height: subHeight
    }, this.maxObjects, this.maxLevels, this.level + 1);

    this.nodes[1] = new QuadNode({
      x: x,
      y: y,
      width: subWidth,
      height: subHeight
    }, this.maxObjects, this.maxLevels, this.level + 1);

    this.nodes[2] = new QuadNode({
      x: x,
      y: y + subHeight,
      width: subWidth,
      height: subHeight
    }, this.maxObjects, this.maxLevels, this.level + 1);

    this.nodes[3] = new QuadNode({
      x: x + subWidth,
      y: y + subHeight,
      width: subWidth,
      height: subHeight
    }, this.maxObjects, this.maxLevels, this.level + 1);

    this.divided = true;
  }

  /**
   * Determine which node the object belongs to
   */
  getIndex(bounds) {
    let index = -1;
    const verticalMidpoint = this.bounds.x + (this.bounds.width / 2);
    const horizontalMidpoint = this.bounds.y + (this.bounds.height / 2);

    const topQuadrant = (bounds.y < horizontalMidpoint && bounds.y + bounds.height < horizontalMidpoint);
    const bottomQuadrant = (bounds.y > horizontalMidpoint);

    if (bounds.x < verticalMidpoint && bounds.x + bounds.width < verticalMidpoint) {
      if (topQuadrant) {
        index = 1;
      } else if (bottomQuadrant) {
        index = 2;
      }
    } else if (bounds.x > verticalMidpoint) {
      if (topQuadrant) {
        index = 0;
      } else if (bottomQuadrant) {
        index = 3;
      }
    }

    return index;
  }

  /**
   * Insert an object into the quadtree
   */
  insert(bubble) {
    const bounds = {
      x: bubble.x - bubble.radius,
      y: bubble.y - bubble.radius,
      width: bubble.radius * 2,
      height: bubble.radius * 2
    };

    if (!this.boundsIntersect(this.bounds, bounds)) {
      return false;
    }

    if (this.objects.length < this.maxObjects || this.level >= this.maxLevels) {
      this.objects.push(bubble);
      return true;
    }

    if (!this.divided) {
      this.split();
    }

    const index = this.getIndex(bounds);
    if (index !== -1) {
      this.nodes[index].insert(bubble);
    } else {
      this.objects.push(bubble);
    }

    return true;
  }

  /**
   * Retrieve objects that could collide with the given object
   */
  retrieve(bubble) {
    // Expand search bounds to catch more potential collisions
    const expansionFactor = 1.5; // Search 50% beyond the bubble's radius
    const bounds = {
      x: bubble.x - bubble.radius * expansionFactor,
      y: bubble.y - bubble.radius * expansionFactor,
      width: bubble.radius * 2 * expansionFactor,
      height: bubble.radius * 2 * expansionFactor
    };

    const returnObjects = [...this.objects];

    if (this.divided) {
      const index = this.getIndex(bounds);
      if (index !== -1) {
        returnObjects.push(...this.nodes[index].retrieve(bubble));
      } else {
        // Object spans multiple nodes, check all
        for (let i = 0; i < this.nodes.length; i++) {
          returnObjects.push(...this.nodes[i].retrieve(bubble));
        }
      }
    }

    return returnObjects;
  }

  /**
   * Check if two bounds intersect
   */
  boundsIntersect(bounds1, bounds2) {
    return !(bounds1.x > bounds2.x + bounds2.width ||
             bounds1.x + bounds1.width < bounds2.x ||
             bounds1.y > bounds2.y + bounds2.height ||
             bounds1.y + bounds1.height < bounds2.y);
  }
}

/**
 * Spatial partitioning manager
 */
export class SpatialManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.quadtree = new QuadNode({
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight
    }, 4, 8); // maxObjects=4, maxLevels=8 (more sensitive)
  }

  /**
   * Update canvas dimensions
   */
  updateDimensions(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.quadtree = new QuadNode({
      x: 0,
      y: 0,
      width: width,
      height: height
    }, 4, 8);
  }

  /**
   * Rebuild the quadtree with current bubbles
   */
  rebuild(bubbles) {
    this.quadtree.clear();
    bubbles.forEach(bubble => {
      this.quadtree.insert(bubble);
    });
  }

  /**
   * Get potential collision candidates for a bubble
   */
  getCollisionCandidates(bubble) {
    return this.quadtree.retrieve(bubble);
  }

  /**
   * Get all potential collision pairs
   */
  getAllCollisionPairs(bubbles) {
    const pairs = [];
    const processed = new Set();

    for (let i = 0; i < bubbles.length; i++) {
      const bubble = bubbles[i];
      const candidates = this.getCollisionCandidates(bubble);
      
      for (const candidate of candidates) {
        // Avoid duplicate pairs
        const pairId = bubble.id < candidate.id ? 
          `${bubble.id}-${candidate.id}` : 
          `${candidate.id}-${bubble.id}`;
        
        if (!processed.has(pairId)) {
          processed.add(pairId);
          pairs.push([bubble, candidate]);
        }
      }
    }

    return pairs;
  }
}
