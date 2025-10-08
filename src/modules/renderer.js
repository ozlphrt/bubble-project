/**
 * Renderer Module
 * 
 * This module handles all rendering operations for the soap bubble simulation,
 * including canvas setup, bubble drawing, and UI rendering.
 * 
 * @fileoverview Rendering engine for soap bubble simulation
 * @version 1.0.0
 * @author Soap Bubble Simulation Team
 */

/**
 * Renderer class for handling all drawing operations
 */
export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.setFullScreen();
    window.addEventListener('resize', () => this.setFullScreen());
  }

  setFullScreen() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  clear(theme = 0) {
    // Continuous theme-based background colors
    // Interpolate between dark (#0a0a0a) and light (#f5f5f5)
    const darkR = 10, darkG = 10, darkB = 10;
    const lightR = 245, lightG = 245, lightB = 245;
    
    const r = Math.round(darkR + (lightR - darkR) * theme);
    const g = Math.round(darkG + (lightG - darkG) * theme);
    const b = Math.round(darkB + (lightB - darkB) * theme);
    
    const bgColor = `rgb(${r}, ${g}, ${b})`;
    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  renderBubbles(bubbles, physics = null) {
    bubbles.forEach(bubble => {
      const contacts = physics ? physics.findContacts(bubble, bubbles) : [];
      
      // Apply merge animation if bubble is merging
      if (bubble.merging && bubble.mergingWith) {
        // Skip drawing if merge progress is too high (bubble is almost gone)
        if (bubble.mergeProgress < 0.9) {
          this.ctx.save();
          
          // Fade out during merge
          this.ctx.globalAlpha = 1.0 - bubble.mergeProgress;
          
          // Shrink slightly during merge (clamped to prevent negative radius)
          const scale = Math.max(0.1, 1.0 - bubble.mergeProgress * 0.5);
          this.ctx.translate(bubble.x, bubble.y);
          this.ctx.scale(scale, scale);
          this.ctx.translate(-bubble.x, -bubble.y);
          
          bubble.draw(this.ctx, contacts);
          
          // Draw bright red border to indicate merging
          this.ctx.strokeStyle = `rgba(255, 0, 0, ${1.0 - bubble.mergeProgress})`;
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
          this.ctx.stroke();
          
          this.ctx.restore();
        }
        
        // Update merge progress (much slower for visibility)
        bubble.mergeProgress += 0.01; // Very slow merge animation (was 0.05)
        
        // Remove bubble when merge is complete
        if (bubble.mergeProgress >= 1.0) {
          bubble.merging = false;
          bubble.mergingWith = null;
          bubble.mergeProgress = 0;
        }
      } else {
        // Normal rendering
        bubble.draw(this.ctx, contacts);
      }
    });
  }

  renderUI(fps, bubbleCount, compressionActive, lastCompressionForce, controls, bubbles = []) {
    // Render FPS
    const fpsElement = document.getElementById('fps');
    if (fpsElement) {
      fpsElement.textContent = fps;
    }

    // Render Bubble Count
    const bubbleCountElement = document.getElementById('bubbleCount');
    if (bubbleCountElement) {
      bubbleCountElement.textContent = bubbleCount;
    }

    // Render Compression Indicator
    const compressionIndicator = document.getElementById('compression');
    if (compressionIndicator) {
      if (compressionActive) {
        const forcePercent = Math.round((lastCompressionForce / 0.001) * 100); // Adjusted max force
        compressionIndicator.textContent = `Force: ${forcePercent}%`;
      } else {
        compressionIndicator.textContent = '';
      }
    }
    
    // Only draw control panel if it doesn't exist yet
    this.ensureControlPanelExists(controls);
    // Update slider positions without regenerating HTML
    this.updateSliderPositions(controls);
  }

  ensureControlPanelExists(controls) {
    const controlPanelElement = document.getElementById('controlPanel');
    if (!controlPanelElement) return;
    
    // Only create the control panel if it doesn't exist or is empty
    if (controlPanelElement.innerHTML.trim() === '' || controlPanelElement.innerHTML.includes('Loading controls...')) {
      this.createControlPanel(controls);
    }
  }

  createControlPanel(controls) {
    const controlPanelElement = document.getElementById('controlPanel');
    if (!controlPanelElement) return;
    
    
    // Define control groups - reorganized for better logical grouping
    const controlGroups = {
      'Bubble Behavior': ['targetDist', 'separation', 'collisionStrength', 'wallBounce'],
      'Shape & Tension': ['deformationStrength', 'influenceThreshold', 'surfaceTension', 'plateauForceStrength'],
      'Environment': ['gravity', 'damping', 'coalescenceRate'],
      'Appearance': ['bubbleCount', 'averageSize', 'sizeVariation'],
      'Advanced': ['compressionForce', 'interpolationFactor']
    };
    
    // Generate HTML content for the control panel with glassmorphism
    let html = '<div style="background: rgba(10,10,15,0.4); border: 1px solid rgba(255,255,255,0.15); border-radius: 12px; padding: 12px; color: white; font-family: Arial, sans-serif; backdrop-filter: blur(20px); height: calc(100vh - 40px); overflow-y: visible; overflow-x: hidden; width: 100%; box-sizing: border-box; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">';
    
    // Header with title and auto-hide toggle
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">';
    html += '<h3 style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.95); font-weight: 600;">Physics Controls</h3>';
    html += '<label style="display: flex; align-items: center; cursor: pointer; font-size: 12px;">';
    html += '<input type="checkbox" id="autoHideToggle" style="margin-right: 5px;">';
    html += '<span style="color: rgba(255,255,255,0.7);">Auto-hide</span>';
    html += '</label>';
    html += '</div>';
    
    // Create grouped controls
    for (const [groupName, controlKeys] of Object.entries(controlGroups)) {
        html += `<div style="margin-bottom: 15px;">`;
        html += `<h4 style="margin: 0 0 8px 0; font-size: 12px; color: rgba(100,200,255,0.9); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(100,200,255,0.2); padding-bottom: 3px;">${groupName}</h4>`;
      
      for (const key of controlKeys) {
        const control = controls.controls[key];
        if (!control) continue;
        
        const shortLabel = this.getShortLabel(control.label);
        const tooltip = control.tooltip || '';
        
        html += `<div style="display: flex; align-items: center; margin-bottom: 8px; font-size: 12px; position: relative;">`;
        html += `<span style="width: 80px; color: rgba(255,255,255,0.8); cursor: default;" data-tooltip="${tooltip}">${shortLabel}</span>`;
        
        // Check if this is a toggle control
        if (control.isToggle) {
          // Render as checkbox toggle
          const isChecked = control.value >= 0.5;
          html += `<label style="flex: 1; display: flex; align-items: center; cursor: pointer;">`;
          html += `<input type="checkbox" id="toggle-${key}" ${isChecked ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">`;
          html += `<span id="value-${key}" style="margin-left: 10px; color: white;">${isChecked ? 'On' : 'Off'}</span>`;
          html += `</label>`;
        } else {
          // Enhanced slider with tooltip, default indicator, and extended range
          const normalizedValue = this.normalizeValue(control.value, control.min, control.max);
          const defaultPosition = this.normalizeValue(control.default || control.min, control.min, control.max);
          
          // Value display (hidden by default, shown during drag)
          if (key === 'coalescenceRate') {
            html += `<span id="value-${key}" style="width: 60px; text-align: right; margin-right: 10px; color: white; opacity: 0; transition: opacity 0.2s;">${control.value.toFixed(5)}</span>`;
          } else {
            html += `<span id="value-${key}" style="width: 40px; text-align: right; margin-right: 10px; color: white; opacity: 0; transition: opacity 0.2s;">${control.value.toFixed(2)}</span>`;
          }
          
          // Enhanced slider without extreme zones
          html += `<div style="flex: 1; height: 16px; background: rgba(100,100,100,0.5); border-radius: 8px; position: relative; margin-right: 5px; cursor: pointer; min-width: 0;" id="slider-track-${key}">`;
          
          // Default value indicator (small dot)
          html += `<div style="position: absolute; left: ${defaultPosition * 100}%; top: 50%; width: 4px; height: 4px; background: rgba(255,255,0,0.8); border-radius: 50%; transform: translate(-50%, -50%);"></div>`;
          
          // Slider handle
          html += `<div id="slider-${key}" style="position: absolute; left: ${normalizedValue * 100}%; top: -1px; width: 4px; height: 18px; background: white; border-radius: 2px; transform: translateX(-50%); cursor: grab;"></div>`;
          html += '</div>';
        }
        
        html += '</div>';
      }
      
      html += '</div>'; // Close group
    }
    
    html += '</div>';
    
    controlPanelElement.innerHTML = html;
  }

  updateSliderPositions(controls) {
    for (const [key, control] of Object.entries(controls.controls)) {
      if (control.isToggle) {
        // Update toggle checkbox
        const toggleCheckbox = document.getElementById(`toggle-${key}`);
        if (toggleCheckbox) {
          toggleCheckbox.checked = control.value >= 0.5;
        }
        
        // Update toggle value display
        const valueDisplay = document.getElementById(`value-${key}`);
        if (valueDisplay) {
          valueDisplay.textContent = control.value >= 0.5 ? 'On' : 'Off';
        }
      } else {
        // Update enhanced slider
        const normalizedValue = this.normalizeValue(control.value, control.min, control.max);
        
        // Update slider handle position
        const sliderHandle = document.getElementById(`slider-${key}`);
        if (sliderHandle) {
          sliderHandle.style.left = `${normalizedValue * 100}%`;
        }
        
        // Update value display
        const valueDisplay = document.getElementById(`value-${key}`);
        if (valueDisplay) {
          if (key === 'coalescenceRate') {
            // Show 5 decimal places for coalescence rate
            valueDisplay.textContent = control.value.toFixed(5);
          } else {
            valueDisplay.textContent = control.value.toFixed(2);
          }
        }
      }
    }
  }


  getShortLabel(label) {
    const shortLabels = {
      'Separation': 'Separation',
      'Separation Force': 'Sep Force',
      'Collision Strength': 'Collision',
      'Morphing Threshold': 'Morph Thresh',
      'Morphing Strength': 'Morph Str',
      'Wall Bounce': 'Wall Bounce',
      'Damping': 'Damping',
      'Compression Force': 'Compress',
      'Force Smoothing': 'Smoothing',
      'Theme': 'Theme',
      'Gravity': 'Gravity',
      'Surface Tension': 'Surface Tension',
      'Coalescence Rate': 'Coalesce',
      'Plateau Borders': 'Plateau',
      'Average Size': 'Avg Size',
      'Size Variation': 'Size Var',
      'Bubble Count': 'Bubble Count'
    };
    return shortLabels[label] || label;
  }

  normalizeValue(value, min, max) {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  /**
   * Render Plateau borders (triple junctions)
   * @param {Array<Object>} junctions - Array of junction objects from detectPlateauBorders
   * @param {Controls} controls - Controls object to get visualization settings
   */
  renderPlateauBorders(junctions, controls) {
    // Plateau border visualization disabled (always hidden)
    return;
    
    const theme = controls?.getValue('theme') || 0;
    const borderThickness = 1; // Fixed thickness
    
    junctions.forEach(junction => {
      // Draw lines from junction point to each bubble center
      this.ctx.save();
      
      // Use different colors for perfect (120°) vs imperfect junctions
      if (junction.isPerfect) {
        // Perfect Plateau border - bright green
        this.ctx.strokeStyle = `rgba(0, 255, 100, 0.8)`;
        this.ctx.lineWidth = borderThickness + 1;
      } else {
        // Imperfect junction - yellow/orange based on error
        const errorIntensity = Math.min(1, junction.avgError / 0.5); // Normalize error
        const r = Math.round(255);
        const g = Math.round(200 - errorIntensity * 100);
        const b = Math.round(50 - errorIntensity * 50);
        this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
        this.ctx.lineWidth = borderThickness;
      }
      
      // Draw lines from junction to each bubble
      junction.bubbles.forEach(bubble => {
        this.ctx.beginPath();
        this.ctx.moveTo(junction.x, junction.y);
        
        // Find the point on the bubble edge closest to the junction
        const dx = bubble.x - junction.x;
        const dy = bubble.y - junction.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const edgeX = junction.x + (dx / dist) * (dist - bubble.radius * 0.5);
        const edgeY = junction.y + (dy / dist) * (dist - bubble.radius * 0.5);
        
        this.ctx.lineTo(edgeX, edgeY);
        this.ctx.stroke();
      });
      
      // Draw a circle at the junction point
      this.ctx.beginPath();
      this.ctx.arc(junction.x, junction.y, borderThickness * 1.5, 0, Math.PI * 2);
      this.ctx.fillStyle = junction.isPerfect ? 
        `rgba(0, 255, 100, 0.9)` : 
        `rgba(255, 200, 50, 0.7)`;
      this.ctx.fill();
      
      // Draw angle indicators for perfect junctions
      if (junction.isPerfect) {
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillText('120°', junction.x + 5, junction.y - 5);
      }
      
      this.ctx.restore();
    });
  }
}