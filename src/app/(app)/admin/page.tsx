
'use client';

import React, { useState, useMemo } from 'react';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function AdminPage() {
    const { isAdmin } = useApp();
    const [blocklist, setBlocklist] = useState(['badword1', 'badword2', 'unwanted', 'prohibited']);
    const [newBlockword, setNewBlockword] = useState('');
    const [bulkWords, setBulkWords] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [wordToDelete, setWordToDelete] = useState<string | null>(null);
    
    const [podPartners, setPodPartners] = useState([
        { id: '1', name: 'Printify', apiKey: '...key1' },
        { id: '2', name: 'Printful', apiKey: '...key2' }
    ]);
    const [newPartnerName, setNewPartnerName] = useState('');
    const [newPartnerApiKey, setNewPartnerApiKey] = useState('');

    const handleAddBlockword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBlockword.trim() || blocklist.includes(newBlockword.trim())) return;
        setBlocklist(prev => [...prev, newBlockword.trim()].sort());
        setNewBlockword('');
    };
    
    const handleBulkAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const words = bulkWords.split(',').map(w => w.trim()).filter(Boolean);
        const newWords = words.filter(w => !blocklist.includes(w));
        if (newWords.length > 0) {
            setBlocklist(prev => [...prev, ...newWords].sort());
        }
        setBulkWords('');
    };

    const handleDeleteBlockword = (word: string) => {
        setBlocklist(prev => prev.filter(item => item !== word));
        setWordToDelete(null);
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

    const filteredBlocklist = useMemo(() => {
        return blocklist.filter(word => word.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [blocklist, searchTerm]);
    
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
            <AlertDialog open={!!wordToDelete} onOpenChange={() => setWordToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove "{wordToDelete}" from the blocklist.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setWordToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteBlockword(wordToDelete!)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
                    <CardContent className="space-y-4">
                        <div>
                          <form onSubmit={handleAddBlockword} className="flex gap-2">
                              <Input 
                                  type="text"
                                  value={newBlockword}
                                  onChange={(e) => setNewBlockword(e.target.value)}
                                  placeholder="Add a single word"
                                  className="text-base"
                              />
                              <Button type="submit" size="icon" aria-label="Add blockword">
                                  <Icon name="PlusCircle" />
                              </Button>
                          </form>
                        </div>
                        <div>
                            <form onSubmit={handleBulkAdd} className="space-y-2">
                                <Textarea 
                                    value={bulkWords}
                                    onChange={(e) => setBulkWords(e.target.value)}
                                    placeholder="Bulk add: paste comma-separated words..."
                                    rows={3}
                                />
                                <Button type="submit" className="w-full">
                                  <Icon name="PlusCircle" /> Add Bulk Words
                                </Button>
                            </form>
                        </div>
                        <div className="space-y-2">
                          <Input 
                            type="search"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search blocklist..."
                          />
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 border rounded-lg p-2">
                              {filteredBlocklist.length > 0 ? filteredBlocklist.map(word => (
                                  <div key={word} className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
                                      <span className="font-mono text-sm">{word}</span>
                                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setWordToDelete(word)} aria-label={`Delete ${word}`}>
                                          <Icon name="Trash2" className="w-4 h-4" />
                                      </Button>
                                  </div>
                              )) : <p className="text-sm text-muted-foreground text-center py-4">No matching words found.</p>}
                          </div>
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
