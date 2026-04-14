import pool from './db';
import type { ShipmentTracking, ShipmentStatus, SyncPayload } from './types';

export async function getShipmentByAwb(awb: string): Promise<ShipmentTracking | null> {
  const shipmentResult = await pool.query(
    `SELECT awb, status, estimated_delivery_date, mode,
            additional_info, created_date, created_time
     FROM shipments
     WHERE UPPER(TRIM(awb)) = UPPER(TRIM($1))`,
    [awb]
  );

  if (shipmentResult.rows.length === 0) return null;

  const row = shipmentResult.rows[0];

  const updatesResult = await pool.query(
    `SELECT u.update_date, u.update_time, u.update_text, u.sort_order
     FROM tracking_updates u
     JOIN shipments s ON u.shipment_id = s.id
     WHERE UPPER(TRIM(s.awb)) = UPPER(TRIM($1))
     ORDER BY u.sort_order ASC`,
    [awb]
  );

  return {
    awb: row.awb,
    status: row.status as ShipmentStatus,
    estimatedDeliveryDate: row.estimated_delivery_date || null,
    mode: row.mode || null,
    additionalInfo: row.additional_info || null,
    createdDate: row.created_date || null,
    createdTime: row.created_time || null,
    updates: updatesResult.rows.map((u) => ({
      date: u.update_date || '',
      time: u.update_time || '',
      text: u.update_text,
      sortOrder: u.sort_order,
    })),
  };
}

export async function upsertShipment(data: SyncPayload): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const upsertResult = await client.query(
      `INSERT INTO shipments (awb, customer_id, status, estimated_delivery_date, mode, additional_info, created_date, created_time, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (awb) DO UPDATE SET
         customer_id = EXCLUDED.customer_id,
         status = EXCLUDED.status,
         estimated_delivery_date = EXCLUDED.estimated_delivery_date,
         mode = EXCLUDED.mode,
         additional_info = EXCLUDED.additional_info,
         created_date = EXCLUDED.created_date,
         created_time = EXCLUDED.created_time,
         updated_at = NOW()
       RETURNING id`,
      [
        data.awb.trim(),
        data.customerId || null,
        data.status.trim(),
        data.estimatedDeliveryDate || null,
        data.mode || null,
        data.additionalInfo || null,
        data.createdDate || null,
        data.createdTime || null,
      ]
    );

    const shipmentId = upsertResult.rows[0].id;

    await client.query('DELETE FROM tracking_updates WHERE shipment_id = $1', [shipmentId]);

    for (const update of data.updates) {
      if (!update.text || !update.text.trim()) continue;
      await client.query(
        `INSERT INTO tracking_updates (shipment_id, update_date, update_time, update_text, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [shipmentId, update.date || null, update.time || null, update.text.trim(), update.sortOrder]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
