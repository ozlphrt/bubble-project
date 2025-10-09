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
  constructor(simulation = null) {
    this.simulation = simulation;
    this.controls = {
      // Collision & Separation
      targetDist: {
        label: 'Separation',
        tooltip: 'How close bubbles can get to each other. Lower values = tighter packing.',
        value: 0.810763,
        min: 0.5,
        max: 1.1,
        step: 0.01,
        default: 0.810763
      },
      separation: {
        label: 'Separation Force',
        tooltip: 'How strongly bubbles push each other apart. Higher = more repulsion.',
        value: 0.181006,
        min: 0.05,
        max: 0.8,
        step: 0.01,
        default: 0.181006
      },
      collisionStrength: {
        label: 'Collision Strength',
        tooltip: 'How bouncy bubbles are when they collide. Higher = more bounce.',
        value: 0.053264,
        min: 0.01,
        max: 0.08,
        step: 0.001,
        default: 0.053264
      },
      
      // Bubble Properties
      influenceThreshold: {
        label: 'Morphing Threshold',
        tooltip: 'How close bubbles need to be to start deforming each other.',
        value: 0.353458,
        min: 0.0,
        max: 1.0,
        step: 0.01,
        default: 0.353458
      },
      deformationStrength: {
        label: 'Morphing Strength',
        tooltip: 'How much bubbles can deform when squished together.',
        value: 1.031620,
        min: 0.0,
        max: 10.0,
        step: 0.1,
        default: 1.031620
      },
      wallBounce: {
        label: 'Wall Bounce',
        tooltip: 'How much energy bubbles keep when bouncing off walls.',
        value: 0.45,
        min: 0.1,
        max: 0.9,
        step: 0.01,
        default: 0.45
      },
      damping: {
        label: 'Friction',
        tooltip: 'How much friction bubbles experience. Higher = more friction, bubbles slow down faster.',
        value: 0.005,
        min: 0.001,
        max: 0.02,
        step: 0.001,
        default: 0.005
      },
      
      // Force Parameters
      compressionForce: {
        label: 'Compression Force',
        tooltip: 'How much force is applied when you press the Shuffle button.',
        value: 0.06,
        min: 0.02,
        max: 0.12,
        step: 0.001,
        default: 0.06
      },
      interpolationFactor: {
        label: 'Force Smoothing',
        tooltip: 'How smoothly forces are applied. Higher = smoother but slower response.',
        value: 0.03,
        min: 0.01,
        max: 0.2,
        step: 0.01,
        default: 0.03
      },
      
      
      
      
      // Gravity Control
      gravity: {
        label: 'Gravity',
        tooltip: 'How strongly bubbles are pulled downward.',
        value: 0.051581,
        min: 0,
        max: 0.5,
        step: 0.01,
        default: 0.051581
      },
      
      // Surface Tension Control
      surfaceTension: {
        label: 'Surface Tension',
        tooltip: 'How much bubbles try to maintain their round shape.',
        value: 0.45,
        min: 0,
        max: 1.5,
        step: 0.01,
        default: 0.45
      },
      
      // Coalescence Rate Control
      coalescenceRate: {
        label: 'Coalescence Rate',
        tooltip: 'How often bubbles merge together. Higher = more merging.',
        value: 0.000166,
        min: 0.0,
        max: 0.0002,
        step: 0.00001,
        default: 0.000166
      },
      
      // Plateau Force Strength
      plateauForceStrength: {
        label: 'Plateau Force',
        tooltip: 'Force that pushes bubble junctions toward 120° angles (honeycomb effect).',
        value: 0.236906,
        min: 0,
        max: 0.3, // Increased max
        step: 0.01,
        default: 0.236906
      },
      
      // Bubble Size Controls
      averageSize: {
        label: 'Average Size',
        tooltip: 'Base size of bubbles. 1.0 = normal size.',
        value: 1.0, // Base size multiplier
        min: 0.3,
        max: 5.0,
        step: 0.1,
        default: 1.0
      },
      
      sizeVariation: {
        label: 'Size Variation',
        tooltip: 'How much bubble sizes vary. 0 = all same size, 1 = full variation.',
        value: 0.8, // How much size varies (0 = all same size, 1 = full variation)
        min: 0.0,
        max: 1.0,
        step: 0.01, // Smaller step to allow reaching exactly 0.0
        default: 0.8
      },
      
      // Bubble Count Control
      bubbleCount: {
        label: 'Bubble Count',
        tooltip: 'Total number of bubbles in the simulation.',
        value: 300, // Default number of bubbles
        min: 10,
        max: 1000,
        step: 10,
        default: 300
      },
      
      // Visual Effects Toggle
      visualEffects: {
        label: 'Visual Style',
        tooltip: 'Flat = solid, Natural = depth, Glossy = shine, Ethereal = transparent',
        value: 2, // Glossy by default
        min: 0,
        max: 3,
        step: 1,
        default: 2,
        isToggle: false,
        options: ['Flat', 'Natural', 'Glossy', 'Ethereal']
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
      
      // Dropdown select events
      if (e.target && e.target.id && e.target.id.startsWith('dropdown-')) {
        const key = e.target.id.replace('dropdown-', '');
        if (this.controls[key]) {
          this.setValue(key, parseInt(e.target.value));
        }
      }
    });
    
    // Double-click to restore default values
    document.addEventListener('dblclick', (e) => {
      if (e.target && e.target.id && e.target.id.startsWith('slider-track-')) {
        const key = e.target.id.replace('slider-track-', '');
        const control = this.controls[key];
        if (control && control.default !== undefined) {
          this.setValue(key, control.default);
        }
      }
    });
    
    // Print values button and option buttons
    document.addEventListener('click', (e) => {
      if (e.target.id === 'printValuesBtn' || e.target.closest('#printValuesBtn')) {
        this.showValuesModal();
      }
      if (e.target.id === 'closeModalBtn') {
        this.hideValuesModal();
      }
      
      // Option button events (for visual style buttons)
      if (e.target && e.target.id && e.target.id.startsWith('option-')) {
        const controlKey = e.target.getAttribute('data-control');
        const value = e.target.getAttribute('data-value');
        if (controlKey && value !== null && this.controls[controlKey]) {
          this.setValue(controlKey, parseInt(value));
        }
      }
    });
    
    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
      if (e.target.id === 'valuesModal') {
        this.hideValuesModal();
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
      
      // Show value display for this control
      const valueDisplay = document.getElementById(`value-${control.key}`);
      if (valueDisplay) {
        valueDisplay.style.opacity = '1';
      }
      
      // Change cursor to horizontal resize arrows
      document.body.style.cursor = 'ew-resize';
    }
  }

  handleMouseMove(e) {
    if (this.isDragging && this.draggedControl) {
      this.updateControlValue(this.draggedControl, e.clientX, e.clientY);
      
    }
  }

  handleMouseUp(e) {
    // Hide value display for the dragged control
    if (this.draggedControl) {
      const valueDisplay = document.getElementById(`value-${this.draggedControl.key}`);
      if (valueDisplay) {
        valueDisplay.style.opacity = '0';
      }
    }
    
    // Restore cursor to default
    document.body.style.cursor = '';
    
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
        
        // Show value display for this control
        const valueDisplay = document.getElementById(`value-${control.key}`);
        if (valueDisplay) {
          valueDisplay.style.opacity = '1';
        }
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
    // Hide value display for the dragged control
    if (this.draggedControl) {
      const valueDisplay = document.getElementById(`value-${this.draggedControl.key}`);
      if (valueDisplay) {
        valueDisplay.style.opacity = '0';
      }
    }
    
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
    
    // Find which slider the mouse is over by checking the slider TRACK
    for (const [key, control] of Object.entries(this.controls)) {
      // Skip toggle controls
      if (control.isToggle) continue;
      
      const sliderTrack = document.getElementById(`slider-track-${key}`);
      if (sliderTrack) {
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
    const sliderTrack = document.getElementById(`slider-track-${key}`);
    if (!sliderTrack) return;
    
    const trackRect = sliderTrack.getBoundingClientRect();
    
    // Calculate position within the slider track
    const relativeX = mouseX - trackRect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / trackRect.width));
    
    // Calculate new value based on percentage
    let newValue = control.min + percentage * (control.max - control.min);
    
    // Snap to min if very close (within 2% of the range)
    const range = control.max - control.min;
    if (Math.abs(newValue - control.min) < range * 0.02) {
      newValue = control.min;
    }
    
    // Snap to max if very close (within 2% of the range)
    if (Math.abs(newValue - control.max) < range * 0.02) {
      newValue = control.max;
    }
    
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
      
      // Update option button highlighting if this control has options
      if (this.controls[key].options) {
        this.controls[key].options.forEach((option, index) => {
          const btn = document.getElementById(`option-${key}-${index}`);
          if (btn) {
            const isSelected = this.controls[key].value === index;
            if (isSelected) {
              btn.style.background = 'rgba(100,200,255,0.4)';
              btn.style.border = '2px solid rgba(100,200,255,1)';
              btn.style.boxShadow = '0 0 10px rgba(100,200,255,0.5)';
              btn.style.transform = 'scale(1.05)';
              btn.style.fontWeight = '600';
            } else {
              btn.style.background = 'rgba(255,255,255,0.1)';
              btn.style.border = '1px solid rgba(255,255,255,0.25)';
              btn.style.boxShadow = 'none';
              btn.style.transform = 'scale(1)';
              btn.style.fontWeight = '400';
            }
          }
        });
      }
      
      // Debug logging for sizeVariation
      if (key === 'sizeVariation') {
        console.log(`setValue called for sizeVariation: ${oldValue} -> ${this.controls[key].value}`);
      }
      
      // Trigger callback if defined AND value actually changed
      if (this.controls[key].onChange && oldValue !== this.controls[key].value) {
        console.log(`Triggering onChange for ${key}: ${oldValue} -> ${this.controls[key].value}`);
        this.controls[key].onChange(this.controls[key].value);
      }
    }
  }

  getAllValues() {
    const values = {};
    for (const [key, control] of Object.entries(this.controls)) {
      values[key] = control.value;
    }
    
    // Add additional parameters not in controls
    if (this.simulation) {
      // Visual style name
      const visualStyleNames = ['Flat', 'Natural', 'Glossy', 'Ethereal'];
      values.visualStyleName = visualStyleNames[values.visualEffects] || 'Unknown';
      
      // Spawn color settings
      if (this.simulation.physics) {
        values.spawnColorMode = this.simulation.physics.spawnColorMode || 'current';
        values.customSpawnColor = this.simulation.physics.customSpawnColor || 'rgb(255, 0, 0)';
        values.spawnPaletteMode = this.simulation.physics.spawnPaletteMode || 'none';
      }
    }
    
    return values;
  }

  resetToDefaults() {
    // Reset all controls to their default values
    for (const [key, control] of Object.entries(this.controls)) {
      if (control.default !== undefined) {
        control.value = control.default;
      }
    }
  }

  async showValuesModal() {
    const modal = document.getElementById('valuesModal');
    const content = document.getElementById('valuesContent');
    
    if (!modal || !content) return;
    
    // Generate formatted values
    let html = '<div style="color: rgba(100,200,255,0.9); font-weight: 600; margin-bottom: 10px;">Current Control Values:</div>';
    
    // Get all values including additional parameters
    const values = this.getAllValues();
    
    // Group values by category
    const groups = {
      'Bubble Behavior': ['targetDist', 'separation', 'collisionStrength', 'wallBounce'],
      'Shape & Tension': ['deformationStrength', 'influenceThreshold', 'surfaceTension', 'plateauForceStrength'],
      'Environment': ['gravity', 'damping', 'coalescenceRate'],
      'Appearance': ['bubbleCount', 'averageSize', 'sizeVariation', 'visualEffects']
    };
    
    for (const [groupName, controlKeys] of Object.entries(groups)) {
      html += `<div style="margin-bottom: 15px;">`;
      html += `<div style="color: rgba(255,255,255,0.8); font-weight: 600; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px;">${groupName}:</div>`;
      
      for (const key of controlKeys) {
        const control = this.controls[key];
        if (control) {
          const value = control.value;
          let formattedValue;
          
          // Special formatting for visual effects
          if (key === 'visualEffects') {
            const visualStyleNames = ['Flat', 'Natural', 'Glossy', 'Ethereal'];
            formattedValue = `${visualStyleNames[value] || 'Unknown'} (${value})`;
          } else {
            formattedValue = typeof value === 'number' ? value.toFixed(6) : value;
          }
          
          html += `<div style="margin-left: 10px; margin-bottom: 2px;">`;
          html += `<span style="color: rgba(255,255,255,0.9);">${control.label}:</span> `;
          html += `<span style="color: rgba(100,200,255,1); font-weight: 600;">${formattedValue}</span>`;
          html += `</div>`;
        }
      }
      html += `</div>`;
    }
    
    // Add additional parameters section
    html += `<div style="margin-bottom: 15px;">`;
    html += `<div style="color: rgba(255,255,255,0.8); font-weight: 600; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px;">Additional Settings:</div>`;
    
    // Get current palette from bubble module
    try {
      const bubbleModule = await import('./bubble.js');
      const currentPalette = bubbleModule.Bubble.currentPalette || 'rainbow';
      html += `<div style="margin-left: 10px; margin-bottom: 2px;">`;
      html += `<span style="color: rgba(255,255,255,0.9);">Current Palette:</span> `;
      html += `<span style="color: rgba(100,200,255,1); font-weight: 600;">${currentPalette}</span>`;
      html += `</div>`;
    } catch (error) {
      console.warn('Could not load bubble module for palette info:', error);
    }
    
    // Spawn color settings
    if (values.spawnColorMode) {
      html += `<div style="margin-left: 10px; margin-bottom: 2px;">`;
      html += `<span style="color: rgba(255,255,255,0.9);">Spawn Color Mode:</span> `;
      html += `<span style="color: rgba(100,200,255,1); font-weight: 600;">${values.spawnColorMode}</span>`;
      html += `</div>`;
      
      if (values.spawnColorMode === 'custom' && values.customSpawnColor) {
        html += `<div style="margin-left: 10px; margin-bottom: 2px;">`;
        html += `<span style="color: rgba(255,255,255,0.9);">Custom Spawn Color:</span> `;
        html += `<span style="color: rgba(100,200,255,1); font-weight: 600;">${values.customSpawnColor}</span>`;
        html += `</div>`;
      } else if (values.spawnColorMode === 'palette' && values.spawnPaletteMode) {
        html += `<div style="margin-left: 10px; margin-bottom: 2px;">`;
        html += `<span style="color: rgba(255,255,255,0.9);">Spawn Palette:</span> `;
        html += `<span style="color: rgba(100,200,255,1); font-weight: 600;">${values.spawnPaletteMode}</span>`;
        html += `</div>`;
      }
    }
    
    html += `</div>`;
    
    content.innerHTML = html;
    modal.style.display = 'block';
  }

  hideValuesModal() {
    const modal = document.getElementById('valuesModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }
}