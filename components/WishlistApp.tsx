"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Baby, Settings, Plus, X, Sparkles, Share2, Wand2, LogOut } from 'lucide-react';
import { WishlistItem, ToastMessage } from '../types';
import { ItemCard } from './ItemCard';
import { Button } from './Button';
import { Input } from './Input';
import { fetchProductImage, extractProductDetails } from '../services/productService';

// --- Helper Hook for LocalStorage ---
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stickyValue = window.localStorage.getItem(key);
    if (stickyValue !== null) {
      setValue(JSON.parse(stickyValue));
    }
  }, [key]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// --- Components ---

const Header: React.FC<{ isParentView: boolean; onLogout?: () => void }> = ({ isParentView, onLogout }) => (
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link href="/" className="flex items-center space-x-2 text-baby-900">
        <div className="bg-baby-200 p-2 rounded-full">
            <Baby size={24} className="text-baby-600" />
        </div>
        <span className="font-bold text-lg tracking-tight">StorkDrop</span>
      </Link>
      <div className="flex items-center space-x-2">
        {!isParentView && (
           <Link href="/parents" className="p-2 text-gray-400 hover:text-baby-600 transition-colors">
             <Settings size={20} />
           </Link>
        )}
        {isParentView && (
          <>
            <Link href="/" className="text-sm font-medium text-baby-600 bg-baby-50 px-3 py-1.5 rounded-lg">
                View as Guest
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-baby-600 transition-colors"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  </header>
);

const EmptyState: React.FC<{ isParentView: boolean; onAddClick?: () => void }> = ({ isParentView, onAddClick }) => (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-baby-50 p-6 rounded-full mb-6 animate-pulse">
            <Baby size={48} className="text-baby-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
            {isParentView ? "Your registry is empty" : "The stork hasn't arrived yet!"}
        </h3>
        <p className="text-gray-500 max-w-xs mx-auto mb-8">
            {isParentView 
                ? "Start building your dream wishlist for the little one." 
                : "The parents haven't added any items yet. Check back soon!"}
        </p>
        {isParentView && onAddClick && (
            <Button onClick={onAddClick}>
                Add Your First Item
            </Button>
        )}
    </div>
);

// --- Modal Component ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 animate-[fadeIn_0.2s_ease-out]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

// --- Main App Logic ---

const WishlistApp: React.FC<{ isParentView: boolean }> = ({ isParentView }) => {
    // State
    const [items, setItems] = useStickyState<WishlistItem[]>([], 'storkdrop-items');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    
    // Add Item Form State
    const [newItemName, setNewItemName] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemCurrency, setNewItemCurrency] = useState<string>('');
    const [newItemImage, setNewItemImage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [newItemNotes, setNewItemNotes] = useState('');
    const [hidePrice, setHidePrice] = useState(false);

    // Reserve Form State
    const [reserverName, setReserverName] = useState('');

    // Toast notifications
    const [toast, setToast] = useState<ToastMessage | null>(null);

    const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
        setToast({ id: Date.now().toString(), message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const resetAddForm = () => {
        setNewItemName('');
        setNewItemUrl('');
        setNewItemPrice('');
        setNewItemCurrency('');
        setNewItemImage('');
        setNewItemNotes('');
        setHidePrice(false);
    };

    // Handlers
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const item: WishlistItem = {
            id: Date.now().toString(),
            name: newItemName,
            price: hidePrice ? undefined : (newItemPrice ? parseFloat(newItemPrice) : undefined),
            currency: hidePrice ? undefined : (newItemCurrency || undefined),
            url: newItemUrl,
            imageUrl: newItemImage || undefined,
            reservedBy: null,
            isReserved: false,
            notes: newItemNotes || undefined,
            createdAt: Date.now(),
        };
        setItems(prev => [item, ...prev]);
        setIsAddModalOpen(false);
        resetAddForm();
        showToast('Item added to registry.', 'success');
    };

    const handleReserve = (id: string) => {
        setSelectedItemId(id);
        setIsReserveModalOpen(true);
    };

    const confirmReservation = () => {
        if (!selectedItemId) return;
        setItems(prev => prev.map(item => {
            if (item.id === selectedItemId) {
                return { ...item, isReserved: true, reservedBy: reserverName || 'Anonymous' };
            }
            return item;
        }));
        setIsReserveModalOpen(false);
        setSelectedItemId(null);
        setReserverName('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to remove this item?')) {
            setItems(prev => prev.filter(i => i.id !== id));
        }
    };

    const handleGenerateImage = async () => {
        if (!newItemUrl) {
            showToast('Add a product link to fetch an image.', 'info');
            return;
        }
        setIsGenerating(true);
        try {
            const fetchedImage = await fetchProductImage(newItemUrl);

            if (fetchedImage) {
                setNewItemImage(fetchedImage);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAutofill = async () => {
        if (!newItemUrl) {
            showToast('Paste a product link to autofill details.', 'info');
            return;
        }
        setIsGenerating(true);
        try {
            const details = await extractProductDetails(newItemUrl);
            if (details) {
                if (details.name) setNewItemName(details.name);
                if (details.imageUrl) setNewItemImage(details.imageUrl);
                if (!hidePrice && typeof details.price === 'number') {
                    setNewItemPrice(details.price.toFixed(2));
                }
                if (!hidePrice && details.currency) {
                    setNewItemCurrency(details.currency);
                }
            }
        } catch (e) {
            console.error("Autofill failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleLogout = async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } finally {
          window.location.href = '/parents';
        }
    };

    const filteredItems = items;

    return (
        <div className="min-h-screen pb-20">
            <Header isParentView={isParentView} onLogout={isParentView ? handleLogout : undefined} />

            <main className="max-w-3xl mx-auto px-4 py-6">
                {/* Hero Section for Parents */}
                {isParentView && (
                    <div className="mb-8 bg-baby-100 rounded-3xl p-6 sm:p-8 flex items-center justify-between shadow-sm">
                        <div>
                            <h1 className="text-2xl font-bold text-baby-900 mb-2">Manage Registry</h1>
                            <p className="text-baby-600">Add items, track gifts, and prepare for baby.</p>
                        </div>
                        <Button onClick={() => setIsAddModalOpen(true)} className="rounded-full h-12 w-12 !p-0 flex items-center justify-center shadow-lg hover:scale-105 transform transition">
                            <Plus size={24} />
                        </Button>
                    </div>
                )}

                {!isParentView && items.length > 0 && (
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Baby Wishlist</h1>
                        <p className="text-gray-500">Help us welcome our little one by reserving a gift.</p>
                    </div>
                )}

                {/* Items List */}
                {filteredItems.length > 0 ? (
                    <div className="grid gap-6">
                        {filteredItems.map(item => (
                            <ItemCard 
                                key={item.id} 
                                item={item} 
                                isParentView={isParentView}
                                onReserve={handleReserve} 
                                onDelete={handleDelete} 
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState isParentView={isParentView} onAddClick={() => setIsAddModalOpen(true)} />
                )}
            </main>

            {/* Add Item Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => {
                setIsAddModalOpen(false);
                resetAddForm();
            }} title="Add Item">
                <form onSubmit={handleAddItem} className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            label="Item URL" 
                            placeholder="Paste product link..." 
                            value={newItemUrl} 
                            onChange={e => setNewItemUrl(e.target.value)} 
                        />
                        <button 
                            type="button" 
                            onClick={handleAutofill} 
                            className="mt-6 px-3 py-3 rounded-xl bg-baby-100 text-baby-700 hover:bg-baby-200"
                            title="Autofill"
                        >
                            <Wand2 size={18} />
                        </button>
                    </div>
                    <Input 
                        label="Item Name" 
                        placeholder="e.g. Organic cotton onesie" 
                        value={newItemName} 
                        onChange={e => setNewItemName(e.target.value)} 
                        required 
                    />
                    <div className="flex gap-4">
                        <Input 
                            label="Price (optional)" 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="0.00" 
                            value={newItemPrice} 
                            onChange={e => setNewItemPrice(e.target.value)} 
                            disabled={hidePrice}
                        />
                        <Input
                            label="Currency (optional)"
                            placeholder="USD, EUR, GBP"
                            value={newItemCurrency}
                            onChange={e => setNewItemCurrency(e.target.value.toUpperCase())}
                            disabled={hidePrice}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={hidePrice}
                            onChange={(e) => {
                                setHidePrice(e.target.checked);
                                if (e.target.checked) {
                                    setNewItemPrice('');
                                    setNewItemCurrency('');
                                }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-baby-600 focus:ring-baby-500"
                        />
                        Hide price for this item
                    </label>
                    <Input 
                        label="Notes (optional)" 
                        placeholder="Add size, color, or other details" 
                        value={newItemNotes} 
                        onChange={e => setNewItemNotes(e.target.value)} 
                    />
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="secondary" onClick={handleGenerateImage} isLoading={isGenerating}>
                            <Sparkles size={16} className="mr-2" />
                            Fetch Image
                        </Button>
                        {newItemImage && (
                            <img src={newItemImage} alt="Preview" className="h-12 w-16 rounded-lg object-cover border" />
                        )}
                    </div>
                    <div className="pt-2 flex gap-3">
                        <Button type="submit" fullWidth>Add Item</Button>
                        <Button type="button" variant="secondary" fullWidth onClick={() => {
                            setIsAddModalOpen(false);
                            resetAddForm();
                        }}>Cancel</Button>
                    </div>
                </form>
            </Modal>

            {/* Reserve Item Modal */}
            <Modal isOpen={isReserveModalOpen} onClose={() => setIsReserveModalOpen(false)} title="Reserve Item">
                <div className="space-y-4">
                    <Input 
                        label="Your name (optional)" 
                        placeholder="Leave blank to stay anonymous" 
                        value={reserverName} 
                        onChange={e => setReserverName(e.target.value)} 
                    />
                    <div className="pt-2 flex gap-3">
                        <Button onClick={confirmReservation} fullWidth>Confirm Reservation</Button>
                        <Button variant="secondary" fullWidth onClick={() => setIsReserveModalOpen(false)}>Cancel</Button>
                    </div>
                </div>
            </Modal>

            {/* Share Button */}
            {!isParentView && items.length > 0 && (
                <div className="fixed bottom-6 right-6">
                    <Button 
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast('Link copied to clipboard!', 'success');
                        }} 
                        className="rounded-full h-14 w-14 !p-0 shadow-lg hover:scale-105 transform transition"
                    >
                        <Share2 size={20} />
                    </Button>
                </div>
            )}

            {/* Floating Add Button for Mobile */}
            {isParentView && (
                <div className="fixed bottom-6 right-6 sm:hidden">
                    <Button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="rounded-full h-14 w-14 !p-0 shadow-lg hover:scale-105 transform transition"
                    >
                        <Plus size={24} />
                    </Button>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-full text-sm font-medium shadow-lg ${
                    toast.type === 'success' ? 'bg-green-600 text-white' :
                    toast.type === 'error' ? 'bg-red-600 text-white' :
                    'bg-gray-900 text-white'
                }`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default WishlistApp;
