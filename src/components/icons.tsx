import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  strokeWidth?: number;
}

const svgProps = (strokeWidth: number, className?: string) => ({
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
  focusable: false,
});

/**
 * NEERMETRO bespoke icon set — drawn on the 24px grid in the same
 * stroke language as lucide (2px stroke, round caps/joins) so they
 * drop-in replace lucide icons anywhere in the app.
 */

/** Side-view electric passenger ferry: hull, cabin with windows, pennant mast. */
export const FerryIcon: React.FC<IconProps> = ({ className, strokeWidth = 2, ...rest }) => (
  <svg {...svgProps(strokeWidth, className)} {...rest}>
    <path d="M12 12.8V6.8" />
    <path d="M12 6.8l3.1 1.7L12 10.2" />
    <path d="M6.8 16.2v-3.4h9.6v3.4" />
    <path d="M9.6 14.9v-1.4" />
    <path d="M12 14.9v-1.4" />
    <path d="M14.4 14.9v-1.4" />
    <path d="M3 16.2h18l-2 3.1a2 2 0 0 1-1.7.9H6.7a2 2 0 0 1-1.7-.9L3 16.2z" />
  </svg>
);

/** Floating ferry terminal: pontoon deck, pylons, river waves. */
export const FerryDockIcon: React.FC<IconProps> = ({ className, strokeWidth = 2, ...rest }) => (
  <svg {...svgProps(strokeWidth, className)} {...rest}>
    <path d="M3.5 9.5h17" />
    <path d="M7 16V9.5" />
    <path d="M17 16V9.5" />
    <path d="M2 16.5c.6.5 1.2 1 2.5 1C7 17.5 7 15.5 9.5 15.5c2.6 0 2.4 2 5 2 1.3 0 1.9-.5 2.5-1" />
    <path d="M2 20.5c.6.5 1.2 1 2.5 1C7 21.5 7 19.5 9.5 19.5c2.6 0 2.4 2 5 2 1.3 0 1.9-.5 2.5-1" />
  </svg>
);

/** QR boarding pass: perforated stub + waterway wave on the ticket body. */
export const BoardingPassIcon: React.FC<IconProps> = ({ className, strokeWidth = 2, ...rest }) => (
  <svg {...svgProps(strokeWidth, className)} {...rest}>
    <path d="M2 9a3 3 0 1 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M15.5 7v2" />
    <path d="M15.5 11v2" />
    <path d="M15.5 15v2" />
    <path d="M5 13.2c.7.5 1.4.9 2.5.9s1.8-.4 2.5-.9 1.4-.9 2.5-.9" />
  </svg>
);

/** UPI payment: smartphone with an up-arrow transaction glyph. */
export const UpiIcon: React.FC<IconProps> = ({ className, strokeWidth = 2, ...rest }) => (
  <svg {...svgProps(strokeWidth, className)} {...rest}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M12 15.8V9.8" />
    <path d="M9.5 12.3 12 9.8l2.5 2.5" />
    <path d="M10 18.6h4" />
  </svg>
);

/** RFID transit tap-card: chip + contactless waves. */
export const TransitCardIcon: React.FC<IconProps> = ({ className, strokeWidth = 2, ...rest }) => (
  <svg {...svgProps(strokeWidth, className)} {...rest}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
    <rect x="5.5" y="9" width="4.5" height="3.5" rx="1" />
    <path d="M15.2 9.6a3.4 3.4 0 0 1 0 4.8" />
    <path d="M17.6 7.6a6.2 6.2 0 0 1 0 8.8" />
  </svg>
);

