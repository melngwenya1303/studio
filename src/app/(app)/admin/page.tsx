
'use client';

import React, { useState, useMemo } from 'react';
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
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const BLOCKLIST_CATEGORIES = ['All', 'Copyright Infringement', 'Offensive Content', 'Hate Speech', 'General'];

// Mock data for charts
const chartData = [
    { date: 'Jan', value: 86 },
    { date: 'Feb', value: 120 },
    { date: 'Mar', value: 95 },
    { date: 'Apr', value: 150 },
    { date: 'May', value: 130 },
    { date: 'Jun', value: 180 },
];
const chartConfig = {
    value: { label: "Value", color: "hsl(var(--primary))" },
};

export default function AdminPage() {
    const { isAdmin } = useApp();
    const { toast } = useToast();
    
    // Blocklist state
    const [blocklist, setBlocklist] = useState([
        { word: 'disney', category: 'Copyright Infringement' },
        { word: 'marvel', category: 'Copyright Infringement' },
        { word: 'badword1', category: 'Offensive Content' },
        { word: 'badword2', category: 'Hate Speech' },
        { word: 'unwanted', category: 'General' },
    ]);
    const [newBlockword, setNewBlockword] = useState('');
    const [newBlockwordCategory, setNewBlockwordCategory] = useState(BLOCKLIST_CATEGORIES[4]);
    const [bulkWords, setBulkWords] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [wordToDelete, setWordToDelete] = useState<string | null>(null);
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


    const handleAddBlockword = (e: React.FormEvent) => {
        e.preventDefault();
        const word = newBlockword.trim();
        if (!word || blocklist.some(item => item.word === word)) return;
        setBlocklist(prev => [...prev, { word, category: newBlockwordCategory }].sort((a, b) => a.word.localeCompare(b.word)));
        setNewBlockword('');
    };
    
    const handleBulkAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const words = bulkWords.split(',').map(w => w.trim()).filter(Boolean);
        const newWords = words
            .filter(w => !blocklist.some(item => item.word === w))
            .map(w => ({ word: w, category: 'General' }));
        if (newWords.length > 0) {
            setBlocklist(prev => [...prev, ...newWords].sort((a, b) => a.word.localeCompare(b.word)));
        }
        setBulkWords('');
    };

    const handleDeleteBlockword = (word: string) => {
        setBlocklist(prev => prev.filter(item => item.word !== word));
        setWordToDelete(null);
    };

    const handleAddOrUpdatePartner = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPartnerName.trim() || !newPartnerApiKey.trim()) return;

        if (partnerToEdit) { // This is an update (key rotation)
            setPodPartners(prev => prev.map(p => p.id === partnerToEdit.id ? {...p, apiKey: newPartnerApiKey} : p));
            toast({ title: 'Success!', description: `API Key for ${partnerToEdit.name} has been updated.`});
            setPartnerToEdit(null);
        } else { // This is a new partner
            const newPartner = { id: crypto.randomUUID(), name: newPartnerName.trim(), apiKey: newPartnerApiKey.trim() };
            setPodPartners(prev => [...prev, newPartner]);
            setNewlyAddedPartner(newPartner);
        }

        setNewPartnerName('');
        setNewPartnerApiKey('');
    }

    const handleDeletePodPartner = (id: string) => {
        setPodPartners(prev => prev.filter(p => p.id !== id));
        setPartnerToDelete(null);
        toast({ title: 'Integration Removed', description: 'The POD partner has been successfully removed.' });
    }

    const handleCopyKey = () => {
        if (!newlyAddedPartner) return;
        navigator.clipboard.writeText(newlyAddedPartner.apiKey);
        toast({ title: 'Copied!', description: 'The API key has been copied to your clipboard.' });
    }

    const filteredBlocklist = useMemo(() => {
        return blocklist.filter(item => 
            (item.word.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (categoryFilter === 'All' || item.category === categoryFilter)
        );
    }, [blocklist, searchTerm, categoryFilter]);
    
    const getCategoryVariant = (category: string) => {
        switch (category) {
            case 'Copyright Infringement': return 'secondary';
            case 'Offensive Content': return 'destructive';
            case 'Hate Speech': return 'destructive';
            default: return 'outline';
        }
    }

    if (!isAdmin) {
      return (
        <div className="p-8 text-center text-destructive">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p>You do not have permission to view this page.</p>
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
                        <AlertDialogDescription>This action cannot be undone. This will permanently remove "{wordToDelete}" from the blocklist.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setWordToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteBlockword(wordToDelete!)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
                        <Button onClick={handleCopyKey} size="icon" variant="outline"><Icon name="KeyRound" /></Button>
                    </div>
                     <Button onClick={() => setNewlyAddedPartner(null)} className="w-full">I have saved my key</Button>
                </div>
            </Modal>

            <header className="mb-8">
                <h1 className="text-h1 font-bold font-headline flex items-center gap-3"><Icon name="ShieldCheck" /> Admin Center</h1>
                <p className="text-muted-foreground mt-1">Manage platform safety, integrations, and operations.</p>
            </header>

            {/* Analytics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Creations</CardTitle>
                        <Icon name="Brush" className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12,453</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                        <div className="h-20 -mx-4 -mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Icon name="Users" className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+2,350</div>
                        <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                         <div className="h-20 -mx-4 -mb-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.slice().reverse()} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorValue2)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                        <Icon name="KeyRound" className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{podPartners.length}</div>
                        <p className="text-xs text-muted-foreground">Connected POD partners</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blocked Terms</CardTitle>
                        <Icon name="Trash2" className="text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{blocklist.length}</div>
                        <p className="text-xs text-muted-foreground">Terms in prompt filter</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="analytics">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="analytics"><Icon name="PieChart" /> Analytics</TabsTrigger>
                    <TabsTrigger value="content"><Icon name="Filter" /> Content Moderation</TabsTrigger>
                    <TabsTrigger value="fulfillment"><Icon name="Truck" /> Fulfillment</TabsTrigger>
                </TabsList>

                <TabsContent value="analytics">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Analytics</CardTitle>
                            <CardDescription>Comprehensive reporting on platform performance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed">
                                <Icon name="BarChart3" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Advanced Reporting Coming Soon</h4>
                                <p className="text-muted-foreground">Track sales, popular designs, user cohorts, and more.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="content">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Icon name="Trash2" /> Prompt Filter Blocklist</CardTitle>
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
                                    <Input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search blocklist..." />
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-[240px]"><SelectValue placeholder="Filter by category" /></SelectTrigger>
                                        <SelectContent>{BLOCKLIST_CATEGORIES.map(cat => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                                   </Select>
                                </div>
                              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border rounded-lg p-2">
                                  {filteredBlocklist.length > 0 ? filteredBlocklist.map(item => (
                                      <div key={item.word} className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm">{item.word}</span>
                                            <Badge variant={getCategoryVariant(item.category)}>{item.category}</Badge>
                                          </div>
                                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setWordToDelete(item.word)} aria-label={`Delete ${item.word}`}>
                                              <Icon name="Trash2" className="w-4 h-4" />
                                          </Button>
                                      </div>
                                  )) : <p className="text-sm text-muted-foreground text-center py-4">No matching words found.</p>}
                              </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="fulfillment">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Icon name="KeyRound" /> POD Partner APIs</CardTitle>
                            <CardDescription>Manage API keys for your Print-on-Demand partners.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAddOrUpdatePartner} className="space-y-3 mb-4 p-4 border rounded-lg">
                                 <Input type="text" value={newPartnerName} onChange={(e) => setNewPartnerName(e.target.value)} placeholder="Partner Name (e.g., Printify)" className="text-base"/>
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
                                )) : <p className="text-sm text-muted-foreground text-center py-4">No POD partners configured.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
