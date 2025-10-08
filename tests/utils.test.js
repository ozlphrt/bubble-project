/**
 * Unit tests for Utils module
 */

import { Utils } from '../src/modules/utils.js';

describe('Utils Module', () => {
  test('should calculate distance correctly', () => {
    const distance = Utils.distance(0, 0, 3, 4);
    expect(distance).toBe(5); // 3-4-5 triangle
  });
  
  test('should calculate distance between objects', () => {
    const obj1 = { x: 0, y: 0 };
    const obj2 = { x: 3, y: 4 };
    const distance = Utils.distanceBetween(obj1, obj2);
    expect(distance).toBe(5);
  });
  
  test('should normalize angles correctly', () => {
    expect(Utils.normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 5);
    expect(Utils.normalizeAngle(-Math.PI * 3)).toBeCloseTo(-Math.PI, 5);
    expect(Utils.normalizeAngle(0)).toBe(0);
  });
  
  test('should clamp values correctly', () => {
    expect(Utils.clamp(5, 0, 10)).toBe(5);
    expect(Utils.clamp(-5, 0, 10)).toBe(0);
    expect(Utils.clamp(15, 0, 10)).toBe(10);
  });
  
  test('should interpolate correctly', () => {
    expect(Utils.lerp(0, 10, 0.5)).toBe(5);
    expect(Utils.lerp(0, 10, 0)).toBe(0);
    expect(Utils.lerp(0, 10, 1)).toBe(10);
  });
  
  test('should generate random numbers in range', () => {
    const random = Utils.random(5, 10);
    expect(random).toBeGreaterThanOrEqual(5);
    expect(random).toBeLessThan(10);
  });
  
  test('should generate random integers in range', () => {
    const random = Utils.randomInt(5, 10);
    expect(Number.isInteger(random)).toBe(true);
    expect(random).toBeGreaterThanOrEqual(5);
    expect(random).toBeLessThanOrEqual(10);
  });
  
  test('should convert degrees to radians', () => {
    expect(Utils.degToRad(180)).toBeCloseTo(Math.PI, 5);
    expect(Utils.degToRad(90)).toBeCloseTo(Math.PI / 2, 5);
  });
  
  test('should convert radians to degrees', () => {
    expect(Utils.radToDeg(Math.PI)).toBeCloseTo(180, 5);
    expect(Utils.radToDeg(Math.PI / 2)).toBeCloseTo(90, 5);
  });
  
  test('should detect point in circle', () => {
    expect(Utils.pointInCircle(0, 0, 0, 0, 5)).toBe(true);
    expect(Utils.pointInCircle(3, 4, 0, 0, 5)).toBe(true);
    expect(Utils.pointInCircle(6, 0, 0, 0, 5)).toBe(false);
  });
});

