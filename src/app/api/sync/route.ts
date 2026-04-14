import { NextRequest, NextResponse } from 'next/server';
import { upsertShipment } from '@/lib/queries';
import type { SyncPayload } from '@/lib/types';

const VALID_STATUSES = ['SHIPMENT CREATED', 'PICKED-UP', 'IN-TRANSIT', 'DELIVERED', 'ISSUE/DELAYED', 'CANCELLED', 'RTO'];

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.SYNC_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SyncPayload | SyncPayload[];
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const payloads = Array.isArray(body) ? body : [body];
  let synced = 0;
  const errors: { awb: string; error: string }[] = [];

  for (const payload of payloads) {
    if (!payload.awb || !payload.awb.trim()) {
      errors.push({ awb: payload.awb || '(empty)', error: 'AWB is required' });
      continue;
    }
    const normalizedStatus = (payload.status || '').trim().toUpperCase();
    if (!normalizedStatus || !VALID_STATUSES.includes(normalizedStatus)) {
      errors.push({ awb: payload.awb, error: `Invalid status: ${payload.status}` });
      continue;
    }

    try {
      await upsertShipment({
        ...payload,
        status: normalizedStatus,
      });
      synced++;
    } catch (err) {
      errors.push({ awb: payload.awb, error: String(err) });
    }
  }

  return NextResponse.json({ synced, errors: errors.length > 0 ? errors : undefined });
}
