/** Leaflet divIcon HTML for NEERMETRO map markers (drawn in the app's icon language). */

/**
 * Top-down ferry catamaran marker — bow points up, rotated by the vessel's real heading.
 */
export const ferryMarkerHtml = (color: string, headingDeg: number, hullNumber?: string, isSelected?: boolean): string => `
  <div style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
    <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:${isSelected ? 0.4 : 0.2};${isSelected ? 'transform:scale(1.3);box-shadow:0 0 14px ' + color + ';' : ''}"></div>
    <div style="width:${isSelected ? '32px' : '28px'};height:${isSelected ? '32px' : '28px'};border-radius:50%;background:#ffffff;border:2.5px solid ${color};display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.22);transition:all 0.2s;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${headingDeg}deg);">
        <path d="M12 2.8c2.8 3.2 4.2 6.4 4.2 9.6 0 2.4-.6 4.5-1.7 6.2h-5A11.3 11.3 0 0 1 7.8 12.4c0-3.2 1.4-6.4 4.2-9.6z"/>
        <path d="M9.4 12.4h5.2"/>
        <path d="M12 18.6v2.6"/>
      </svg>
    </div>
    ${hullNumber ? `<div style="position:absolute;bottom:-9px;background:#111315;color:#ffffff;font-size:9px;font-family:monospace;font-weight:bold;padding:1px 4px;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.3);white-space:nowrap;pointer-events:none;">${hullNumber}</div>` : ''}
  </div>
`;

/**
 * Major Passenger Terminal Marker (High visual prominence with terminal badge)
 */
export const terminalMarkerHtml = (color: string, code: string, name?: string): string => `
  <div title="${name || code}" style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
    <div style="position:relative;width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg, #ffffff 0%, #edf7fa 100%);border:2.5px solid ${color};box-shadow:0 4px 10px rgba(11,100,122,0.3);display:flex;align-items:center;justify-content:center;transition:transform 0.2s;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 18h20"/>
        <path d="M5 18V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10"/>
        <path d="M12 6V2"/>
        <path d="M9 12h6"/>
      </svg>
    </div>
    <div style="position:absolute;bottom:-18px;display:flex;flex-direction:column;align-items:center;pointer-events:none;white-space:nowrap;">
      <span style="background:#0b647a;color:#ffffff;font-size:8px;font-weight:800;letter-spacing:0.5px;padding:0.5px 4px;border-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,0.25);">TERMINAL</span>
      <span style="background:#ffffff;color:#111315;border:1px solid #dfe3e5;font-size:9px;font-weight:800;padding:0px 4px;border-radius:3px;margin-top:1px;box-shadow:0 1px 2px rgba(0,0,0,0.15);">${code}</span>
    </div>
  </div>
`;

/**
 * Intermediate River Quay / Station Stop Marker
 */
export const stopMarkerHtml = (color: string, code: string): string => `
  <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:pointer;">
    <div style="width:20px;height:20px;border-radius:50%;background:#ffffff;border:2.5px solid ${color};box-shadow:0 2px 5px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;">
      <div style="width:7px;height:7px;border-radius:50%;background:${color};"></div>
    </div>
    <div style="position:absolute;bottom:-14px;background:#ffffff;color:#555555;border:1px solid #dfe3e5;font-size:8px;font-weight:700;padding:0px 3px;border-radius:3px;box-shadow:0 1px 2px rgba(0,0,0,0.12);pointer-events:none;white-space:nowrap;">
      ${code}
    </div>
  </div>
`;
