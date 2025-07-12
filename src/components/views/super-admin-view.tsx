
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

const mockOrders = [
  { id: 'SS-1024', customer: 'Jane Doe', date: '2023-10-26', status: 'Processing', total: '$34.98', items: 1 },
  { id: 'SS-1023', customer: 'John Smith', date: '2023-10-25', status: 'Shipped', total: '$29.99', items: 1 },
  { id: 'SS-1022', customer: 'ArtfulAntics', date: '2023-10-25', status: 'Shipped', total: '$59.98', items: 2 },
  { id: 'SS-1021', customer: 'VectorVixen', date: '2023-10-24', status: 'Delivered', total: '$34.98', items: 1 },
];

export default function SuperAdminView() {
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
                name: data.email,
                email: data.email,
                role: data.isAdmin ? 'Admin' : 'Creator',
                status: 'Active', // Placeholder
                creations: data.creationsCount || 0,
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

    const handleConfirmUserAction = useCallback(async () => {
        if (!userAction || !user) return;
        const { action, userId, userName } = userAction;

        if (action === 'delete') {
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast({ title: 'User Deleted (Simulated)', description: `${userName} has been removed from the platform.` });
        } else if (action === 'suspend') {
             setUsers(prev => prev.map(u => u.id === userId ? {...u, status: u.status === 'Active' ? 'Suspended' : 'Active'} : u));
            const newStatus = users.find(u => u.id === userId)?.status === 'Active' ? 'Suspended' : 'Active';
            toast({ title: `User ${newStatus} (Simulated)`, description: `${userName}'s account is now ${newStatus.toLowerCase()}.` });
        } else if (action === 'promote') {
            const userDocRef = doc(db, "users", userId);
            const targetUser = users.find(u => u.id === userId);
            const newIsAdmin = targetUser?.role !== 'Admin';
            try {
                await setDoc(userDocRef, { isAdmin: newIsAdmin }, { merge: true });
                toast({ title: `Role Changed`, description: `${userName} is now a ${newIsAdmin ? 'Admin' : 'Creator'}.` });
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
            return { title: `${currentRole === 'Admin' ? 'Demote' : 'Promote'} User?`, description: `Are you sure you want to ${currentRole === 'Admin' ? 'demote' : 'promote'} ${userName} to ${currentRole === 'Admin' ? 'a Creator' : 'an Admin'}?`};
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

            <header className="mb-8">
                <h1 className="text-h1 font-headline flex items-center gap-3"><Icon name="ShieldCheck" /> Super Admin Center</h1>
                <p className="text-muted-foreground mt-1 text-body">Manage platform safety, users, and operations.</p>
            </header>

            <Tabs defaultValue="analytics" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="analytics"><Icon name="PieChart" /> Analytics</TabsTrigger>
                    <TabsTrigger value="orders"><Icon name="Package" /> All Orders</TabsTrigger>
                    <TabsTrigger value="users"><Icon name="Users" /> Users</TabsTrigger>
                    <TabsTrigger value="content"><Icon name="Filter" /> Content Filter</TabsTrigger>
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
                            <CardDescription>Monthly platform performance for the last 6 months.</CardDescription>
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
                            <CardTitle>All Platform Orders</CardTitle>
                            <CardDescription>An overview of all recent orders placed across the platform.</CardDescription>
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
                            <CardDescription>View and manage all creators on the platform.</CardDescription>
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
                                                            <Icon name={user.role === 'Admin' ? 'UserPlus' : 'ShieldCheck'} /> {user.role === 'Admin' ? 'Demote to Creator' : 'Promote to Admin'}
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
                            <CardDescription>Add or remove words that should be filtered from user prompts across the entire platform.</CardDescription>
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
            </Tabs>
        </div>
    );
}
