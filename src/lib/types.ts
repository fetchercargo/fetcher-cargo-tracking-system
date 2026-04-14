export type ShipmentStatus =
  | 'SHIPMENT CREATED'
  | 'PICKED-UP'
  | 'IN-TRANSIT'
  | 'DELIVERED'
  | 'ISSUE/DELAYED'
  | 'CANCELLED'
  | 'RTO';

export const STATUS_STEPS: ShipmentStatus[] = [
  'SHIPMENT CREATED',
  'PICKED-UP',
  'IN-TRANSIT',
  'DELIVERED',
];

export const ALL_STATUSES: ShipmentStatus[] = [
  'SHIPMENT CREATED',
  'PICKED-UP',
  'IN-TRANSIT',
  'DELIVERED',
  'ISSUE/DELAYED',
  'CANCELLED',
  'RTO',
];

export interface TrackingUpdate {
  date: string;
  time: string;
  text: string;
  sortOrder: number;
}

export interface ShipmentTracking {
  awb: string;
  status: ShipmentStatus;
  estimatedDeliveryDate: string | null;
  mode: string | null;
  additionalInfo: string | null;
  createdDate: string | null;
  createdTime: string | null;
  updates: TrackingUpdate[];
}

export interface SyncPayload {
  awb: string;
  customerId?: string;
  status: string;
  estimatedDeliveryDate?: string;
  mode?: string;
  additionalInfo?: string;
  createdDate?: string;
  createdTime?: string;
  updates: {
    date?: string;
    time?: string;
    text: string;
    sortOrder: number;
  }[];
}
