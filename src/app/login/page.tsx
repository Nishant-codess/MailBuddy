'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/logo';

function GoogleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.3v2.84C4.09 20.98 7.72 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.3C1.46 8.85 1 10.42 1 12s.46 3.15 1.3 4.93l3.54-2.84z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.72 1 4.09 3.02 2.3 5.96l3.54 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                fill="#EA4335"
            />
        </svg>
    )
}

export default function LoginPage() {
  const { login, isLoggingIn, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  // While checking auth state or if user is found, show loader
  if (loading || user) {
     return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
         <div className="mx-auto mb-4">
            <Logo />
         </div>
        <CardTitle className="text-2xl">Welcome to MailGenius</CardTitle>
        <CardDescription>Sign in to build your next AI email campaign.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={login} disabled={isLoggingIn} className="w-full">
          {isLoggingIn ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
