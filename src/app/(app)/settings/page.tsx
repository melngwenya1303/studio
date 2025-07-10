'use client';
import React from 'react';
import Icon from '@/components/shared/icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3"><Icon name="Settings" /> Settings</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences.</p>
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
