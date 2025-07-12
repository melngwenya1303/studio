
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/shared/icon';
import { useToast } from '@/hooks/use-toast';
import { fulfillOrder } from '@/ai/flows/fulfill-order';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function CheckoutPage() {
    const { user, cart } = useApp();
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const cartItem = cart[0]; // For now, we handle a single item checkout

    const handleProceedToCheckout = async () => {
        if (!cartItem || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in and have an item in your cart.'});
            return;
        }

        setIsLoading(true);

        try {
            // In a real app, this data would come from the form
            const orderInput = {
                orderId: `SS-${Date.now()}`,
                customerName: user.email || 'Valued Customer',
                shippingAddress: '123 Creator Lane, Artville, CA 90210',
                imageUrl: cartItem.url, // This should be a public URL or data URI
                productType: `${cartItem.deviceType} Decal`,
                podPartner: 'Printify', // This could be selected based on product/region
            };

            const result = await fulfillOrder(orderInput);

            if (result.success) {
                toast({ title: 'Order Submitted!', description: `Your order is being processed. Confirmation: ${result.confirmationNumber}` });
                router.push('/shopify-redirect');
            } else {
                toast({ variant: 'destructive', title: 'Order Failed', description: result.message });
            }

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Checkout Error', description: error.message || 'An unexpected error occurred.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!cartItem) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Icon name="ShoppingCart" className="w-24 h-24 text-muted-foreground mb-6" />
                <h1 className="text-h1 font-headline">Your Cart is Empty</h1>
                <p className="text-muted-foreground mt-2 mb-6">Looks like you haven't added any designs to your cart yet.</p>
                <Button onClick={() => router.push('/design-studio')}>Start Creating</Button>
            </div>
        );
    }
    
    // Mock pricing
    const price = 29.99;
    const shipping = 4.99;
    const taxes = (price + shipping) * 0.08; // 8% tax
    const total = price + shipping + taxes;

    return (
        <div className="p-4 md:p-8 animate-fade-in max-w-6xl mx-auto">
            <header className="mb-8">
                <h1 className="text-h1 font-headline flex items-center gap-3"><Icon name="ShoppingCart" /> Review Your Order</h1>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Summary */}
                <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-1 lg:order-last"
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="relative w-24 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                    <Image src={cartItem.url} alt={cartItem.title} fill className="object-cover" />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold">{cartItem.title || 'Custom Design'}</p>
                                    <p className="text-sm text-muted-foreground">{cartItem.deviceType} Decal</p>
                                    <p className="text-sm text-muted-foreground">Style: {cartItem.style}</p>
                                </div>
                                <p className="font-semibold">${price.toFixed(2)}</p>
                            </div>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Subtotal</p>
                                    <p>${price.toFixed(2)}</p>
                                </div>
                                <div className="flex justify-between">
                                    <p className="text-muted-foreground">Shipping</p>
                                    <p>${shipping.toFixed(2)}</p>
                                </div>
                                 <div className="flex justify-between">
                                    <p className="text-muted-foreground">Est. Taxes</p>
                                    <p>${taxes.toFixed(2)}</p>
                                </div>
                            </div>
                            <Separator />
                             <div className="flex justify-between font-bold text-lg">
                                <p>Total</p>
                                <p>${total.toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                
                {/* Shipping and Payment */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-2 space-y-8"
                >
                     {!user && (
                        <Alert variant="destructive">
                            <Icon name="Ban" />
                            <AlertTitle>You're not signed in!</AlertTitle>
                            <AlertDescription>
                                Please sign in or create an account to proceed with your order.
                            </AlertDescription>
                        </Alert>
                    )}
                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping Address</CardTitle>
                             <CardDescription>Where should we send your creation?</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" placeholder="Jane Doe" defaultValue="Jane Doe" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" placeholder="123 Creator Lane" defaultValue="123 Creator Lane" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" placeholder="Artville" defaultValue="Artville" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">State / Province</Label>
                                <Input id="state" placeholder="CA" defaultValue="CA" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="zip">ZIP / Postal Code</Label>
                                <Input id="zip" placeholder="90210" defaultValue="90210" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" placeholder="United States" defaultValue="United States" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Button onClick={handleProceedToCheckout} size="lg" className="w-full text-lg" disabled={!user || isLoading}>
                        {isLoading ? <><Icon name="Wand2" className="animate-pulse" /> Processing...</> : <><Icon name="ShieldCheck" /> Proceed to Secure Checkout</>}
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
