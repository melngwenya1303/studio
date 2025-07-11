
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { useApp } from '@/contexts/AppContext';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

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
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (providerType: 'google' | 'facebook') => {
        setIsLoading(true);
        setError('');
        const provider = providerType === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            toast({ title: 'Success!', description: 'Successfully signed in. Redirecting...' });
        } catch (err: any) {
            handleAuthError(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAuthError = (err: any) => {
        const errorCode = err.code || '';
        let friendlyMessage = 'An unexpected error occurred. Please try again.';
        if (errorCode === 'auth/email-already-in-use') {
            friendlyMessage = 'This email is already in use. Try signing in instead.';
        } else if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
            friendlyMessage = 'Invalid email or password. Please check your credentials.';
        } else if (errorCode === 'auth/weak-password') {
            friendlyMessage = 'The password is too weak. Please use at least 6 characters.';
        } else if (errorCode === 'auth/account-exists-with-different-credential') {
            friendlyMessage = 'An account already exists with this email address. Please sign in with the original method.';
        }
        setError(friendlyMessage);
    };

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
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAuthAction('signIn')}}
                        />
                    </div>
                    <div className="flex flex-col gap-3 pt-2">
                        <Button onClick={() => handleAuthAction('signIn')} className="w-full" disabled={isLoading || !email || !password}>
                            {isLoading ? <Icon name="Wand2" className="animate-pulse"/> : 'Sign In'}
                        </Button>
                         <Button onClick={() => handleAuthAction('signUp')} className="w-full" variant="outline" disabled={isLoading || !email || !password}>
                            {isLoading ? <Icon name="Wand2" className="animate-pulse"/> : 'Sign Up'}
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <div className="relative w-full flex items-center">
                        <Separator className="flex-grow" />
                        <span className="flex-shrink-0 px-2 text-xs text-muted-foreground">OR CONTINUE WITH</span>
                        <Separator className="flex-grow" />
                    </div>
                    <div className="w-full grid grid-cols-2 gap-3">
                         <Button variant="outline" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
                           <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                           Google
                         </Button>
                         <Button variant="outline" onClick={() => handleSocialLogin('facebook')} disabled={isLoading}>
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path></svg>
                           Facebook
                         </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

    