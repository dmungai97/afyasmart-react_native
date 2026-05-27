import { collection, getDocs } from "firebase/firestore";
import { firestore } from "./firebase";

const seededPharmacies = require("../../seed-data/pharmacies.json") as any[];

const numericId = (id: string, index = 0) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : index + 1;
};

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

export const getPharmacies = async (token: string, search?: string) => {
  void token;
  let data: ReturnType<typeof mapPharmacy>[] = [];
  try {
    const snap = await getDocs(collection(firestore, "pharmacies"));
    data = snap.docs.map((item, index) =>
      mapPharmacy(item.id, item.data(), index),
    );
  } catch {
    data = [];
  }

  if (data.length === 0) {
    data = seededPharmacies.map((item, index) =>
      mapPharmacy(String(index + 1), item, index),
    );
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
