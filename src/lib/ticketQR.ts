import QRCode from 'qrcode';
import { Ticket } from '../types';

// Single QR payload schema shared by the booking success screen and
// the My Passes wallet, so a pass rendered anywhere scans identically.
export interface TicketQRPayload {
  ref: string;
  pax: number;
  route: string;
  time: string;
  valid: boolean;
  sig: string;
}

export function ticketQRPayload(ticket: Ticket): TicketQRPayload {
  return {
    ref: ticket.bookingRef,
    pax: ticket.passengerCount,
    route: ticket.routeCode,
    time: ticket.departureTime,
    valid: ticket.status !== 'CANCELLED',
    sig: ticket.qrSignature,
  };
}

export function renderTicketQR(
  canvas: HTMLCanvasElement,
  ticket: Ticket,
  width: number
): Promise<void> {
  return QRCode.toCanvas(canvas, JSON.stringify(ticketQRPayload(ticket)), {
    width,
    margin: 1,
    color: { dark: '#111315', light: '#ffffff' },
  });
}
