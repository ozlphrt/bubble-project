/**
 * Controls Module
 * 
 * This module handles interactive controls for adjusting physics parameters
 * in real-time through sliders and UI elements.
 * 
 * @fileoverview Interactive controls for soap bubble simulation
 * @version 1.0.0
 * @author Soap Bubble Simulation Team
 */

/**
 * Controls class for managing interactive parameter adjustments
 */
export class Controls {
  constructor() {
    this.controls = {
      // Collision & Separation
      targetDist: {
        label: 'Separation',
        value: 0.83,
        min: 0.01, // Allow extreme packing
        max: 1.1,
        step: 0.01 // Larger step for easier adjustment
      },
      separation: {
        label: 'Separation Force',
        value: 0.30,
        min: 0.01, // Minimum 0.01 for very soft separation
        max: 1.0,
        step: 0.01
      },
      collisionStrength: {
        label: 'Collision Strength',
        value: 0.03,
        min: 0.001,
        max: 0.1,
        step: 0.001
      },
      
      // Bubble Properties
      influenceThreshold: {
        label: 'Morphing Threshold',
        value: 0.1,
        min: 0.01,
        max: 0.5,
        step: 0.01
      },
      deformationStrength: {
        label: 'Morphing Strength',
        value: 1.54,
        min: 0.1,
        max: 5.0,
        step: 0.1
      },
      wallBounce: {
        label: 'Wall Bounce',
        value: 0.45,
        min: 0.1,
        max: 0.9,
        step: 0.01
      },
      damping: {
        label: 'Damping',
        value: 0.99,
        min: 0.98,
        max: 0.999,
        step: 0.001
      },
      
      // Force Parameters
      compressionForce: {
        label: 'Compression Force',
        value: 0.06, // Updated default compression force
        min: 0.001,
        max: 0.1,
        step: 0.001
      },
      interpolationFactor: {
        label: 'Force Smoothing',
        value: 0.03,
        min: 0.01,
        max: 0.2,
        step: 0.01
      },
      
      // Theme Control
      theme: {
        label: 'Theme',
        value: 0.04, // 4% = 0.04 (very dark with slight light)
        min: 0,
        max: 1,
        step: 0.01
      },
      
      
      
      // Gravity Control
      gravity: {
        label: 'Gravity',
        value: 0.04, // Updated default gravity
        min: 0,
        max: 0.5,
        step: 0.01
      },
      
      // Surface Tension Control
      surfaceTension: {
        label: 'Surface Tension',
        value: 0.03, // Updated surface tension default
        min: 0,
        max: 3.0, // Increased max to 3
        step: 0.01
      },
      
      // Coalescence Rate Control
      coalescenceRate: {
        label: 'Coalescence Rate',
        value: 0.00001, // Very low default - realistic slow merging
        min: 0.0,
        max: 0.001, // Max 0.1% chance per frame per pair
        step: 0.00001
      },
      
      // Plateau Force Strength
      plateauForceStrength: {
        label: 'Plateau Force',
        value: 0.2,
        min: 0,
        max: 0.3, // Increased max
        step: 0.01
      },
      
      // Bubble Size Controls
      averageSize: {
        label: 'Average Size',
        value: 1.0, // Base size multiplier
        min: 0.3,
        max: 2.0,
        step: 0.1
      },
      
      sizeVariation: {
        label: 'Size Variation',
        value: 0.8, // How much size varies (0 = all same size, 1 = full variation)
        min: 0.0,
        max: 1.0,
        step: 0.1
      }
    };
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse events for slider interaction
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
    // Touch events for slider interaction
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    // Toggle checkbox events
    document.addEventListener('change', (e) => {
      if (e.target && e.target.id && e.target.id.startsWith('toggle-')) {
        const key = e.target.id.replace('toggle-', '');
        if (this.controls[key]) {
          this.setValue(key, e.target.checked ? 1 : 0);
        }
      }
    });
    
    this.isDragging = false;
    this.draggedControl = null;
  }

  handleMouseDown(e) {
    // Prevent text selection when clicking on sliders
    if (e.target && (e.target.id?.startsWith('slider-') || e.target.parentElement?.style?.position === 'relative')) {
      e.preventDefault();
    }
    
    // Check if click is on a slider track or handle
    const control = this.getControlAtPosition(e.clientX, e.clientY);
    if (control) {
      e.preventDefault(); // Prevent text selection
      this.isDragging = true;
      this.draggedControl = control;
      this.updateControlValue(control, e.clientX, e.clientY);
    }
  }

  handleMouseMove(e) {
    if (this.isDragging && this.draggedControl) {
      this.updateControlValue(this.draggedControl, e.clientX, e.clientY);
      
    }
  }

  handleMouseUp(e) {
    this.isDragging = false;
    this.draggedControl = null;
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const control = this.getControlAtPosition(touch.clientX, touch.clientY);
      if (control) {
        this.isDragging = true;
        this.draggedControl = control;
        this.updateControlValue(control, touch.clientX, touch.clientY);
      }
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 1 && this.isDragging && this.draggedControl) {
      const touch = e.touches[0];
      this.updateControlValue(this.draggedControl, touch.clientX, touch.clientY);
    }
  }

  handleTouchEnd(e) {
    this.isDragging = false;
    this.draggedControl = null;
  }

  getControlAtPosition(mouseX, mouseY) {
    // Check if mouse is over the control panel
    const controlPanel = document.getElementById('controlPanel');
    if (!controlPanel) return null;
    
    const panelRect = controlPanel.getBoundingClientRect();
    if (mouseX < panelRect.left || mouseX > panelRect.right || 
        mouseY < panelRect.top || mouseY > panelRect.bottom) {
      return null;
    }
    
    // Find which slider the mouse is over by checking the slider TRACK (parent of handle)
    for (const [key, control] of Object.entries(this.controls)) {
      // Skip toggle controls
      if (control.isToggle) continue;
      
      const sliderHandle = document.getElementById(`slider-${key}`);
      if (sliderHandle && sliderHandle.parentElement) {
        // Get the slider track (parent element)
        const sliderTrack = sliderHandle.parentElement;
        const trackRect = sliderTrack.getBoundingClientRect();
        
        // Check if mouse is anywhere on the slider track (full width)
        if (mouseX >= trackRect.left && mouseX <= trackRect.right &&
            mouseY >= trackRect.top && mouseY <= trackRect.bottom) {
          return { key, control };
        }
      }
    }
    
    return null;
  }

  updateControlValue(controlInfo, mouseX, mouseY) {
    const { key, control } = controlInfo;
    
    // Find the slider track element for this control
    const sliderHandle = document.getElementById(`slider-${key}`);
    if (!sliderHandle) return;
    
    // Get the slider track (parent element)
    const sliderTrack = sliderHandle.parentElement;
    if (!sliderTrack) return;
    
    const trackRect = sliderTrack.getBoundingClientRect();
    
    // Calculate position within the slider track
    const relativeX = mouseX - trackRect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / trackRect.width));
    const newValue = control.min + percentage * (control.max - control.min);
    
    // Update the control value
    this.setValue(key, newValue);
  }

  getValue(key) {
    return this.controls[key]?.value || 0;
  }

  setValue(key, value) {
    if (this.controls[key]) {
      const oldValue = this.controls[key].value;
      this.controls[key].value = Math.max(
        this.controls[key].min,
        Math.min(this.controls[key].max, value)
      );
      
      // Trigger callback if defined
      if (this.controls[key].onChange) {
        this.controls[key].onChange(this.controls[key].value);
      }
    }
  }

  getAllValues() {
    const values = {};
    for (const [key, control] of Object.entries(this.controls)) {
      values[key] = control.value;
    }
    return values;
  }

  resetToDefaults() {
    // Reset all controls to their default values
    this.controls.targetDist.value = 0.83;
    this.controls.separation.value = 0.30;
    this.controls.collisionStrength.value = 0.03;
    this.controls.influenceThreshold.value = 0.10;
    this.controls.deformationStrength.value = 1.54;
    this.controls.wallBounce.value = 0.45;
    this.controls.damping.value = 0.99;
    this.controls.compressionForce.value = 0.06;
    this.controls.interpolationFactor.value = 0.03;
    this.controls.theme.value = 0.04;
    this.controls.gravity.value = 0.04;
    this.controls.surfaceTension.value = 0.03;
    this.controls.coalescenceRate.value = 0.00001;
    this.controls.plateauForceStrength.value = 0.2;
    this.controls.averageSize.value = 1.0;
    this.controls.sizeVariation.value = 0.8;
  }
}