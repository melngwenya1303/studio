
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

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

type Order = {
  id: string;
  createdAt: { toDate: () => Date };
  status: string;
  total: number;
  tracking?: string;
  items: any[];
};

const mockCreatorAnalytics = {
    totalCreations: 128,
    totalLikes: 4300,
    totalSales: 152,
    topDesigns: [
        { name: 'Bioluminescent Stag', sales: 45 },
        { name: 'Cyberpunk Alley', sales: 31 },
        { name: 'Astronaut Discovery', sales: 25 },
        { name: 'Zen Garden Koi', sales: 18 },
        { name: 'Steampunk Owl', sales: 11 },
    ]
}


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


export default function CreatorAdminPage() {
    const { user } = useApp();
    const { toast } = useToast();
    const db = useMemo(() => getFirestore(firebaseApp), []);

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    
    // POD Partner State
    const [podPartners, setPodPartners] = useState([
        { id: '1', name: 'Printify', apiKey: '...key1' },
        { id: '2', name: 'Printful', apiKey: '...key2' }
    ]);
    const [newPartnerName, setNewPartnerName] = useState('');
    const [newPartnerApiKey, setNewPartnerApiKey] = useState('');
    const [partnerToDelete, setPartnerToDelete] = useState<{id: string, name: string} | null>(null);
    const [partnerToEdit, setPartnerToEdit] = useState<{id: string, name: string} | null>(null);
    const [newlyAddedPartner, setNewlyAddedPartner] = useState<{id: string, name: string, apiKey: string} | null>(null);

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
    
    const getStatusVariant = useCallback((status: string) => {
        switch (status.toLowerCase()) {
            case 'shipped': return 'default';
            case 'processing': return 'secondary';
            case 'delivered': return 'outline';
            default: return 'outline';
        }
    }, []);

    const handleAddOrUpdatePartner = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!newPartnerName.trim() || !newPartnerApiKey.trim()) return;

        if (partnerToEdit) {
            setPodPartners(prev => prev.map(p => p.id === partnerToEdit.id ? {...p, apiKey: newPartnerApiKey} : p));
            toast({ title: 'Success!', description: `API Key for ${partnerToEdit.name} has been updated.`});
            setPartnerToEdit(null);
        } else {
            const newPartner = { id: crypto.randomUUID(), name: newPartnerName.trim(), apiKey: newPartnerApiKey.trim() };
            setPodPartners(prev => [...prev, newPartner]);
            setNewlyAddedPartner(newPartner);
        }

        setNewPartnerName('');
        setNewPartnerApiKey('');
    }, [newPartnerName, newPartnerApiKey, partnerToEdit, toast]);

    const handleDeletePodPartner = useCallback((id: string) => {
        setPodPartners(prev => prev.filter(p => p.id !== id));
        setPartnerToDelete(null);
        toast({ title: 'Integration Removed', description: 'The POD partner has been successfully removed.' });
    }, [toast]);

     const handleCopyKey = useCallback(() => {
        if (!newlyAddedPartner) return;
        navigator.clipboard.writeText(newlyAddedPartner.apiKey);
        toast({ title: 'Copied!', description: 'The API key has been copied to your clipboard.' });
    }, [newlyAddedPartner, toast]);

    return (
        <div className="p-4 md:p-8 animate-fade-in">
             <AlertDialog open={!!partnerToDelete} onOpenChange={() => setPartnerToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><Icon name="Trash2" /> Delete Integration?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the {partnerToDelete?.name} integration and immediately stop all related operations. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeletePodPartner(partnerToDelete!.id)}>Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Modal isOpen={!!partnerToEdit} onClose={() => setPartnerToEdit(null)} title={`Rotate API Key for ${partnerToEdit?.name}`}>
                 <form onSubmit={handleAddOrUpdatePartner} className="space-y-4 pt-4">
                     <p className="text-sm text-muted-foreground">Enter the new API key below. The old key will be immediately invalidated.</p>
                    <Input type="password" value={newPartnerApiKey} onChange={(e) => setNewPartnerApiKey(e.target.value)} placeholder="Enter new API Key" className="text-base" />
                    <Button type="submit" className="w-full"><Icon name="KeyRound" /> Update Key</Button>
                </form>
            </Modal>
             <Modal isOpen={!!newlyAddedPartner} onClose={() => setNewlyAddedPartner(null)} title={`Integration Added: ${newlyAddedPartner?.name}`}>
                <div className="space-y-4 pt-2">
                    <p className="p-3 text-sm bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded-lg border border-yellow-200 dark:border-yellow-800/60">
                      <strong className="font-semibold block mb-1">Security Warning</strong>
                      For your security, this key will not be shown again. Please copy it now and store it in a secure location.
                    </p>
                    <div className="flex items-center gap-2">
                        <Input readOnly value={newlyAddedPartner?.apiKey} className="font-mono text-xs" />
                        <Button onClick={handleCopyKey} size="icon" variant="outline"><Icon name="Copy" /></Button>
                    </div>
                     <Button onClick={() => setNewlyAddedPartner(null)} className="w-full">I have saved my key</Button>
                </div>
            </Modal>
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
                <h1 className="text-h1 font-headline flex items-center gap-3"><Icon name="Settings" /> Creator Admin</h1>
                <p className="text-muted-foreground mt-1 text-body">Manage your profile, integrations, sales, and analytics.</p>
            </header>

            <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="analytics"><Icon name="PieChart" /> Analytics</TabsTrigger>
                    <TabsTrigger value="profile"><Icon name="UserCircle" /> Profile</TabsTrigger>
                    <TabsTrigger value="integrations"><Icon name="KeyRound" /> Integrations</TabsTrigger>
                    <TabsTrigger value="shipping"><Icon name="Home" /> Shipping</TabsTrigger>
                    <TabsTrigger value="orders"><Icon name="Package" /> Order History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analytics" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Creations</CardTitle>
                                <Icon name="Brush" className="text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{mockCreatorAnalytics.totalCreations}</div>
                                <p className="text-xs text-muted-foreground">+15 from last month</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                                <Icon name="Heart" className="text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{mockCreatorAnalytics.totalLikes.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">+25% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                <Icon name="ShoppingCart" className="text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{mockCreatorAnalytics.totalSales}</div>
                                <p className="text-xs text-muted-foreground">+10 from last month</p>
                            </CardContent>
                        </Card>
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Top Performing Designs</CardTitle>
                            <CardDescription>Your most popular designs by sales.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={mockCreatorAnalytics.topDesigns} layout="vertical">
                                    <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                                    <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        width={120} 
                                        stroke="#888888" 
                                        fontSize={12} 
                                        tickLine={false} 
                                        axisLine={false} 
                                    />
                                    <Tooltip
                                      cursor={{ fill: 'hsla(var(--muted))' }}
                                      contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)"
                                      }}
                                    />
                                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your account details here. This information may be displayed publicly.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Display Name</Label>
                                <Input id="displayName" defaultValue={user?.name || ''} />
                            </div>
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

                <TabsContent value="integrations" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Icon name="KeyRound" /> POD Partner Integrations</CardTitle>
                            <CardDescription>Manage API keys for Shopify and other Print-on-Demand partners.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddOrUpdatePartner} className="space-y-3 mb-4 p-4 border rounded-lg">
                                 <Input type="text" value={newPartnerName} onChange={(e) => setNewPartnerName(e.target.value)} placeholder="Partner Name (e.g., Shopify, Printify)" className="text-base"/>
                                <Input type="password" value={newPartnerApiKey} onChange={(e) => setNewPartnerApiKey(e.target.value)} placeholder="Partner API Key" className="text-base" />
                                <Button type="submit" className="w-full"><Icon name="PlusCircle" /> Add New Partner</Button>
                            </form>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                {podPartners.length > 0 ? podPartners.map(partner => (
                                     <div key={partner.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                                        <p className="font-semibold">{partner.name}</p>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" onClick={() => { setPartnerToEdit(partner); setNewPartnerApiKey('')}}>
                                                <Icon name="RefreshCcw" /> Rotate Key
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setPartnerToDelete(partner)}>
                                                <Icon name="Trash2" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground text-center py-4">No fulfillment partners configured.</p>}
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
                
                <TabsContent value="orders" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Order History</CardTitle>
                            <CardDescription>Review all your past purchases and sales.</CardDescription>
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

    