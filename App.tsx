import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Baby, Settings, Plus, X, Search, Sparkles, Share2, Wand2 } from 'lucide-react';
import { WishlistItem, ItemCategory, ToastMessage } from './types';
import { ItemCard } from './components/ItemCard';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { generateProductImage, suggestCategory, extractProductDetails } from './services/geminiService';

// --- Helper Hook for LocalStorage ---
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

// --- Components ---

const Header: React.FC<{ isParentView: boolean }> = ({ isParentView }) => (
  <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
    <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center space-x-2 text-baby-900">
        <div className="bg-baby-200 p-2 rounded-full">
            <Baby size={24} className="text-baby-600" />
        </div>
        <span className="font-bold text-lg tracking-tight">StorkDrop</span>
      </Link>
      <div className="flex items-center space-x-2">
        {!isParentView && (
           <Link to="/parents" className="p-2 text-gray-400 hover:text-baby-600 transition-colors">
             <Settings size={20} />
           </Link>
        )}
        {isParentView && (
            <Link to="/" className="text-sm font-medium text-baby-600 bg-baby-50 px-3 py-1.5 rounded-lg">
                View as Guest
            </Link>
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

const AppContent: React.FC = () => {
    const location = useLocation();
    const isParentView = location.pathname === '/parents';

    // State
    const [items, setItems] = useStickyState<WishlistItem[]>([], 'storkdrop-items');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('All');
    
    // Add Item Form State
    const [newItemName, setNewItemName] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');
    const [newItemCategory, setNewItemCategory] = useState<ItemCategory>(ItemCategory.OTHER);
    const [newItemImage, setNewItemImage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [newItemNotes, setNewItemNotes] = useState('');

    // Reserve Form State
    const [reserverName, setReserverName] = useState('');

    // Handlers
    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const item: WishlistItem = {
            id: Date.now().toString(),
            name: newItemName,
            url: newItemUrl || undefined,
            price: newItemPrice ? parseFloat(newItemPrice) : undefined,
            category: newItemCategory,
            imageUrl: newItemImage || undefined,
            notes: newItemNotes || undefined,
            isReserved: false,
            reservedBy: null,
            createdAt: Date.now()
        };
        setItems(prev => [item, ...prev]);
        closeAddModal();
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setNewItemName('');
        setNewItemUrl('');
        setNewItemPrice('');
        setNewItemCategory(ItemCategory.OTHER);
        setNewItemImage('');
        setNewItemNotes('');
    };

    const handleReserveClick = (id: string) => {
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
        if (!newItemName) return;
        setIsGenerating(true);
        try {
            // Parallel execution for better UX
            const [generatedImage, suggestedCat] = await Promise.all([
                generateProductImage(newItemName, newItemCategory),
                suggestCategory(newItemName)
            ]);

            if (generatedImage) {
                setNewItemImage(generatedImage);
            }
            if (suggestedCat && Object.values(ItemCategory).includes(suggestedCat as ItemCategory)) {
                setNewItemCategory(suggestedCat as ItemCategory);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAutofill = async () => {
        if (!newItemUrl) return;
        setIsGenerating(true);
        try {
            const details = await extractProductDetails(newItemUrl);
            if (details) {
                setNewItemName(details.name);
                if (Object.values(ItemCategory).includes(details.category as ItemCategory)) {
                    setNewItemCategory(details.category as ItemCategory);
                }
                
                // Chain image generation with the extracted details
                const image = await generateProductImage(details.name, details.category);
                if (image) {
                    setNewItemImage(image);
                }
            }
        } catch (e) {
            console.error("Autofill failed", e);
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredItems = items.filter(item => {
        if (filterCategory === 'All') return true;
        return item.category === filterCategory;
    });

    // Categories for filter chips
    const categories = ['All', ...Object.values(ItemCategory)];

    return (
        <div className="min-h-screen pb-20">
            <Header isParentView={isParentView} />

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

                {/* Filters */}
                {items.length > 0 && (
                    <div className="flex overflow-x-auto no-scrollbar space-x-2 mb-6 pb-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                    filterCategory === cat 
                                    ? 'bg-baby-900 text-white shadow-md' 
                                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                {items.length === 0 ? (
                    <EmptyState isParentView={isParentView} onAddClick={() => setIsAddModalOpen(true)} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {filteredItems.map(item => (
                            <ItemCard 
                                key={item.id} 
                                item={item} 
                                isParentView={isParentView}
                                onReserve={handleReserveClick}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Add Item Modal */}
            <Modal isOpen={isAddModalOpen} onClose={closeAddModal} title="Add to Registry">
                <form onSubmit={handleAddItem} className="space-y-4">
                     {/* URL Input First */}
                     <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Product Link</label>
                            {newItemUrl && (
                                <button 
                                    type="button" 
                                    onClick={handleAutofill}
                                    disabled={isGenerating}
                                    className="text-xs flex items-center text-baby-600 hover:text-baby-800 font-medium disabled:opacity-50"
                                >
                                    <Wand2 size={14} className="mr-1" />
                                    {isGenerating ? 'Analyzing...' : 'Auto-fill from Link'}
                                </button>
                            )}
                        </div>
                        <Input 
                            placeholder="Paste URL first to auto-fill..." 
                            type="url"
                            value={newItemUrl}
                            onChange={e => setNewItemUrl(e.target.value)}
                        />
                    </div>

                    <div>
                        <Input 
                            label="Item Name"
                            placeholder="e.g. Ergonomic Stroller" 
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <Input 
                            label="Price (Optional)"
                            type="number" 
                            placeholder="0.00" 
                            min="0"
                            step="0.01"
                            value={newItemPrice}
                            onChange={e => setNewItemPrice(e.target.value)}
                        />
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <div className="relative">
                                <select 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-baby-500 focus:ring-2 focus:ring-baby-200 focus:outline-none bg-white transition-all appearance-none text-gray-900"
                                    value={newItemCategory}
                                    onChange={e => setNewItemCategory(e.target.value as ItemCategory)}
                                >
                                    {Object.values(ItemCategory).map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">Image URL</label>
                            {newItemName && (
                                <button 
                                    type="button" 
                                    onClick={handleGenerateImage}
                                    disabled={isGenerating}
                                    className="text-xs flex items-center text-purple-600 hover:text-purple-800 font-medium disabled:opacity-50"
                                >
                                    <Sparkles size={14} className="mr-1" />
                                    {isGenerating ? 'Generating...' : 'Regenerate Image'}
                                </button>
                            )}
                        </div>
                        <Input 
                            placeholder="https://example.com/image.jpg" 
                            value={newItemImage}
                            onChange={e => setNewItemImage(e.target.value)}
                        />
                        {newItemImage && (
                            <div className="mt-2 h-32 w-full bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                <img src={newItemImage} alt="Preview" className="h-full w-full object-contain" />
                            </div>
                        )}
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Size, Color, etc.)</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-baby-500 focus:ring-2 focus:ring-baby-200 focus:outline-none transition-all resize-none h-20 text-gray-900 placeholder-gray-400"
                            placeholder="e.g. Size 3-6 months, Mint Green"
                            value={newItemNotes}
                            onChange={e => setNewItemNotes(e.target.value)}
                        />
                    </div>

                    <div className="pt-2">
                        <Button type="submit" fullWidth>Add Item</Button>
                    </div>
                </form>
            </Modal>

            {/* Reserve Modal */}
            <Modal isOpen={isReserveModalOpen} onClose={() => setIsReserveModalOpen(false)} title="Reserve Gift">
                <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                        Reserving this item lets others know it's taken. You can leave your name or stay anonymous.
                    </p>
                    <Input 
                        label="Your Name (Optional)"
                        placeholder="Leave blank for Anonymous" 
                        value={reserverName}
                        onChange={e => setReserverName(e.target.value)}
                    />
                    <div className="pt-2 flex space-x-3">
                         <Button 
                            variant="secondary" 
                            fullWidth 
                            onClick={() => setIsReserveModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button fullWidth onClick={confirmReservation}>
                            Confirm Reservation
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/parents" element={<AppContent />} />
        </Routes>
    </Router>
  );
}

export default App;