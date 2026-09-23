export interface Property {
  listing_id: number;
  title: string;
  category: string;
  price_total: number;
  monthly_rate: number;
  num_bedrooms: number;
  num_bathrooms: number;
  village_name: string;
  lat: number | null;
  lng: number | null;
  photos?: string[];
  details?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  status?: string;
  recommendations?: Property[];
}