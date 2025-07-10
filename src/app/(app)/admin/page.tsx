
'use client';

import React, { useState } from 'react';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

export default function AdminPage() {
    const { isAdmin } = useApp();
    const [blocklist, setBlocklist] = useState(['badword1', 'badword2']);
    const [newBlockword, setNewBlockword] = useState('');
    
    const [podPartners, setPodPartners] = useState([
        { id: '1', name: 'Printify', apiKey: '...key1' },
        { id: '2', name: 'Printful', apiKey: '...key2' }
    ]);
    const [newPartnerName, setNewPartnerName] = useState('');
    const [newPartnerApiKey, setNewPartnerApiKey] = useState('');

    const handleAddBlockword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBlockword.trim()) return;
        setBlocklist(prev => [...prev, newBlockword.trim()]);
        setNewBlockword('');
    };

    const handleDeleteBlockword = (word: string) => {
        setBlocklist(prev => prev.filter(item => item !== word));
    };

    const handleAddPodPartner = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPartnerName.trim() || !newPartnerApiKey.trim()) return;
      setPodPartners(prev => [...prev, { id: crypto.randomUUID(), name: newPartnerName, apiKey: newPartnerApiKey }]);
      setNewPartnerName('');
      setNewPartnerApiKey('');
    }

    const handleDeletePodPartner = (id: string) => {
        setPodPartners(prev => prev.filter(p => p.id !== id));
    }
    
    if (!isAdmin) {
      return (
        <div className="p-8 text-center text-red-500">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      );
    }

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3"><Icon name="ShieldCheck" /> Admin Center</h2>
                <p className="text-muted-foreground mt-1">Manage platform safety, integrations, and operations.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Icon name="Trash2" /> Prompt Filter Blocklist</CardTitle>
                        <CardDescription>Add or remove words that should be filtered from user prompts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddBlockword} className="flex gap-2 mb-4">
                            <Input 
                                type="text"
                                value={newBlockword}
                                onChange={(e) => setNewBlockword(e.target.value)}
                                placeholder="Add a forbidden word"
                                className="text-base"
                            />
                            <Button type="submit" size="icon" aria-label="Add blockword">
                                <Icon name="PlusCircle" />
                            </Button>
                        </form>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {blocklist.length > 0 ? blocklist.map(word => (
                                <div key={word} className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
                                    <span className="font-mono text-sm">{word}</span>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteBlockword(word)} aria-label={`Delete ${word}`}>
                                        <Icon name="Trash2" className="w-4 h-4" />
                                    </Button>
                                </div>
                            )) : <p className="text-sm text-muted-foreground text-center py-4">No blocked words yet.</p>}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Icon name="KeyRound" /> POD Partner APIs</CardTitle>
                        <CardDescription>Manage API keys for your Print-on-Demand partners.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddPodPartner} className="space-y-3 mb-4">
                             <Input 
                                type="text"
                                value={newPartnerName}
                                onChange={(e) => setNewPartnerName(e.target.value)}
                                placeholder="Partner Name (e.g., Printify)"
                                className="text-base"
                            />
                            <Input 
                                type="password"
                                value={newPartnerApiKey}
                                onChange={(e) => setNewPartnerApiKey(e.target.value)}
                                placeholder="Partner API Key"
                                className="text-base"
                            />
                            <Button type="submit" className="w-full">
                                <Icon name="PlusCircle" /> Add Partner
                            </Button>
                        </form>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {podPartners.length > 0 ? podPartners.map(partner => (
                                 <div key={partner.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{partner.name}</p>
                                        <p className="font-mono text-xs text-muted-foreground">API Key: ••••••••••••{partner.apiKey.slice(-4)}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeletePodPartner(partner.id)} aria-label={`Delete ${partner.name}`}>
                                        <Icon name="Trash2" className="w-4 h-4" />
                                    </Button>
                                </div>
                            )) : <p className="text-sm text-muted-foreground text-center py-4">No POD partners configured.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
