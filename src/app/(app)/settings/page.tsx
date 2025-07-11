
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Icon from '@/components/shared/icon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { getFirestore, collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import Modal from '@/components/shared/modal';
import { Switch } from '@/components/ui/switch';

// Types
type Address = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
};

type PaymentMethod = {
  id: string;
  type: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
};

type Order = {
  id: string;
  createdAt: { toDate: () => Date };
  status: string;
  total: number;
  tracking?: string;
  items: any[];
};

const AddressForm = ({ address, onSave, onCancel }: { address?: Address | null, onSave: (addr: Omit<Address, 'id'>) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState({
        name: address?.name || '',
        address: address?.address || '',
        city: address?.city || '',
        state: address?.state || '',
        zip: address?.zip || '',
        country: address?.country || '',
        isDefault: address?.isDefault || false,
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData({ ...formData, isDefault: checked });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
             <div className="space-y-2">
                <Label htmlFor="name">Label (e.g., Home, Work)</Label>
                <Input id="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={formData.address} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input id="state" value={formData.state} onChange={handleChange} required />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="zip">ZIP / Postal Code</Label>
                    <Input id="zip" value={formData.zip} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={formData.country} onChange={handleChange} required />
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="isDefault" checked={formData.isDefault} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="isDefault">Set as default address</Label>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Address</Button>
            </div>
        </form>
    );
};


export default function SettingsPage() {
    const { user } = useApp();
    const { toast } = useToast();
    const db = useMemo(() => getFirestore(firebaseApp), []);

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]); // Mock for now

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    // Fetch Addresses
    useEffect(() => {
        if (!user) return;
        const addressesCol = collection(db, 'users', user.uid, 'addresses');
        const unsubscribe = onSnapshot(addressesCol, snapshot => {
            const fetchedAddresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
            setAddresses(fetchedAddresses);
        });
        return unsubscribe;
    }, [user, db]);

    // Fetch Orders
    useEffect(() => {
        if (!user) return;
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(ordersQuery, snapshot => {
            const fetchedOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            fetchedOrders.sort((a,b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
            setOrders(fetchedOrders);
        });
        return unsubscribe;
    }, [user, db]);

    const handleSaveAddress = useCallback(async (addressData: Omit<Address, 'id'>) => {
        if (!user) return;
        try {
            const addressesCol = collection(db, 'users', user.uid, 'addresses');
            if (editingAddress) {
                // Update
                const addressRef = doc(db, 'users', user.uid, 'addresses', editingAddress.id);
                await updateDoc(addressRef, addressData);
                toast({ title: 'Success', description: 'Address updated successfully.' });
            } else {
                // Create
                await addDoc(addressesCol, addressData);
                toast({ title: 'Success', description: 'New address added.' });
            }
            setIsAddressModalOpen(false);
            setEditingAddress(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save address.' });
        }
    }, [user, db, editingAddress, toast]);

    const handleDeleteAddress = useCallback(async (addressId: string) => {
        if (!user) return;
        try {
            const addressRef = doc(db, 'users', user.uid, 'addresses', addressId);
            await deleteDoc(addressRef);
            toast({ title: 'Address Removed' });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Error', description: 'Could not remove address.' });
        }
    }, [user, db, toast]);
    
    // Mock Payment data for now
    useEffect(() => {
        setPaymentMethods([
            { id: 'pm_1', type: 'Visa', last4: '4242', expiry: '08/26', isDefault: true }
        ]);
    }, []);

    const getStatusVariant = useCallback((status: string) => {
        switch (status.toLowerCase()) {
            case 'shipped': return 'default';
            case 'processing': return 'secondary';
            case 'delivered': return 'outline';
            default: return 'outline';
        }
    }, []);

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <Modal 
                isOpen={isAddressModalOpen} 
                onClose={() => { setIsAddressModalOpen(false); setEditingAddress(null); }}
                title={editingAddress ? "Edit Address" : "Add New Address"}
            >
                <AddressForm
                    address={editingAddress}
                    onSave={handleSaveAddress}
                    onCancel={() => { setIsAddressModalOpen(false); setEditingAddress(null); }}
                />
            </Modal>
            <header className="mb-8">
                <h1 className="text-h1 font-headline flex items-center gap-3"><Icon name="Settings" /> Account Settings</h1>
                <p className="text-muted-foreground mt-1 text-body">Manage your profile, addresses, and order history.</p>
            </header>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile"><Icon name="UserCircle" /> Profile</TabsTrigger>
                    <TabsTrigger value="shipping"><Icon name="Home" /> Shipping</TabsTrigger>
                    <TabsTrigger value="billing"><Icon name="CreditCard" /> Billing</TabsTrigger>
                    <TabsTrigger value="orders"><Icon name="Package" /> Order History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your account details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
                            </div>
                             <div className="border-t pt-6 space-y-4">
                                 <h3 className="text-lg font-semibold">Change Password</h3>
                                 <p className="text-sm text-muted-foreground">Password changes are handled by your authentication provider.</p>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="shipping" className="mt-6">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>Shipping Addresses</CardTitle>
                                <CardDescription>Manage your saved addresses for faster checkout.</CardDescription>
                            </div>
                            <Button onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }}><Icon name="PlusCircle" /> Add New Address</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {addresses.length > 0 ? addresses.map(addr => (
                                <div key={addr.id} className="p-4 rounded-lg border flex justify-between items-start bg-muted/50">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-semibold">{addr.name}</p>
                                            {addr.isDefault && <Badge>Default</Badge>}
                                        </div>
                                        <p className="text-muted-foreground text-sm">{`${addr.address}, ${addr.city}, ${addr.state} ${addr.zip}, ${addr.country}`}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => { setEditingAddress(addr); setIsAddressModalOpen(true); }}>Edit</Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteAddress(addr.id)}><Icon name="Trash2" /> Delete</Button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No saved addresses.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="mt-6">
                     <Card>
                        <CardHeader  className="flex-row items-center justify-between">
                             <div>
                                <CardTitle>Payment Methods</CardTitle>
                                <CardDescription>Your payment is securely handled by our checkout partner.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground text-center py-8">
                                <p>You will be redirected to our secure payment processor to add billing information during checkout.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="orders" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order History</CardTitle>
                            <CardDescription>Review your past purchases.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Tracking</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.length > 0 ? orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium text-xs">{order.id}</TableCell>
                                            <TableCell>{order.createdAt.toDate().toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(order.status)}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>${order.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                                {order.tracking ? (
                                                  <Link href="#" className="text-primary hover:underline font-mono text-sm">{order.tracking}</Link>
                                                ) : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">You haven't placed any orders yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

    