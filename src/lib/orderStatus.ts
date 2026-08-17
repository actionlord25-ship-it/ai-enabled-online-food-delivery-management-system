export const ORDER_STATUSES = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ACTIVE_STATUSES: OrderStatus[] = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
];

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  PLACED: "ACCEPTED",
  ACCEPTED: "PREPARING",
  PREPARING: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
  DELIVERED: null,
  CANCELLED: null,
};

export function nextStatus(status: OrderStatus): OrderStatus | null {
  return NEXT[status];
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

export function statusLabel(status: OrderStatus): string {
  return status.toLowerCase().replace(/_/g, " ");
}
