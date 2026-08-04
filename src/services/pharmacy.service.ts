import { collection, getDocs } from "firebase/firestore";
import { firestore } from "./firebase";

const seededPharmacies = require("../../seed-data/pharmacies.json") as any[];

const numericId = (id: string, index = 0) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : index + 1;
};

// Firestore rejects pharmacies reads for non-subscribers (see hasActiveSubscription()
// in firestore.rules) — that denial must propagate as an error, not be swallowed
// into the bundled seed data below, or the paywall does nothing.
const isPermissionDenied = (error: unknown) =>
  (error as { code?: string } | null)?.code === "permission-denied";

const mapPharmacy = (id: string, data: any, index = 0) => ({
  id: numericId(id, index),
  name: data.name ?? "",
  location: data.location ?? "",
  address: data.address ?? "",
  phone: data.phone ?? "",
  email: data.email ?? null,
  latitude: Number(data.latitude ?? 0),
  longitude: Number(data.longitude ?? 0),
  opening_hours: data.opening_hours ?? "",
  open_24hrs: Boolean(data.open_24hrs),
  open: Boolean(data.open),
});

// Local-only, unauthenticated pharmacy list — used by screens (e.g. the map)
// that intentionally show generic seeded data to everyone regardless of
// subscription. Never route this through anything that also serves the
// paywalled directory (getPharmacies below).
export const fetchSeededPharmacies = () =>
  seededPharmacies.map((item, index) => mapPharmacy(String(index + 1), item, index));

export const getPharmacies = async (token: string, search?: string) => {
  void token;
  let data: ReturnType<typeof mapPharmacy>[] = [];
  try {
    const snap = await getDocs(collection(firestore, "pharmacies"));
    data = snap.docs.map((item, index) =>
      mapPharmacy(item.id, item.data(), index),
    );
  } catch (error) {
    if (isPermissionDenied(error)) throw error;
    data = [];
  }

  if (data.length === 0) {
    data = fetchSeededPharmacies();
  }

  const query = search?.toLowerCase().trim();

  if (query) {
    data = data.filter((pharmacy) =>
      [pharmacy.name, pharmacy.location, pharmacy.address]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }

  return { status: "success", count: data.length, data };
};
