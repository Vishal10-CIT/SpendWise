import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { watchlistApi } from '../../services/api';
import { useToast } from '../common/Toast';
import { Sparkles } from 'lucide-react';

interface AddWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddWatchlistModal: React.FC<AddWatchlistModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [productName, setProductName] = useState<string>('');
  const [productUrl, setProductUrl] = useState<string>('');
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [storeSource, setStoreSource] = useState<string>('');
  const [purchaseDeadline, setPurchaseDeadline] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const autoDetectStore = (url: string) => {
    setProductUrl(url);
    const lower = url.toLowerCase();
    if (lower.includes('amazon.')) setStoreSource('Amazon');
    else if (lower.includes('flipkart.')) setStoreSource('Flipkart');
    else if (lower.includes('myntra.')) setStoreSource('Myntra');
    else if (lower.includes('croma.')) setStoreSource('Croma');
    else if (lower.includes('apple.')) setStoreSource('Apple Store');
    else if (lower.includes('bestbuy.')) setStoreSource('Best Buy');
    else if (lower.includes('ebay.')) setStoreSource('eBay');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(targetPrice);

    if (!productName.trim()) {
      setError('Please provide a product name.');
      return;
    }
    if (!productUrl.trim() || !productUrl.startsWith('http')) {
      setError('Please provide a valid HTTP/HTTPS product URL.');
      return;
    }
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid positive target price.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await watchlistApi.createWatchlistItem({
        product_name: productName.trim(),
        product_url: productUrl.trim(),
        target_price: numPrice,
        store_source: storeSource.trim() || undefined,
        purchase_deadline: purchaseDeadline || undefined,
        notes: notes.trim() || undefined,
      });
      showToast(`'${productName}' added to Purchase Watchlist!`, 'success');
      onSuccess();
      onClose();
      // Reset
      setProductName('');
      setProductUrl('');
      setTargetPrice('');
      setStoreSource('');
      setPurchaseDeadline('');
      setNotes('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add product to watchlist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Product to Purchase Watchlist"
      subtitle="Track headphones, laptops, sneakers, or gadgets until they drop to your target price"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Product Name"
          placeholder="e.g. Sony WH-1000XM5, Mechanical Keyboard, iPad Air"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Product Store URL"
          placeholder="https://amazon.in/dp/... or https://flipkart.com/..."
          value={productUrl}
          onChange={(e) => autoDetectStore(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Target Price (₹)"
            type="number"
            step="0.01"
            min="1"
            placeholder="e.g. 19999"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            required
          />

          <Input
            label="Store / Source"
            placeholder="e.g. Amazon, Flipkart, Myntra"
            value={storeSource}
            onChange={(e) => setStoreSource(e.target.value)}
          />
        </div>

        <Input
          label="Desired Purchase Deadline (Optional)"
          type="date"
          value={purchaseDeadline}
          onChange={(e) => setPurchaseDeadline(e.target.value)}
        />

        <Input
          label="Notes (Optional)"
          placeholder="e.g. Waiting for Diwali festive discounts, Black color variant"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} leftIcon={<Sparkles className="w-4 h-4" />}>
            Start Tracking
          </Button>
        </div>
      </form>
    </Modal>
  );
};
