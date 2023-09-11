import { createGlobalStyle } from 'styled-components';

export const tooltipPrefix = 'video-annotation-tooltip';

const GlobalStyle = createGlobalStyle`
// Base class
.${tooltipPrefix} {
  --shadow-width: 6px;
  --tooltip-opacity: 1;
  --tooltip-color: #fff;
  --tooltip-bg: rgba(0, 0, 0, var(--tooltip-opacity));
  --tooltip-arrow-width: 6px;
  --tooltip-border-width: 1px;
  --arrow-color: #000;

  position: absolute;
  z-index: 1070;
  font-size: 14px;
  display: block;
  visibility: visible;
  padding: var(--shadow-width);

  &-hidden {
    display: none;
  }
}

// Wrapper for the tooltip content
.${tooltipPrefix}-inner {
  padding: 8px 10px;
  color: var(--tooltip-color);
  text-align: left;
  text-decoration: none;
  background-color: var(--tooltip-bg);
  border-radius: 3px;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

// Arrows
.${tooltipPrefix}-arrow,
.${tooltipPrefix}-arrow-inner{
  position: absolute;
  width: 0;
  height: 0;
  border-color: transparent;
  border-style: solid;
}

.${tooltipPrefix} {
  &-placement-top &-arrow,
  &-placement-topLeft &-arrow,
  &-placement-topRight &-arrow{
    transform: translate(-50%, calc(var(--tooltip-arrow-width) - var(--shadow-width)));
    margin-left: calc(0 - var(--tooltip-arrow-width));
    border-width: var(--tooltip-arrow-width) var(--tooltip-arrow-width) 0;
    border-top-color: var(--arrow-color);
  }

  &-placement-top &-arrow-inner,
  &-placement-topLeft &-arrow-inner,
  &-placement-topRight &-arrow-inner{
    bottom: var(--tooltip-border-width);
    margin-left: calc(0 - var(--tooltip-arrow-width));
    border-width: var(--tooltip-arrow-width) var(--tooltip-arrow-width) 0;
    border-top-color: var(--tooltip-bg);
  }

  &-placement-top &-arrow {
    left: 50%;
  }

  &-placement-topLeft &-arrow {
    left: 15%;
  }

  &-placement-topRight &-arrow {
    right: 15%;
  }

  &-placement-right &-arrow,
  &-placement-rightTop &-arrow,
  &-placement-rightBottom &-arrow {
    left: calc(0 - var(--tooltip-arrow-width) + var(--shadow-width));
    margin-top: calc(0 - var(--tooltip-arrow-width));
    border-width: var(--tooltip-arrow-width) var(--tooltip-arrow-width) var(--tooltip-arrow-width) 0;
    border-right-color: var(--arrow-color);
  }

  &-placement-right &-arrow-inner,
  &-placement-rightTop &-arrow-inner,
  &-placement-rightBottom &-arrow-inner {
    left: var(--tooltip-border-width);
    margin-top: calc(0 - var(--tooltip-arrow-width));
    border-width: var(--tooltip-arrow-width) var(--tooltip-arrow-width) var(--tooltip-arrow-width) 0;
    border-right-color: var(--tooltip-bg);
  }

  &-placement-right &-arrow {
    top: 50%;
  }

  &-placement-rightTop &-arrow {
    top: 15%;
    margin-top: 0;
  }

  &-placement-rightBottom &-arrow {
    bottom: 15%;
  }

  &-placement-left &-arrow,
  &-placement-leftTop &-arrow,
  &-placement-leftBottom &-arrow {
    right: calc(0 - var(--tooltip-arrow-width)) + var(--shadow-width);
    margin-top: calc(0 - var(--tooltip-arrow-width));
    border-width: var(--tooltip-arrow-width) 0 var(--tooltip-arrow-width) var(--tooltip-arrow-width);
    border-left-color: var(--arrow-color);
  }

  &-placement-left &-arrow-inner,
  &-placement-leftTop &-arrow-inner,
  &-placement-leftBottom &-arrow-inner {
    right: var(--tooltip-border-width);
    margin-top: calc(0 - var(--tooltip-arrow-width));
    border-width: var(--tooltip-arrow-width) 0 var(--tooltip-arrow-width) var(--tooltip-arrow-width);
    border-left-color: var(--tooltip-bg);
  }

  &-placement-left &-arrow {
    top: 50%;
  }

  &-placement-leftTop &-arrow {
    top: 15%;
    margin-top: 0;
  }

  &-placement-leftBottom &-arrow {
    bottom: 15%;
  }

  &-placement-bottom &-arrow,
  &-placement-bottomLeft &-arrow,
  &-placement-bottomRight &-arrow {
    transform: translate(-50%, calc(0 - var(--tooltip-arrow-width) + var(--shadow-width)));
    margin-left: calc(0 - var(--tooltip-arrow-width));
    border-width: 0 var(--tooltip-arrow-width) var(--tooltip-arrow-width);
    border-bottom-color: var(--arrow-color);
  }

  &-placement-bottom &-arrow-inner,
  &-placement-bottomLeft &-arrow-inner,
  &-placement-bottomRight &-arrow-inner {
    top: var(--tooltip-border-width);
    margin-left: calc(0 - var(--tooltip-arrow-width));
    border-width: 0 var(--tooltip-arrow-width) var(--tooltip-arrow-width);
    border-bottom-color: var(--tooltip-bg);
  }

  &-placement-bottom &-arrow {
    left: 50%;
  }

  &-placement-bottomLeft &-arrow {
    left: 15%;
  }

  &-placement-bottomRight &-arrow {
    right: 15%;
  }
}

`;

export default GlobalStyle;
