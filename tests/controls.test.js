/**
 * Unit tests for Controls module
 */

import { Controls } from '../src/modules/controls.js';

describe('Controls Module', () => {
  let controls;
  let mockContainer;
  
  beforeEach(() => {
    mockContainer = {
      style: { display: 'block' },
      dispatchEvent: jest.fn()
    };
    
    controls = new Controls(mockContainer);
  });
  
  test('should create controls with container', () => {
    expect(controls.container).toBe(mockContainer);
    expect(controls.parameters).toBeInstanceOf(Map);
    expect(controls.activeParameter).toBe(null);
    expect(controls.isDragging).toBe(false);
  });
  
  test('should add parameter', () => {
    const config = {
      min: 0,
      max: 1,
      default: 0.5,
      step: 0.1,
      unit: 'ratio',
      description: 'Test parameter'
    };
    
    controls.addParameter('testParam', config);
    
    const param = controls.parameters.get('testParam');
    expect(param).toEqual({
      ...config,
      value: 0.5
    });
  });
  
  test('should get parameter value', () => {
    controls.addParameter('testParam', {
      min: 0,
      max: 1,
      default: 0.5
    });
    
    expect(controls.getValue('testParam')).toBe(0.5);
    expect(controls.getValue('nonexistent')).toBe(0);
  });
  
  test('should set parameter value', () => {
    controls.addParameter('testParam', {
      min: 0,
      max: 1,
      default: 0.5
    });
    
    controls.setValue('testParam', 0.8);
    
    expect(controls.getValue('testParam')).toBe(0.8);
    expect(mockContainer.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'parameterChange',
        detail: { name: 'testParam', value: 0.8 }
      })
    );
  });
  
  test('should clamp parameter values', () => {
    controls.addParameter('testParam', {
      min: 0,
      max: 1,
      default: 0.5
    });
    
    controls.setValue('testParam', -0.5); // Below min
    expect(controls.getValue('testParam')).toBe(0);
    
    controls.setValue('testParam', 1.5); // Above max
    expect(controls.getValue('testParam')).toBe(1);
  });
  
  test('should handle parameter hover', () => {
    controls.onParameterHover('testParam');
    expect(controls.activeParameter).toBe('testParam');
  });
  
  test('should handle parameter leave', () => {
    controls.activeParameter = 'testParam';
    controls.onParameterLeave();
    expect(controls.activeParameter).toBe(null);
  });
  
  test('should handle drag start', () => {
    controls.addParameter('testParam', {
      min: 0,
      max: 1,
      default: 0.5
    });
    
    const mousePos = { x: 100, y: 200 };
    controls.onDragStart('testParam', mousePos);
    
    expect(controls.isDragging).toBe(true);
    expect(controls.activeParameter).toBe('testParam');
    expect(controls.dragStart).toEqual(mousePos);
    expect(controls.dragValue).toBe(0.5);
  });
  
  test('should handle drag update', () => {
    controls.addParameter('testParam', {
      min: 0,
      max: 1,
      default: 0.5
    });
    
    controls.onDragStart('testParam', { x: 100, y: 200 });
    controls.onDragUpdate({ x: 200, y: 200 }); // 100px right movement
    
    // Should increase value based on horizontal movement
    expect(controls.getValue('testParam')).toBeGreaterThan(0.5);
  });
  
  test('should handle drag end', () => {
    controls.isDragging = true;
    controls.activeParameter = 'testParam';
    
    controls.onDragEnd();
    
    expect(controls.isDragging).toBe(false);
    expect(controls.activeParameter).toBe(null);
  });
  
  test('should show and hide controls', () => {
    controls.show();
    expect(mockContainer.style.display).toBe('block');
    
    controls.hide();
    expect(mockContainer.style.display).toBe('none');
  });
});

