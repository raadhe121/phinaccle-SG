import { apiUrl } from "@/Config";

export interface RawSpecialist {
  id: number;
  active: boolean;
  title?: string;
  name?: string;
  image_url?: string;
  banner_image_path?: string | null;
  bio?: string;
  short_bio?: string;
  full_bio?: string;
  board_certifications?: string;
  clinic_name?: string;
  clinic_photo_path?: string;
  clinic_logo_path?: string | null;
  consultation_fee?: number;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  created_at?: string;
  display_order?: number;
  hospital_affiliations?: string;
  insurance_shield_plan?: string;
  insurance_tpa?: string;
  languages?: string;
  service_details?: string;
  service_name?: string;
  day_availability?: { [key: string]: string[] };
  specialisation?: {
    id: number;
    name: string;
    slug: string;
  };
  specialisation_id?: number;
  updated_at?: string | null;
  years_of_practice?: number;
  awards?: string;
  credentials?: string;
  experience?: string;
  rating?: number;
  reviews?: number;
}

export interface Specialisation {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon_url?: string;
  banner_url?: string | null;
  display_mode?: "doctors" | "services" | string;
  specialists?: RawSpecialist[];
  services?: RawSpecialist[];
}

// Shared cache key: every screen in this flow (specialisation list, specialist
// list, specialist detail) reads from the same query so the (large) dataset is
// only fetched once per session instead of on every screen transition.
export const specialisationsQueryKey = ["specialisations"] as const;

export const fetchSpecialisations = async (): Promise<Specialisation[]> => {
  const response = await fetch(
    `${apiUrl}/specialisations/active?include_items=true`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch specialisations");
  }
  return response.json();
};

export const findSpecialisation = (
  specialisations: Specialisation[] | undefined,
  idOrSlug: string | number | undefined,
): Specialisation | undefined =>
  specialisations?.find(
    (s) => String(s.id) === String(idOrSlug) || s.slug === idOrSlug,
  );
