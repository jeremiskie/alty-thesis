import React, { useState } from 'react';
import {
  X,
  Bed,
  Bath,
  MapPin,
  CheckCircle2,
  Building,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Map as MapIcon,
  UtensilsCrossed,
  Trees,
  Car,
  Sun,
} from 'lucide-react';
import type { Property, NearbyEstablishmentsMap } from '../types';

interface ModalProps {
  property: Property | null;
  onClose: () => void;
  onViewOnMap?: (property: Property) => void;
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  hospitals: { label: 'Hospitals', icon: '🏥' },
  malls: { label: 'Malls', icon: '🛍️' },
  markets: { label: 'Markets', icon: '🛒' },
  parks: { label: 'Parks', icon: '🌳' },
  schools: { label: 'Schools', icon: '🎓' },
  transit: { label: 'Transit', icon: '🚆' },
};

export const PropertyDetailModal: React.FC<ModalProps> = ({
  property,
  onClose,
  onViewOnMap,
}) => {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!property) return null;

  const handleViewOnMap = () => {
    if (onViewOnMap) {
      onViewOnMap(property);
    }
    onClose();
  };

  const photos = Array.isArray(property.photos) ? property.photos : [];

  const handleNextPhoto = () => {
    if (photos.length > 0) {
      setActivePhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const handlePrevPhoto = () => {
    if (photos.length > 0) {
      setActivePhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

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
  const rawNearby = property.nearby_establishments || (property as any).nearby_establishment;

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
        
        {/* Photo Carousel Header */}
        <div className="relative h-60 bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[activePhotoIndex]}
                alt={`${property.title} photo ${activePhotoIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {photos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-md transition shadow-md"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/60 hover:bg-slate-900 text-white p-2 rounded-full backdrop-blur-md transition shadow-md"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  <span className="absolute bottom-3 right-3 bg-slate-900/75 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md">
                    {activePhotoIndex + 1} / {photos.length}
                  </span>
                </>
              )}
            </>
          ) : (
            <div className="text-slate-400 flex flex-col items-center">
              <Building className="h-12 w-12 mb-1 opacity-50" />
              <span className="text-xs">No image preview available</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-slate-900/60 hover:bg-slate-900 text-white p-1.5 rounded-full backdrop-blur-md transition z-10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thumbnail Selector Row */}
        {photos.length > 1 && (
          <div className="bg-slate-100 px-3 py-2.5 border-b border-slate-200 shrink-0">
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar scroll-smooth">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative h-14 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    activePhotoIndex === idx
                      ? 'border-emerald-600 ring-2 ring-emerald-600/30 scale-100 shadow-sm'
                      : 'border-white/80 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photo} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            {property.category && (
              <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full uppercase tracking-wider">
                {property.category}
              </span>
            )}
            <h2 className="text-xl font-bold text-slate-900 mt-2">{property.title}</h2>
            <p className="text-slate-500 text-sm flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1 text-slate-400 shrink-0" />
              {property.village_name}
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-slate-100 py-3.5 bg-slate-50/60 p-3.5 rounded-xl">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Price</p>
              <p className="text-lg font-bold text-emerald-600">
                ₱{Number(property.price_total || 0).toLocaleString()}
              </p>
            </div>

            {property.initial_dp != null && property.initial_dp > 0 && (
              <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Down Payment</p>
                <p className="text-sm font-semibold text-slate-800">
                  ₱{Number(property.initial_dp).toLocaleString()}
                </p>
              </div>
            )}

            {property.monthly_rate != null && property.monthly_rate > 0 && (
              <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Est. Monthly</p>
                <p className="text-sm font-semibold text-slate-800">
                  ₱{Number(property.monthly_rate).toLocaleString()}/mo
                </p>
              </div>
            )}
          </div>

          {/* Property Features & Layout Specifications */}
          <div>
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Key Features & Layout</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Bedrooms */}
              <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 text-xs font-medium">
                <Bed className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{property.num_bedrooms} Bedrooms</span>
              </div>

              {/* Bathrooms */}
              <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 text-xs font-medium">
                <Bath className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{property.num_bathrooms} Bathrooms</span>
              </div>

              {/* Kitchen */}
              {(property.has_kitchen ?? true) && (
                <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 text-xs font-medium">
                  <UtensilsCrossed className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Kitchen</span>
                </div>
              )}

              {/* Balcony */}
              {property.has_balcony && (
                <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 text-xs font-medium">
                  <Sun className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Balcony</span>
                </div>
              )}

              {/* Backyard */}
              {property.has_backyard && (
                <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 text-xs font-medium">
                  <Trees className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Backyard</span>
                </div>
              )}

              {/* Garage */}
              {(property.has_garage || (property.garage_spaces ?? 0) > 0) && (
                <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 text-xs font-medium">
                  <Car className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>
                    {property.garage_spaces && property.garage_spaces > 0
                      ? `${property.garage_spaces} Car Garage`
                      : 'Garage Slot'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {property.details && (
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-1">Description</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{property.details}</p>
            </div>
          )}

          {/* Amenities */}
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

          {/* Nearby Establishments */}
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

        {/* Footer Actions */}
        <div className="p-4 border-t bg-slate-50 flex items-center justify-end gap-2.5 shrink-0">
          <button
            onClick={handleViewOnMap}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-100 hover:text-slate-900 transition shadow-sm"
          >
            <MapIcon className="h-4 w-4 text-emerald-600" />
            <span>View Map</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition shadow-sm"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};