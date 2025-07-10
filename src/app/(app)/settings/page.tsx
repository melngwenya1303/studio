
'use client';
import React from 'react';
import Icon from '@/components/shared/icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-h1 font-bold font-headline flex items-center gap-3"><Icon name="Settings" /> Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Coming Soon</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>This section is under construction. Check back later for account management features!</p>
                </CardContent>
            </Card>
        </div>
    );
}
