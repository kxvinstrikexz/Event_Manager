import QRCode from 'qrcode';
import crypto from 'node:crypto';

export interface QRPayloadData {
  regId: string;
  eventId: string;
  studentId: string;
  ticketCode: string;
  issuedAt: number;
  hash: string;
}

const QR_SECRET = process.env.QR_SECRET || 'campusevents_secure_qr_signature_key_2026';

export function generateSecureQRPayload(regId: string, eventId: string, studentId: string, ticketCode: string): string {
  const timestamp = Date.now();
  const rawSignature = `${regId}:${eventId}:${studentId}:${ticketCode}:${timestamp}:${QR_SECRET}`;
  const hash = crypto.createHash('sha256').update(rawSignature).digest('hex').substring(0, 16);

  const payload: QRPayloadData = {
    regId,
    eventId,
    studentId,
    ticketCode,
    issuedAt: timestamp,
    hash
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function parseAndVerifyQRPayload(base64Payload: string): { valid: boolean; data?: QRPayloadData; reason?: string } {
  try {
    const jsonStr = Buffer.from(base64Payload, 'base64').toString('utf8');
    const payload = JSON.parse(jsonStr) as QRPayloadData;

    if (!payload.regId || !payload.eventId || !payload.ticketCode || !payload.hash) {
      return { valid: false, reason: 'Malformed payload structure' };
    }

    const rawSignature = `${payload.regId}:${payload.eventId}:${payload.studentId}:${payload.ticketCode}:${payload.issuedAt}:${QR_SECRET}`;
    const expectedHash = crypto.createHash('sha256').update(rawSignature).digest('hex').substring(0, 16);

    if (payload.hash !== expectedHash) {
      return { valid: false, reason: 'Invalid digital signature' };
    }

    return { valid: true, data: payload };
  } catch (err: any) {
    return { valid: false, reason: 'Could not decode QR payload: ' + err.message };
  }
}

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#2A3E4B',
      light: '#FFFFFF'
    },
    width: 280
  });
}
