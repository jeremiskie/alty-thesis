export interface NearbyEstablishmentItem {
  name: string;
  distance_km: number;
  lat?: number | null;
  lng?: number | null;
}

export interface NearbyEstablishmentsMap {
  [category: string]: NearbyEstablishmentItem[];
}

export interface Property {
  listing_id: number | string;
  title: string;
  category?: string;
  price_total: number;
  initial_dp?: number | null;
  monthly_rate?: number | null;
  num_bedrooms: number;
  num_bathrooms: number;
  has_balcony?: boolean;     // Added
  has_kitchen?: boolean;     // Added
  has_backyard?: boolean;    // Added
  has_garage?: boolean;      // Added
  garage_spaces?: number;    // Added
  layout_type?: string;
  village_name: string;
  lat: number | null;
  lng: number | null;
  photos?: string[];
  amenity_list?: any;
  nearby_establishments?: any;
  details?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  status?: 'rejected' | 'clarification_needed' | 'success';
  recommendations?: Property[];
}