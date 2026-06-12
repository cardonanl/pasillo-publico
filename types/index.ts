export type ArtworkStatus = "available" | "sold" | "not_for_sale";
export type PricingType = "fixed" | "from" | "negotiable";

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  instagram_url: string | null;
  website_url: string | null;
  whatsapp: string | null;
  is_artist: boolean;
  is_approved: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Artwork {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  technique: string | null;
  dimensions: string | null;
  year: number | null;
  price: number | null;
  status: ArtworkStatus;
  images: string[];
  created_at: string;
  updated_at: string;
  artist?: Profile;
  categories?: string[];
}

export interface Service {
  id: string;
  artist_id: string;
  title: string;
  description: string | null;
  category: string;
  pricing_type: PricingType;
  price: number | null;
  price_unit: string | null;
  delivery_time: string | null;
  images: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  artist?: Profile;
}
