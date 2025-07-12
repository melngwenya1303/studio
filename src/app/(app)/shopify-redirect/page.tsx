
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';

export default function ShopifyRedirectPage() {
    const router = useRouter();
    const { clearCart } = useApp();

    useEffect(() => {
        // Clear the app's cart
        clearCart();

        // Simulate a delay for the backend to create a Shopify checkout link
        const timer = setTimeout(() => {
            // In a real application, this would be a dynamic URL from your server
            const shopifyCheckoutUrl = 'https://your-shopify-store.myshopify.com/cart/12345:1';
            window.location.href = shopifyCheckoutUrl;
        }, 2500);

        return () => clearTimeout(timer);
    }, [router, clearCart]);

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-background">
            <div className="flex items-center gap-4 mb-6">
                <motion.div
                    className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    >
                    <Icon name="Wand2" className="w-7 h-7 text-white" />
                </motion.div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <path d="M4 12H20M20 12L14 6M20 12L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <svg viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-[#5a8e63]">
                    <path d="M36.13.04C28.01.04 22.8 5.03 20.92 9.01c-1.1-2.2-2.3-4.2-4.5-5.9-2.9-2.3-6.6-3.11-10.5-3.11C2.52.01 0 .23 0 .23l.11 3.5c3.2-.21 5.9.32 8.3 1.91 3.3 2.2 4.9 5.8 4.9 5.8l-6.2 16.5.6 1.7s12.5-3.3 14-3.8c2.1-.8 3.5-2.2 3.5-4.5 0-2.3-1.4-3.6-3.5-4.5-2.1-.8-14-3.8-14-3.8l2.2-5.7s5.1 1.7 8.6 1.7c3.4 0 7.2-2.3 8.3-4.4 2.1-4.2 2.3-9.5-2.7-12.8-2.6-1.7-6-2.2-8.8-2.2h-.1c-1.2 0-2.4.2-3.5.6s-2.1.9-3.1 1.6c-2.7 1.9-4.2 4.7-4.2 4.7l-2.4-6.3S17.46 0 21.76 0c4.31 0 7.82 2.7 9.22 5.5 2.1 4.2 1.1 9.7-2.7 12.9-2.9 2.4-6.8 3.1-10.8 3.1-3.1 0-5.8-.5-5.8-.5l6.2 16.5s-1 .2-1.2.3c-.2.1 2.2 5.7 2.2 5.7s2.5-.5 4.5-1.5c4.2-2.1 6.3-6.5 6.3-6.5l8.6-22.6C42 1.34 39.83.04 36.13.04z" fill="currentColor"/>
                </svg>
            </div>
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-h1 font-headline mb-2">Finalizing Your Creation...</h1>
                <p className="text-muted-foreground max-w-md mx-auto text-body">
                    Please wait while we prepare your order. You will be redirected to our secure Shopify checkout page to complete your purchase.
                </p>
            </motion.div>
            
            <div className="mt-8 w-full max-w-sm">
                 <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.5, ease: 'linear' }}
                    />
                </div>
            </div>
        </div>
    );
}
