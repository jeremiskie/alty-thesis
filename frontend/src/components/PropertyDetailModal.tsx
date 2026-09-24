import React from 'react';
import { X, Bed, Bath, MapPin, CheckCircle2, Building, Navigation } from 'lucide-react';
import type { Property, NearbyEstablishmentsMap } from '../types';

interface ModalProps {
  property: Property | null;
  onClose: () => void;
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  hospitals: { label: 'Hospitals', icon: '🏥' },
  malls: { label: 'Malls', icon: '🛍️' },
  markets: { label: 'Markets', icon: '🛒' },
  parks: { label: 'Parks', icon: '🌳' },
  schools: { label: 'Schools', icon: '🎓' },
  transit: { label: 'Transit', icon: '🚆' },
};

export const PropertyDetailModal: React.FC<ModalProps> = ({ property, onClose }) => {
  if (!property) return null;

  let amenities: Record<string, boolean> = {};
  if (typeof property.amenity_list === 'string') {
    try {
      amenities = JSON.parse(property.amenity_list);
    } catch {
      amenities = {};
    }
  } else if (property.amenity_list) {
    amenities = property.amenity_list;
  }

  let nearby: NearbyEstablishmentsMap = {};
  const rawNearby = property.nearby_establishments;

  if (typeof rawNearby === 'string') {
    try {
      nearby = JSON.parse(rawNearby);
    } catch {
      nearby = {};
    }
  } else if (rawNearby && typeof rawNearby === 'object') {
    nearby = rawNearby as NearbyEstablishmentsMap;
  }

  const hasNearbyData =
    nearby &&
    typeof nearby === 'object' &&
    Object.values(nearby).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        <div className="relative h-48 bg-slate-800 flex items-center justify-center">
          {property.photos && property.photos.length > 0 ? (
            <img
              src={property.photos[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400 flex flex-col items-center">
              <Building className="h-12 w-12 mb-1 opacity-50" />
              <span className="text-xs">No image preview available</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-slate-900/70 hover:bg-slate-900 text-white p-1.5 rounded-full backdrop-blur-md transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full uppercase tracking-wider">
              {property.category}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-2">{property.title}</h2>
            <p className="text-slate-500 text-sm flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1 text-slate-400" />
              {property.village_name}
            </p>
          </div>

          <div className="flex items-center justify-between border-y py-3">
            <div>
              <p className="text-xs text-slate-400 uppercase font-medium">Total Price</p>
              <p className="text-xl font-bold text-emerald-600">
                ₱{property.price_total.toLocaleString()}
              </p>
            </div>
            {property.monthly_rate > 0 && (
              <div className="text-right">
                <p className="text-xs text-slate-400 uppercase font-medium">Est. Monthly</p>
                <p className="text-sm font-semibold text-slate-700">
                  ₱{property.monthly_rate.toLocaleString()}/mo
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-2 text-slate-700 text-sm">
              <Bed className="h-4 w-4 text-emerald-600" />
              <span>{property.num_bedrooms} Bedrooms</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-700 text-sm">
              <Bath className="h-4 w-4 text-emerald-600" />
              <span>{property.num_bathrooms} Bathrooms</span>
            </div>
          </div>

          {property.details && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{property.details}</p>
            </div>
          )}

          {Object.keys(amenities).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(amenities).map(([key, val]) =>
                  val ? (
                    <span
                      key={key}
                      className="flex items-center text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium capitalize"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                      {key.replace('_', ' ')}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          )}

          {hasNearbyData && (
            <div className="pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2.5 flex items-center">
                <Navigation className="h-3.5 w-3.5 mr-1 text-slate-400" />
                Nearby Establishments
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(nearby).map(([category, places]) => {
                  if (!Array.isArray(places) || places.length === 0) return null;
                  const meta = CATEGORY_META[category] || { label: category, icon: '📍' };

                  return places.map((place, idx) => (
                    <span
                      key={`${category}-${idx}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                    >
                      <span>{meta.icon}</span>
                      <span className="font-semibold">{place.name}</span>
                      <span className="text-slate-400 text-[11px]">({place.distance_km} km)</span>
                    </span>
                  ));
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};