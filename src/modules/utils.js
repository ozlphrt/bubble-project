/**
 * Utils Module
 * 
 * This module contains utility functions and helper methods used throughout
 * the soap bubble simulation. It provides common mathematical operations,
 * color utilities, and other shared functionality.
 * 
 * @fileoverview Utility functions for soap bubble simulation
 * @version 1.0.0
 * @author Soap Bubble Simulation Team
 */

/**
 * Utility functions for the soap bubble simulation
 */
export class Utils {
  /**
   * Calculate distance between two points
   * @param {number} x1 - First point X
   * @param {number} y1 - First point Y
   * @param {number} x2 - Second point X
   * @param {number} y2 - Second point Y
   * @returns {number} Distance
   */
  static distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate distance between two objects with x, y properties
   * @param {Object} obj1 - First object with x, y properties
   * @param {Object} obj2 - Second object with x, y properties
   * @returns {number} Distance
   */
  static distanceBetween(obj1, obj2) {
    return this.distance(obj1.x, obj1.y, obj2.x, obj2.y);
  }
  
  /**
   * Normalize an angle to be between -π and π
   * @param {number} angle - Angle in radians
   * @returns {number} Normalized angle
   */
  static normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
  }
  
  /**
   * Clamp a value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Linear interpolation between two values
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation factor (0-1)
   * @returns {number} Interpolated value
   */
  static lerp(a, b, t) {
    return a + (b - a) * t;
  }
  
  /**
   * Generate a random number between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  /**
   * Generate a random integer between min and max (inclusive)
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random integer
   */
  static randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Blend two colors
   * @param {string} color1 - First color (HSL string)
   * @param {string} color2 - Second color (HSL string)
   * @param {number} ratio - Blend ratio (0-1, 0 = color1, 1 = color2)
   * @returns {string} Blended color
   */
  static blendColors(color1, color2, ratio = 0.5) {
    // TODO: Implement color blending
    // This will parse HSL strings and blend them
    return color1; // Placeholder
  }
  
  /**
   * Vary a color slightly
   * @param {string} color - Base color (HSL string)
   * @param {number} variation - Amount of variation (0-1)
   * @returns {string} Varied color
   */
  static varyColor(color, variation = 0.1) {
    // TODO: Implement color variation
    // This will add small random changes to HSL values
    return color; // Placeholder
  }
  
  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   */
  static degToRad(degrees) {
    return degrees * Math.PI / 180;
  }
  
  /**
   * Convert radians to degrees
   * @param {number} radians - Angle in radians
   * @returns {number} Angle in degrees
   */
  static radToDeg(radians) {
    return radians * 180 / Math.PI;
  }
  
  /**
   * Check if a point is inside a circle
   * @param {number} px - Point X
   * @param {number} py - Point Y
   * @param {number} cx - Circle center X
   * @param {number} cy - Circle center Y
   * @param {number} radius - Circle radius
   * @returns {boolean} True if point is inside circle
   */
  static pointInCircle(px, py, cx, cy, radius) {
    const dx = px - cx;
    const dy = py - cy;
    return dx * dx + dy * dy <= radius * radius;
  }
  
  /**
   * Get mouse position relative to an element
   * @param {MouseEvent} event - Mouse event
   * @param {HTMLElement} element - Element to get position relative to
   * @returns {Object} Position {x, y}
   */
  static getMousePosition(event, element) {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
}

