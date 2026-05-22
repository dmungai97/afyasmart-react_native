import { collection, getDocs } from "firebase/firestore";
import { firestore } from "./firebase";

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
  opening_hours: data.opening_hours ?? "",
  open_24hrs: Boolean(data.open_24hrs),
  open: Boolean(data.open),
});

export const getPharmacies = async (token: string, search?: string) => {
  void token;
  const snap = await getDocs(collection(firestore, "pharmacies"));
  const query = search?.toLowerCase().trim();
  let data = snap.docs.map((item, index) =>
    mapPharmacy(item.id, item.data(), index),
  );

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
