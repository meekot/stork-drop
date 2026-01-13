import React, { useState } from 'react';
import { WishlistItem } from '../types';
import { ExternalLink, Gift, Trash2, CheckCircle } from 'lucide-react';

interface ItemCardProps {
  item: WishlistItem;
  isParentView: boolean;
  onReserve: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isParentView, onReserve, onDelete }) => {
  const [imageError, setImageError] = useState(false);

  // Determine status color
  const statusColor = item.isReserved 
    ? 'bg-green-50 border-green-200' 
    : 'bg-white border-gray-100';

  return (
    <div className={`relative rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden group ${statusColor}`}>
      {/* Image Section */}
      <div className="aspect-video w-full bg-gray-50 relative overflow-hidden">
        {item.imageUrl && !imageError ? (
          <img 
            src={item.imageUrl} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-baby-100 text-baby-400">
            <Gift size={48} strokeWidth={1.5} />
          </div>
        )}
        
        {/* Price Tag */}
        {item.price && (
          <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-sm font-semibold text-gray-700 shadow-sm">
            ${item.price.toFixed(2)}
          </div>
        )}

        {/* Category Tag */}
        <div className="absolute top-2 left-2 bg-baby-500/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-medium text-white shadow-sm uppercase tracking-wide">
          {item.category}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800 leading-tight">{item.name}</h3>
          {item.url && (
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-baby-500 hover:text-baby-700 p-1"
            >
              <ExternalLink size={18} />
            </a>
          )}
        </div>

        {item.notes && (
          <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.notes}</p>
        )}

        {/* Status Section */}
        <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between">
            {item.isReserved ? (
                <div className="flex items-center text-green-600 text-sm font-medium">
                    <CheckCircle size={16} className="mr-1.5" />
                    <span>Reserved {item.reservedBy && item.reservedBy !== 'Anonymous' ? `by ${item.reservedBy}` : ''}</span>
                </div>
            ) : (
                <span className="text-gray-400 text-sm font-medium">Available</span>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
                {isParentView ? (
                    <button 
                        onClick={() => onDelete(item.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove Item"
                    >
                        <Trash2 size={18} />
                    </button>
                ) : (
                    <button
                        onClick={() => onReserve(item.id)}
                        disabled={item.isReserved}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            item.isReserved 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-baby-600 text-white hover:bg-baby-700 shadow-sm hover:shadow-md'
                        }`}
                    >
                        {item.isReserved ? 'Gifted' : 'Reserve'}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};