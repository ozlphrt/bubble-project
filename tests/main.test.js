/**
 * Unit tests for Main application module
 */

import { SoapBubbleSimulation } from '../src/main.js';

// Mock all modules
jest.mock('../src/modules/bubble.js', () => ({
  Bubble: jest.fn().mockImplementation((x, y, radius) => ({
    x, y, radius,
    vx: 0, vy: 0,
    age: 0,
    id: Math.random(),
    update: jest.fn(),
    draw: jest.fn()
  }))
}));

jest.mock('../src/modules/physics.js', () => ({
  Physics: jest.fn().mockImplementation(() => ({
    updatePositions: jest.fn(),
    detectCollisions: jest.fn()
  })),
  PHYSICS_CONSTANTS: {
    DEFAULT_RADIUS: 45
  }
}));

jest.mock('../src/modules/renderer.js', () => ({
  Renderer: jest.fn().mockImplementation(() => ({
    clear: jest.fn(),
    renderBubbles: jest.fn(),
    renderUI: jest.fn()
  }))
}));

jest.mock('../src/modules/interactions.js', () => ({
  Interactions: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('../src/modules/controls.js', () => ({
  Controls: jest.fn().mockImplementation(() => ({}))
}));

jest.mock('../src/modules/utils.js', () => ({
  Utils: {
    random: jest.fn((min, max) => (min + max) / 2)
  }
}));

describe('SoapBubbleSimulation', () => {
  let simulation;
  let mockCanvas;
  let mockDocument;
  
  beforeEach(() => {
    // Mock DOM elements
    mockCanvas = {
      width: 800,
      height: 600,
      getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        closePath: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        arc: jest.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        save: jest.fn(),
        restore: jest.fn(),
        fillText: jest.fn()
      })),
      addEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    };
    
    mockDocument = {
      getElementById: jest.fn((id) => {
        if (id === 'canvas') return mockCanvas;
        if (id === 'controls') return { addEventListener: jest.fn() };
        return { addEventListener: jest.fn() };
      }),
      addEventListener: jest.fn()
    };
    
    // Mock global objects
    global.document = mockDocument;
    global.performance = {
      now: jest.fn(() => Date.now())
    };
    global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
    
    simulation = new SoapBubbleSimulation();
  });
  
  test('should create simulation instance', () => {
    expect(simulation.canvas).toBe(null);
    expect(simulation.bubbles).toEqual([]);
    expect(simulation.isRunning).toBe(false);
    expect(simulation.physics).toBe(null);
    expect(simulation.renderer).toBe(null);
  });
  
  test('should initialize successfully', async () => {
    await simulation.init();
    
    expect(simulation.canvas).toBe(mockCanvas);
    expect(simulation.physics).toBeDefined();
    expect(simulation.renderer).toBeDefined();
    expect(simulation.interactions).toBeDefined();
    expect(simulation.controls).toBeDefined();
  });
  
  test('should initialize with bubbles', async () => {
    await simulation.init();
    
    expect(simulation.bubbles.length).toBe(8);
  });
  
  test('should add bubble', () => {
    simulation.addBubble(100, 200, 50);
    
    expect(simulation.bubbles.length).toBe(1);
    expect(simulation.bubbles[0].x).toBe(100);
    expect(simulation.bubbles[0].y).toBe(200);
    expect(simulation.bubbles[0].radius).toBe(50);
  });
  
  test('should add random bubble', () => {
    simulation.addRandomBubble();
    
    expect(simulation.bubbles.length).toBe(1);
  });
  
  test('should start and stop simulation', () => {
    simulation.start();
    expect(simulation.isRunning).toBe(true);
    
    simulation.stop();
    expect(simulation.isRunning).toBe(false);
  });
  
  test('should toggle pause', () => {
    simulation.togglePause();
    expect(simulation.isRunning).toBe(true);
    
    simulation.togglePause();
    expect(simulation.isRunning).toBe(false);
  });
  
  test('should reset simulation', () => {
    simulation.addBubble(100, 100, 50);
    expect(simulation.bubbles.length).toBe(1);
    
    simulation.reset();
    expect(simulation.bubbles.length).toBe(8);
  });
  
  test('should compress bubbles', () => {
    const bubble = { x: 0, y: 0, vx: 0, vy: 0 };
    simulation.bubbles = [bubble];
    simulation.canvas = { width: 800, height: 600 };
    
    simulation.compress();
    
    expect(bubble.vx).toBeGreaterThan(0);
    expect(bubble.vy).toBeGreaterThan(0);
  });
  
  test('should handle parameter changes', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    simulation.onParameterChange('testParam', 0.5);
    
    expect(consoleSpy).toHaveBeenCalledWith('Parameter testParam changed to 0.5');
    
    consoleSpy.mockRestore();
  });
});

