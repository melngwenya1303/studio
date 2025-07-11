
'use client';

import React, { useState } from 'react';
import Icon from '@/components/shared/icon';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Mock Data
const mockUser = {
  name: 'Creative User',
  email: 'user@surfacestory.com',
};

const mockAddresses = [
  { id: 1, name: 'Home', address: '123 Creator Lane, Artville, CA 90210', isDefault: true },
  { id: 2, name: 'Work', address: '456 Design Drive, Metropia, NY 10001', isDefault: false },
];

const mockPaymentMethods = [
    { id: 1, type: 'Visa', last4: '4242', expiry: '08/26', isDefault: true }
];

const mockOrders = [
  { id: 'SS-1024', date: '2023-10-26', status: 'Shipped', total: '$34.98', tracking: '#1Z999AA10123456789' },
  { id: 'SS-1023', date: '2023-09-15', status: 'Delivered', total: '$29.99', tracking: '#1Z999AA10123456788' },
];


export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-h1 font-headline flex items-center gap-3"><Icon name="Settings" /> Account Settings</h1>
                <p className="text-muted-foreground mt-1 text-body">Manage your profile, addresses, and order history.</p>
            </header>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile"><Icon name="UserPlus" /> Profile</TabsTrigger>
                    <TabsTrigger value="shipping"><Icon name="Home" /> Shipping</TabsTrigger>
                    <TabsTrigger value="billing"><Icon name="KeyRound" /> Billing</TabsTrigger>
                    <TabsTrigger value="orders"><Icon name="Box" /> Order History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your account details here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" defaultValue={mockUser.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" defaultValue={mockUser.email} />
                            </div>
                             <Button>Update Profile</Button>
                             <div className="border-t pt-6 space-y-4">
                                 <h3 className="text-lg font-semibold">Change Password</h3>
                                 <div className="space-y-2">
                                    <Label htmlFor="current-password">Current Password</Label>
                                    <Input id="current-password" type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" />
                                </div>
                                <Button variant="outline">Set New Password</Button>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="shipping" className="mt-6">
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <CardTitle>Shipping Addresses</CardTitle>
                                <CardDescription>Manage your saved addresses.</CardDescription>
                            </div>
                            <Button><Icon name="PlusCircle" /> Add New Address</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mockAddresses.map(addr => (
                                <div key={addr.id} className="p-4 rounded-lg border flex justify-between items-start bg-muted/50">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-semibold">{addr.name}</p>
                                            {addr.isDefault && <Badge>Default</Badge>}
                                        </div>
                                        <p className="text-muted-foreground text-sm">{addr.address}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">Edit</Button>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Icon name="Trash2" /> Delete</Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing" className="mt-6">
                     <Card>
                        <CardHeader  className="flex-row items-center justify-between">
                             <div>
                                <CardTitle>Payment Methods</CardTitle>
                                <CardDescription>Manage your saved payment details.</CardDescription>
                            </div>
                            <Button><Icon name="PlusCircle" /> Add New Card</Button>
                        </CardHeader>
                        <CardContent>
                             {mockPaymentMethods.map(pm => (
                                <div key={pm.id} className="p-4 rounded-lg border flex justify-between items-center bg-muted/50">
                                    <div className="flex items-center gap-4">
                                        <Icon name="KeyRound" className="w-8 h-8 text-muted-foreground" />
                                        <div>
                                            <p className="font-semibold">{pm.type} ending in {pm.last4}</p>
                                            <p className="text-muted-foreground text-sm">Expires {pm.expiry}</p>
                                        </div>
                                        {pm.isDefault && <Badge>Default</Badge>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Icon name="Trash2" /> Delete</Button>
                                    </div>
                                </div>
                            ))}
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
                                    {mockOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.id}</TableCell>
                                            <TableCell>{order.date}</TableCell>
                                            <TableCell>
                                                <Badge variant={order.status === 'Delivered' ? 'secondary' : 'default'}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{order.total}</TableCell>
                                            <TableCell>
                                                <Link href="#" className="text-primary hover:underline font-mono text-sm">{order.tracking}</Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
