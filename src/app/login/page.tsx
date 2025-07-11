
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useApp } from '@/contexts/AppContext';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
    const router = useRouter();
    const { user } = useApp();
    const { toast } = useToast();
    const auth = getAuth();

    const [email, setEmail] = useState('admin@surfacestoryai.com');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // If user is already logged in, redirect to the dashboard
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleAuthAction = async (action: 'signUp' | 'signIn') => {
        setIsLoading(true);
        setError('');
        try {
            if (action === 'signUp') {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            toast({ title: 'Success!', description: `Successfully ${action === 'signUp' ? 'signed up' : 'signed in'}. Redirecting...` });
            // The useEffect hook will handle redirection once the user state is updated
        } catch (err: any) {
            const errorCode = err.code || '';
            let friendlyMessage = 'An unexpected error occurred. Please try again.';
            if (errorCode === 'auth/email-already-in-use') {
                friendlyMessage = 'This email is already in use. Try signing in instead.';
            } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
                friendlyMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else if (errorCode === 'auth/weak-password') {
                friendlyMessage = 'The password is too weak. Please use at least 6 characters.';
            }
            setError(friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Render nothing if redirecting
    if (user) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Icon name="Wand2" className="h-12 w-12 animate-pulse text-primary" />
                    <p className="text-muted-foreground">Loading Your Creative Space...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-background p-4">
             <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                     <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                        <Icon name="Wand2" className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle>Welcome to SurfaceStory</CardTitle>
                    <CardDescription>Sign in or create an account to begin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {error && (
                        <Alert variant="destructive">
                            <Icon name="Ban" />
                            <AlertTitle>Authentication Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button onClick={() => handleAuthAction('signIn')} className="w-full" disabled={isLoading || !email || !password}>
                        {isLoading ? <Icon name="Wand2" className="animate-pulse"/> : 'Sign In'}
                    </Button>
                     <Button onClick={() => handleAuthAction('signUp')} className="w-full" variant="outline" disabled={isLoading || !email || !password}>
                        {isLoading ? <Icon name="Wand2" className="animate-pulse"/> : 'Sign Up'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
