import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { firestore } from "./firebase";

const numericId = (id: string, index = 0) => {
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : index + 1;
};

const mapDrug = (id: string, data: any, index = 0) => ({
  id: numericId(id, index),
  name: data.name ?? "",
  generic_name: data.generic_name ?? "",
  category: data.category ?? "Other",
  uses: data.uses ?? "",
  dosage: data.dosage ?? "",
  side_effects: data.side_effects ?? "",
  pregnancy_safe: Boolean(data.pregnancy_safe),
  alcohol_safe: Boolean(data.alcohol_safe),
  lactation_safe: Boolean(data.lactation_safe),
  prescription_required: data.prescription_required ?? "Yes",
});

export const searchDrugs = async (query: string, token: string) => {
  void token;
  const snap = await getDocs(collection(firestore, "drugs"));
  const search = query.toLowerCase().trim();
  const data = snap.docs
    .map((item, index) => mapDrug(item.id, item.data(), index))
    .filter((drug) =>
      [drug.name, drug.generic_name, drug.category, drug.uses]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );

  return { status: "success", count: data.length, data };
};

export const getDrug = async (id: number, token: string) => {
  void token;
  const snap = await getDoc(doc(firestore, "drugs", String(id)));
  if (!snap.exists()) throw new Error("Drug not found.");
  return { status: "success", data: mapDrug(snap.id, snap.data()) };
};
