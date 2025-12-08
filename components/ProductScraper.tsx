import React, { useState } from 'react';
import { scrapeProductDetailsFromUrl } from '../services/geminiService';
import type { UploadedFile, ScrapedProductDetails } from '../types';
import { ProductSelectionModal } from './ProductSelectionModal';
import { MagnifyingGlassIcon } from './icons';
import { useUI } from '../context/UIContext';

interface ProductScraperProps {
  onProductScraped: (data: { name: string, description: string, file: UploadedFile | null, url: string }) => void;
  setIsLoading: (isLoading: boolean) => void;
  setStatusMessages: (messages: string[]) => void;
  setError: (error: string | null) => void;
  initialUrl?: string;
}

export const ProductScraper: React.FC<ProductScraperProps> = ({ onProductScraped, setIsLoading, setStatusMessages, setError, initialUrl = '' }) => {
    const { openProductSelectionModal } = useUI();
    const [url, setUrl] = useState(initialUrl);
    const [isScraping, setIsScraping] = useState(false);

    const handleScrape = async () => {
        if (!url) return;
        setIsScraping(true);
        setError(null);
        setStatusMessages(['Scraping product info...']);
        setIsLoading(true);

        try {
            const products = await scrapeProductDetailsFromUrl(url);
            
            if (products.length === 0) {
                throw new Error("No products found at that URL.");
            } else if (products.length === 1) {
                await handleProductSelection(products[0]);
            } else {
                const selectedProduct = await openProductSelectionModal(products);
                if (selectedProduct) {
                    await handleProductSelection(selectedProduct);
                } else {
                    // User closed the modal without selecting
                    setIsScraping(false);
                }
            }
        } catch (e: any) {
            setError(e.message || "Failed to retrieve product information.");
            setIsScraping(false);
        } finally {
            setIsLoading(false);
            setStatusMessages([]);
        }
    };

    const handleProductSelection = async (product: ScrapedProductDetails) => {
        setError(null);
        
        onProductScraped({
            name: product.productName,
            description: product.productDescription,
            file: null, // Image fetching is handled by the parent context
            url: url,
        });
        
        setIsScraping(false);
    };

    return (
        <div>
            <label htmlFor="productUrl" className="block mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Import from URL</label>
            <div className="flex gap-2">
                <input
                    id="productUrl"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter your product page URL..."
                    className="w-full p-3 border rounded-lg bg-transparent dark:border-gray-600 dark:placeholder-gray-600 input-focus-brand force-bg-black"
                />
                <button
                    onClick={handleScrape}
                    disabled={isScraping || !url}
                    className="px-4 py-2 bg-brand-accent text-on-accent font-bold rounded-lg hover:bg-brand-accent-hover transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                    {isScraping ? (
                        <div className="w-5 h-5 border-2 border-current dark:border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <MagnifyingGlassIcon className="w-5 h-5" />
                    )}
                    Retrieve
                </button>
            </div>
        </div>
    );
};