export interface Property {
  id: string;
  name: string;
  address: string;
}

interface Cache {
  properties: Property[] | null;
}

const cache: Cache = {
  properties: null,
};

export async function getProperties(
  userId: string,
  refetch?: boolean,
): Promise<Property[]> {
  if (cache.properties !== null && !refetch) {
    return cache.properties;
  }

  const url = `/api/users/${userId}/properties`;
  const response = await fetch(url);
  const data = await response.json() as Property[];

  cache.properties = data;
  return data;
}

/**
 * Check if the index provided is a valid property number (for navigation).
 *
 * @param index A number between 0 and `properties.length`.
 * @param properties An array of `Property` objects.
 * @returns Whether the index points to a valid property.
 */
export function isValidPropertyIndex(
  index: number,
  properties?: Property[],
): boolean {
  if (typeof properties === "undefined") {
    return false;
  }

  return !isNaN(index) && index >= 0 && index < properties.length;
}

// Implementation for Expenses
// ---------------------------

export interface Expense {
}

// Implementation for Reservations
// -------------------------------

export interface Reservation {
  platform: string;
  checkIn: Date;
  checkOut: Date;
  revenue: number;
  managementFee: number;
  netProfit: number;
}

interface ReservationPayload {
  platform: string;
  payout_date: string;
  check_in: string;
  check_out: string;
  revenue: number;
  management_fee: number;
  net_profit: number;
}

export async function getReservations(
  userId: string,
  propertyId: string,
  year: number,
  month: number,
): Promise<Reservation[] | undefined> {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}`);
  }

  const url =
    `/api/users/${userId}/properties/${propertyId}/reservations/${year}/${month}`;
  const response = await fetch(url);

  const body = await response.json() as ReservationPayload[];

  const data = body.map((r) => ({
    platform: r.platform,
    checkIn: new Date(r.check_in),
    checkOut: new Date(r.check_out),
    revenue: r.revenue,
    managementFee: r.management_fee,
    netProfit: r.net_profit,
  })) as Reservation[];

  return data;
}
