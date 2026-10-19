import React, { useEffect, useRef } from 'react';
import { FerryIcon } from './icons';

interface SplashWaveLoaderProps {
  durationMs?: number;
}

/**
 * Full-screen tide: two sine-wave layers rise from the bottom until they cover
 * the lower half of the viewport, while a small ferry rides the crest. The
 * ferry's heave and pitch run through a mass-spring-damper so the hull bounces
 * with buoyancy lag and pitches to follow the local wave slope.
 */
export const SplashWaveLoader: React.FC<SplashWaveLoaderProps> = ({
  durationMs = 1500,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const backRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);
  const boatRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    let lastW = 0;
    let lastH = 0;

    // Ferry body state (mass-spring-damper)
    let posY = 0;
    let velY = 0;
    let posR = 0;
    let velR = 0;
    let inited = false;

    const frame = (now: number) => {
      const host = hostRef.current;
      if (host) {
        const W = host.clientWidth || 360;
        const H = host.clientHeight || 640;

        if (W !== lastW || H !== lastH) {
          lastW = W;
          lastH = H;
          svgRef.current?.setAttribute('viewBox', `0 0 ${W} ${H}`);
        }

        const elapsed = now - start;
        const p = Math.min(1, elapsed / durationMs);
        const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
        const t = elapsed / 1000;

        // Tide rises from a low watermark to exactly half the screen
        const tideStart = H * 0.16;
        const tideEnd = H * 0.5;
        const base = H - (tideStart + ease * (tideEnd - tideStart));
        const amp = 3 + 9 * ease; // sea-state roughens with progress

        const waveY = (x: number, off: number, scale: number, phase: number) =>
          base -
          off +
          amp * scale * Math.sin(x * 0.011 - 2.2 * t + phase) +
          amp * 0.55 * scale * Math.sin(x * 0.021 + 3.1 * t + phase * 1.7);

        const slopeAt = (x: number, scale: number, phase: number) =>
          amp * scale * 0.011 * Math.cos(x * 0.011 - 2.2 * t + phase) +
          amp * 0.55 * scale * 0.021 * Math.cos(x * 0.021 + 3.1 * t + phase * 1.7);

        const buildPath = (off: number, scale: number, phase: number) => {
          let d = `M0 ${H} L0 ${waveY(0, off, scale, phase).toFixed(1)}`;
          for (let x = 12; x <= W; x += 12) {
            d += ` L${x} ${waveY(x, off, scale, phase).toFixed(1)}`;
          }
          return `${d} L${W} ${H} Z`;
        };

        backRef.current?.setAttribute('d', buildPath(12, 0.72, 0.7));
        frontRef.current?.setAttribute('d', buildPath(0, 1, 0));

        // Ferry sails across the channel as loading progresses
        const bx = W * 0.08 + ease * (W * 0.78);
        const targetY = waveY(bx, 0, 1, 0) - 26;
        const targetR = Math.atan(slopeAt(bx, 1, 0)) * (180 / Math.PI) * 0.8;

        if (!inited) {
          posY = targetY;
          inited = true;
        }

        // Buoyancy springs: heave (vertical) + pitch (roll)
        velY += (targetY - posY) * 0.16;
        velY *= 0.78;
        posY += velY;
        velR += (targetR - posR) * 0.1;
        velR *= 0.8;
        posR += velR;

        if (boatRef.current) {
          boatRef.current.style.transform = `translate(${bx.toFixed(1)}px, ${posY.toFixed(1)}px) rotate(${posR.toFixed(2)}deg)`;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [durationMs]);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Rising tide — back swell + front surface */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 360 640"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tide-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="swell-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-line)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--brand-line)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path ref={backRef} fill="url(#swell-fill)" d="M0 640 L0 520 L360 520 L360 640 Z" />
        <path ref={frontRef} fill="url(#tide-fill)" d="M0 640 L0 540 L360 540 L360 640 Z" />
      </svg>

      {/* Ferry riding the crest */}
      <span
        ref={boatRef}
        className="absolute left-0 top-0 block w-10 h-10 will-change-transform"
        style={{ transform: 'translate(24px, 560px)' }}
        aria-hidden="true"
      >
        <span className="flex items-center justify-center w-full h-full text-brand-text drop-shadow-[0_3px_5px_rgba(8,77,94,0.4)]">
          <FerryIcon className="w-9 h-9" strokeWidth={2.2} />
        </span>
      </span>
    </div>
  );
};
