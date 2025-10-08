/**
 * Custom tooltip system for control panel sliders
 */
export class TooltipManager {
  constructor() {
    this.tooltipElement = null;
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
}

