/**
 * Custom tooltip system for control panel sliders
 */
export class TooltipManager {
  constructor() {
    this.tooltipElement = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.init();
  }

  init() {
    // Get the tooltip element
    this.tooltipElement = document.getElementById('customTooltip');
    
    console.log('TooltipManager initialized, element:', this.tooltipElement);
    
    if (!this.tooltipElement) {
      console.warn('Custom tooltip element not found');
      return;
    }

    // Track mouse position
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.updatePosition();
    });

    // Add event delegation for all elements with data-tooltip
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target && target.hasAttribute('data-tooltip')) {
        const tooltipText = target.getAttribute('data-tooltip');
        console.log('Tooltip mouseover, text:', tooltipText);
        this.show(tooltipText);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target && target.hasAttribute('data-tooltip')) {
        console.log('Tooltip mouseout');
        this.hide();
      }
    });
  }

  show(text) {
    if (!this.tooltipElement || !text) return;
    
    console.log('Showing tooltip:', text);
    this.tooltipElement.textContent = text;
    this.tooltipElement.classList.add('visible');
    console.log('Tooltip element classes:', this.tooltipElement.className);
    console.log('Tooltip element style:', window.getComputedStyle(this.tooltipElement).opacity);
  }

  hide() {
    if (!this.tooltipElement) return;
    
    console.log('Hiding tooltip');
    this.tooltipElement.classList.remove('visible');
  }

  updatePosition() {
    if (!this.tooltipElement || !this.tooltipElement.classList.contains('visible')) return;
    
    // Position tooltip near the mouse cursor
    // Offset by 20px right and 20px down to avoid blocking the cursor
    const offsetX = 20;
    const offsetY = 20;
    
    this.tooltipElement.style.left = (this.mouseX + offsetX) + 'px';
    this.tooltipElement.style.top = (this.mouseY + offsetY) + 'px';
    this.tooltipElement.style.transform = 'none'; // Remove center transform
  }
}

