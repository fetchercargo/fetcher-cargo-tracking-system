CREATE TABLE IF NOT EXISTS shipments (
    id                      SERIAL PRIMARY KEY,
    awb                     VARCHAR(50) NOT NULL UNIQUE,
    customer_id             VARCHAR(100),
    status                  VARCHAR(30) NOT NULL DEFAULT 'SHIPMENT CREATED',
    estimated_delivery_date VARCHAR(50),
    mode                    VARCHAR(50),
    additional_info         TEXT,
    created_date            TEXT,
    created_time            TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_awb ON shipments (awb);

CREATE TABLE IF NOT EXISTS tracking_updates (
    id              SERIAL PRIMARY KEY,
    shipment_id     INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    update_date     TEXT,
    update_time     TEXT,
    update_text     TEXT NOT NULL,
    sort_order      INTEGER NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_updates_shipment
    ON tracking_updates (shipment_id, sort_order);
