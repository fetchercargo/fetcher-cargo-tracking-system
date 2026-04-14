import { NextRequest, NextResponse } from 'next/server';
import { getShipmentByAwb } from '@/lib/queries';
import { verifyCaptcha } from '@/lib/captcha';

export async function GET(request: NextRequest) {
  const awb = request.nextUrl.searchParams.get('awb');
  const captchaAnswer = request.nextUrl.searchParams.get('captcha_answer');
  const captchaToken = request.nextUrl.searchParams.get('captcha_token');

  if (!awb || !awb.trim()) {
    return NextResponse.json({ error: 'AWB number is required' }, { status: 400 });
  }

  const trimmed = awb.trim();
  if (trimmed.length > 50) {
    return NextResponse.json({ error: 'Invalid AWB number' }, { status: 400 });
  }

  // Verify CAPTCHA
  if (!captchaAnswer || !captchaToken) {
    return NextResponse.json({ error: 'CAPTCHA verification required' }, { status: 403 });
  }
  if (!verifyCaptcha(captchaAnswer, captchaToken)) {
    return NextResponse.json({ error: 'Incorrect answer or CAPTCHA expired. Please try again.' }, { status: 403 });
  }

  try {
    const shipment = await getShipmentByAwb(trimmed);

    if (!shipment) {
      return NextResponse.json({ error: 'No shipment found for this AWB number' }, { status: 404 });
    }

    return NextResponse.json(shipment);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
