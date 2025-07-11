'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { getFirestore, collection, doc, addDoc, getDocs, deleteDoc, setDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Modal from '@/components/shared/modal';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const BLOCKLIST_CATEGORIES = ['All', 'Copyright Infringement', 'Offensive Content', 'Hate Speech', 'General'];

const salesData = [
    { name: 'Jan', sales: 4000, signups: 240 },
    { name: 'Feb', sales: 3000, signups: 139 },
    { name: 'Mar', sales: 5000, signups: 980 },
    { name: 'Apr', sales: 4500, signups: 390 },
    { name: 'May', sales: 6000, signups: 480 },
    { name: 'Jun', sales: 7500, signups: 800 },
]

const chartConfig = {
  sales: {
    label: "Sales",
    color: "hsl(var(--primary))",
  },
  signups: {
    label: "Signups",
    color: "hsl(var(--accent))",
  },
}

const mockOrders = [
  { id: 'SS-1024', customer: 'Jane Doe', date: '2023-10-26', status: 'Processing', total: '$34.98', items: 1 },
  { id: 'SS-1023', customer: 'John Smith', date: '2023-10-25', status: 'Shipped', total: '$29.99', items: 1 },
  { id: 'SS-1022', customer: 'ArtfulAntics', date: '2023-10-25', status: 'Shipped', total: '$59.98', items: 2 },
  { id: 'SS-1021', customer: 'VectorVixen', date: '2023-10-24', status: 'Delivered', total: '$34.98', items: 1 },
];

export default function AdminView() {
    const { isAdmin, user } = useApp();
    const { toast } = useToast();
    const db = useMemo(() => getFirestore(firebaseApp), []);
    
    const [blocklist, setBlocklist] = useState<{ id: string, word: string, category: string }[]>([]);
    const [newBlockword, setNewBlockword] = useState('');
    const [newBlockwordCategory, setNewBlockwordCategory] = useState(BLOCKLIST_CATEGORIES[4]);
    const [bulkWords, setBulkWords] = useState('');
    const [blocklistSearchTerm, setBlocklistSearchTerm] = useState('');
    const [wordToDelete, setWordToDelete] = useState<{ id: string, word: string } | null>(null);
    const [categoryFilter, setCategoryFilter] = useState('All');
    
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

    // User Management State
    const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string; status: string; creations: number; avatar: string; }[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [userAction, setUserAction] = useState<{action: 'delete' | 'suspend' | 'promote', userId: string, userName: string} | null>(null);

    const fetchBlocklist = useCallback(async () => {
        const blocklistCol = collection(db, 'blocklist');
        const snapshot = await getDocs(blocklistCol);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string, word: string, category: string }));
        setBlocklist(list.sort((a, b) => a.word.localeCompare(b.word)));
    }, [db]);

    const fetchUsers = useCallback(async () => {
         const usersCol = collection(db, 'users');
         const snapshot = await getDocs(usersCol);
         const userList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.email, // Placeholder, real name not stored yet
                email: data.email,
                role: data.isAdmin ? 'Admin' : 'User',
                status: 'Active', // Placeholder
                creations: 0, // Placeholder
                avatar: `https://i.pravatar.cc/40?u=${doc.id}`
            };
         });
         setUsers(userList);
    }, [db]);

    useEffect(() => {
        if (isAdmin) {
            fetchBlocklist();
            fetchUsers();
        }
    }, [isAdmin, fetchBlocklist, fetchUsers]);


    const handleAddBlockword = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const word = newBlockword.trim().toLowerCase();
        if (!word || blocklist.some(item => item.word === word)) return;
        
        try {
            await addDoc(collection(db, 'blocklist'), { word, category: newBlockwordCategory });
            toast({ title: "Word Added", description: `"${word}" has been added to the blocklist.` });
            setNewBlockword('');
            fetchBlocklist(); // Refresh list
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add word to blocklist.' });
        }
    }, [newBlockword, blocklist, newBlockwordCategory, db, fetchBlocklist, toast]);
    
    const handleBulkAdd = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        const words = bulkWords.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
        const newWords = words.filter(w => !blocklist.some(item => item.word === w));

        if (newWords.length > 0) {
            try {
                for (const word of newWords) {
                    await addDoc(collection(db, 'blocklist'), { word, category: 'General' });
                }
                toast({ title: 'Bulk Add Success', description: `${newWords.length} new words added to the blocklist.` });
                setBulkWords('');
                fetchBlocklist();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not add bulk words.' });
            }
        }
    }, [bulkWords, blocklist, db, fetchBlocklist, toast]);

    const handleDeleteBlockword = useCallback(async (id: string, word: string) => {
        try {
            await deleteDoc(doc(db, 'blocklist', id));
            toast({ title: "Word Removed", description: `"${word}" has been removed from the blocklist.` });
            setWordToDelete(null);
            fetchBlocklist();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not remove word.' });
        }
    }, [db, fetchBlocklist, toast]);

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

    const handleConfirmUserAction = useCallback(async () => {
        if (!userAction || !user) return;
        const { action, userId, userName } = userAction;

        if (action === 'delete') {
            // Deleting users is complex and requires a Cloud Function for safety.
            // We'll simulate it on the client for now.
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast({ title: 'User Deleted (Simulated)', description: `${userName} has been removed from the platform.` });
        } else if (action === 'suspend') {
            // Suspending users in Firebase Auth is a server-side action.
            // We'll simulate it on the client for now.
             setUsers(prev => prev.map(u => u.id === userId ? {...u, status: u.status === 'Active' ? 'Suspended' : 'Active'} : u));
            const newStatus = users.find(u => u.id === userId)?.status === 'Active' ? 'Suspended' : 'Active';
            toast({ title: `User ${newStatus} (Simulated)`, description: `${userName}'s account is now ${newStatus.toLowerCase()}.` });
        } else if (action === 'promote') {
            const userDocRef = doc(db, "users", userId);
            const targetUser = users.find(u => u.id === userId);
            const newIsAdmin = targetUser?.role !== 'Admin';
            try {
                await setDoc(userDocRef, { isAdmin: newIsAdmin }, { merge: true });
                toast({ title: `Role Changed`, description: `${userName} is now a ${newIsAdmin ? 'Admin' : 'User'}.` });
                fetchUsers();
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error', description: 'Could not update user role.' });
            }
        }
        setUserAction(null);
    }, [userAction, users, user, db, fetchUsers, toast]);

    const getAlertDialogContent = useCallback(() => {
        if (!userAction) return { title: '', description: ''};
        const { action, userName } = userAction;
        if (action === 'delete') return { title: 'Delete User?', description: `This will permanently delete ${userName} and all their data. This action is irreversible.`};
        if (action === 'suspend') {
            const currentStatus = users.find(u => u.id === userAction.userId)?.status;
            return { title: `${currentStatus === 'Active' ? 'Suspend' : 'Unsuspend'} User?`, description: `Are you sure you want to ${currentStatus === 'Active' ? 'suspend' : 'reinstate'} ${userName}?`};
        }
        if (action === 'promote') {
             const currentRole = users.find(u => u.id === userAction.userId)?.role;
            return { title: `${currentRole === 'Admin' ? 'Demote' : 'Promote'} User?`, description: `Are you sure you want to ${currentRole === 'Admin' ? 'demote' : 'promote'} ${userName} to ${currentRole === 'Admin' ? 'a User' : 'an Admin'}?`};
        }
        return { title: '', description: ''};
    }, [userAction, users]);

    const filteredBlocklist = useMemo(() => {
        return blocklist.filter(item => 
            (item.word.toLowerCase().includes(blocklistSearchTerm.toLowerCase())) &&
            (categoryFilter === 'All' || item.category === categoryFilter)
        );
    }, [blocklist, blocklistSearchTerm, categoryFilter]);

     const filteredUsers = useMemo(() => {
        return users.filter(user =>
            user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
        );
    }, [users, userSearchTerm]);
    
    const getCategoryVariant = useCallback((category: string) => {
        switch (category) {
            case 'Copyright Infringement': return 'secondary';
            case 'Offensive Content': return 'destructive';
            case 'Hate Speech': return 'destructive';
            default: return 'outline';
        }
    }, []);
    
    const getStatusVariant = useCallback((status: string) => {
        switch (status) {
            case 'Shipped': return 'default';
            case 'Processing': return 'secondary';
            case 'Delivered': return 'outline';
            default: return 'outline';
        }
    }, []);

     const getRoleVariant = useCallback((role: string) => role === 'Admin' ? 'default' : 'secondary', []);
     const getUserStatusVariant = useCallback((status: string) => status === 'Active' ? 'default' : 'destructive', []);

    if (!isAdmin) {
      return (
        <div className="p-8 text-center text-destructive">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p>You do not have permission to view this page. This feature is restricted to administrators only.</p>
        </div>
      );
    }

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            {/* Modal Dialogs */}
            <AlertDialog open={!!wordToDelete} onOpenChange={() => setWordToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone. This will permanently remove "{wordToDelete?.word}" from the blocklist.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setWordToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteBlockword(wordToDelete!.id, wordToDelete!.word)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
            <AlertDialog open={!!userAction} onOpenChange={() => setUserAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{getAlertDialogContent().title}</AlertDialogTitle>
                        <AlertDialogDescription>{getAlertDialogContent().description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className={userAction?.action === 'delete' || userAction?.action === 'suspend' ? 'bg-destructive hover:bg-destructive/90' : ''} onClick={handleConfirmUserAction}>Confirm</AlertDialogAction>
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

            <header className="mb-8">
                <h1 className="text-h1 font-headline flex items-center gap-3"><Icon name="ShieldCheck" /> Admin Center</h1>
                <p className="text-muted-foreground mt-1 text-body">Manage platform safety, integrations, and operations.</p>
            </header>

            <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="analytics"><Icon name="PieChart" /> Analytics</TabsTrigger>
                    <TabsTrigger value="orders"><Icon name="Package" /> Orders</TabsTrigger>
                    <TabsTrigger value="users"><Icon name="Users" /> Users</TabsTrigger>
                    <TabsTrigger value="content"><Icon name="Filter" /> Content</TabsTrigger>
                    <TabsTrigger value="fulfillment"><Icon name="Truck" /> Fulfillment</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analytics" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Creations</CardTitle>
                                <Icon name="Brush" className="text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12,453</div>
                                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                                <Icon name="Users" className="text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+{users.length}</div>
                                <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                <Icon name="ShoppingCart" className="text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{mockOrders.length}</div>
                                <p className="text-xs text-muted-foreground">in the last 30 days</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Blocked Terms</CardTitle>
                                <Icon name="Filter" className="text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{blocklist.length}</div>
                                <p className="text-xs text-muted-foreground">Terms in prompt filter</p>
                            </CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales &amp; Growth Overview</CardTitle>
                            <CardDescription>Monthly performance for the last 6 months.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                      cursor={{ fill: 'hsla(var(--muted))' }}
                                      contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)"
                                      }}
                                    />
                                    <Legend />
                                    <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="signups" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>An overview of all recent orders placed on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockOrders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.id}</TableCell>
                                            <TableCell>{order.customer}</TableCell>
                                            <TableCell>{order.date}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(order.status)}>
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{order.total}</TableCell>
                                            <TableCell className="text-center">
                                                <Button variant="outline" size="sm">View Order</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>View and manage all users on the platform.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <Input 
                                    placeholder="Search by name or email..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Creations</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{user.creations}</TableCell>
                                            <TableCell><Badge variant={getRoleVariant(user.role)}>{user.role}</Badge></TableCell>
                                            <TableCell><Badge variant={getUserStatusVariant(user.status)}>{user.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">Actions</Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setUserAction({action: 'promote', userId: user.id, userName: user.name})}>
                                                            <Icon name={user.role === 'Admin' ? 'UserPlus' : 'ShieldCheck'} /> {user.role === 'Admin' ? 'Demote to User' : 'Promote to Admin'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setUserAction({action: 'suspend', userId: user.id, userName: user.name})}>
                                                            <Icon name="Ban" /> {user.status === 'Active' ? 'Suspend' : 'Unsuspend'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setUserAction({action: 'delete', userId: user.id, userName: user.name})} className="text-destructive">
                                                            <Icon name="Trash2" /> Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                             {filteredUsers.length === 0 && <p className="text-center text-muted-foreground py-8">No users found.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="content" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Icon name="Filter" /> Prompt Filter Blocklist</CardTitle>
                            <CardDescription>Add or remove words that should be filtered from user prompts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                              <form onSubmit={handleAddBlockword} className="flex gap-2">
                                  <Input type="text" value={newBlockword} onChange={(e) => setNewBlockword(e.target.value)} placeholder="Add a single word" className="text-base" />
                                   <Select value={newBlockwordCategory} onValueChange={setNewBlockwordCategory}>
                                    <SelectTrigger className="w-[240px]"><SelectValue placeholder="Select category" /></SelectTrigger>
                                    <SelectContent>
                                        {BLOCKLIST_CATEGORIES.slice(1).map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                                    </SelectContent>
                                   </Select>
                                  <Button type="submit" size="icon" aria-label="Add blockword"><Icon name="PlusCircle" /></Button>
                              </form>
                            </div>
                            <div>
                                <form onSubmit={handleBulkAdd} className="space-y-2">
                                    <Textarea value={bulkWords} onChange={(e) => setBulkWords(e.target.value)} placeholder="Bulk add: paste comma-separated words... (will be assigned 'General' category)" rows={3} />
                                    <Button type="submit" className="w-full"><Icon name="PlusCircle" /> Add Bulk Words</Button>
                                </form>
                            </div>
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    <Input type="search" value={blocklistSearchTerm} onChange={(e) => setBlocklistSearchTerm(e.target.value)} placeholder="Search blocklist..." />
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-[240px]"><SelectValue placeholder="Filter by category" /></SelectTrigger>
                                        <SelectContent>{BLOCKLIST_CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                                   </Select>
                                </div>
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border rounded-lg p-2">
                                  {filteredBlocklist.length > 0 ? filteredBlocklist.map(item => (
                                      <div key={item.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm">{item.word}</span>
                                            <Badge variant={getCategoryVariant(item.category)}>{item.category}</Badge>
                                          </div>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setWordToDelete({ id: item.id, word: item.word })} aria-label={`Delete ${item.word}`}>
                                              <Icon name="Trash2" className="w-4 h-4" />
                                          </Button>
                                      </div>
                                  )) : <p className="text-sm text-muted-foreground text-center py-4">No matching words found.</p>}
                              </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="fulfillment" className="mt-4">
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
            </Tabs>
        </div>
    );
}
