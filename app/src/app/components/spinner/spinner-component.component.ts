import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `<div class="container">
    <svg
      preserveAspectRatio="xMidYMid meet"
      focusable="false"
      aria-hidden="true"
      ng-reflect-ng-switch="true"
      viewBox="0 0 100 100"
      style="width: 24px; height: 24px;"
    >
      <circle
        cx="50%"
        cy="50%"
        r="45"
        class="ng-star-inserted"
        style="animation-name: progress-spinner-stroke-rotate-100; stroke-dasharray: 282.743px; stroke-width: 10%; transform-origin: 50% 50%; stroke: black; transition-property: stroke; animation-duration: 4000ms; animation-timing-function: cubic-bezier(0.35, 0, 0.25, 1); animation-iteration-count: infinite; fill: rgba(0,0,0,0); transition: stroke-dashoffset 225ms linear;"
      ></circle>
    </svg>
  </div>`,
  styles: [
    `
      .container {
        display: block;
        position: relative;
        overflow: hidden;
        width: 24px;
        height: 24px;
      }
    `,
    `
      @keyframes progress-spinner-stroke-rotate-100 {
        0% {
          stroke-dashoffset: 268.606171575px;
          transform: rotate(0);
        }
        12.5% {
          stroke-dashoffset: 56.5486677px;
          transform: rotate(0);
        }
        12.5001% {
          stroke-dashoffset: 56.5486677px;
          transform: rotateX(180deg) rotate(72.5deg);
        }
        25% {
          stroke-dashoffset: 268.606171575px;
          transform: rotateX(180deg) rotate(72.5deg);
        }
        25.0001% {
          stroke-dashoffset: 268.606171575px;
          transform: rotate(270deg);
        }
        37.5% {
          stroke-dashoffset: 56.5486677px;
          transform: rotate(270deg);
        }
        37.5001% {
          stroke-dashoffset: 56.5486677px;
          transform: rotateX(180deg) rotate(161.5deg);
        }
        50% {
          stroke-dashoffset: 268.606171575px;
          transform: rotateX(180deg) rotate(161.5deg);
        }
        50.0001% {
          stroke-dashoffset: 268.606171575px;
          transform: rotate(180deg);
        }
        62.5% {
          stroke-dashoffset: 56.5486677px;
          transform: rotate(180deg);
        }
        62.5001% {
          stroke-dashoffset: 56.5486677px;
          transform: rotateX(180deg) rotate(251.5deg);
        }
        75% {
          stroke-dashoffset: 268.606171575px;
          transform: rotateX(180deg) rotate(251.5deg);
        }
        75.0001% {
          stroke-dashoffset: 268.606171575px;
          transform: rotate(90deg);
        }
        87.5% {
          stroke-dashoffset: 56.5486677px;
          transform: rotate(90deg);
        }
        87.5001% {
          stroke-dashoffset: 56.5486677px;
          transform: rotateX(180deg) rotate(341.5deg);
        }
        100% {
          stroke-dashoffset: 268.606171575px;
          transform: rotateX(180deg) rotate(341.5deg);
        }
      }
    `,
  ],
})
export class SpinnerComponent {}
