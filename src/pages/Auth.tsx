
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Loader2 } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'available' | 'taken' | 'invalid' | 'checking' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  // Debounced username availability checking
  React.useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus(null);
      return;
    }

    if (username.trim().length < 3) {
      setUsernameStatus('invalid');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      setUsernameStatus('invalid');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUsernameStatus('checking');
      const isAvailable = await checkUsernameAvailability(username.trim());
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [username]);

  // Function to check if username is already taken
  const checkUsernameAvailability = async (usernameToCheck: string): Promise<boolean> => {
    if (!usernameToCheck.trim()) return false;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', usernameToCheck.trim())
        .single();

      if (error && error.code === 'PGRST116') {
        // PGRST116 means no rows found, so username is available
        return true;
      }
      
      if (error) {
        console.error('Error checking username:', error);
        return false;
      }

      // If we got data, username is taken
      return false;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate('/app');
      }
    } catch (error) {
      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "An error occurred during sign in",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username.trim())) {
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters, numbers, underscores, and hyphens",
        variant: "destructive"
      });
      return;
    }

    if (username.trim().length < 3) {
      toast({
        title: "Username Too Short",
        description: "Username must be at least 3 characters long",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Check if username is available
      setCheckingUsername(true);
      const isUsernameAvailable = await checkUsernameAvailability(username.trim());
      setCheckingUsername(false);
      
      if (!isUsernameAvailable) {
        toast({
          title: "Username Taken",
          description: "This username is already taken. Please choose a different one.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim(),
            display_name: username.trim()
          },
          emailRedirectTo: `${window.location.origin}/verify`
        }
      });

      if (error) throw error;

      if (data.user) {
        // Also update the user's display name in the auth table for dashboard visibility
        try {
          await supabase.auth.updateUser({
            data: { 
              username: username.trim(),
              display_name: username.trim() 
            }
          });
        } catch (updateError) {
          console.error('Error updating display name:', updateError);
          // Don't throw here, as the signup was successful
        }

        toast({
          title: "Account Created!",
          description: "Please check your email to confirm your account.",
        });
      }
    } catch (error) {
      toast({
        title: "Sign Up Failed",
        description: error instanceof Error ? error.message : "An error occurred during sign up",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setCheckingUsername(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            GameTracker
          </CardTitle>
          <CardDescription>
            Sign in to track your game results and compete with friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-username">Username</Label>
                  <div className="relative">
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a unique username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className={
                        usernameStatus === 'taken' ? 'border-red-500 pr-10' :
                        usernameStatus === 'available' ? 'border-green-500 pr-10' :
                        usernameStatus === 'invalid' ? 'border-red-500 pr-10' :
                        'pr-10'
                      }
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {usernameStatus === 'checking' && (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {usernameStatus === 'available' && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  {usernameStatus === 'taken' && (
                    <p className="text-sm text-red-600 mt-1">This username is already taken</p>
                  )}
                  {usernameStatus === 'invalid' && username.trim().length > 0 && username.trim().length < 3 && (
                    <p className="text-sm text-red-600 mt-1">Username must be at least 3 characters long</p>
                  )}
                  {usernameStatus === 'invalid' && username.trim().length >= 3 && (
                    <p className="text-sm text-red-600 mt-1">Username can only contain letters, numbers, underscores, and hyphens</p>
                  )}
                  {usernameStatus === 'available' && (
                    <p className="text-sm text-green-600 mt-1">Username is available</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Choose a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loading || usernameStatus !== 'available'}
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
