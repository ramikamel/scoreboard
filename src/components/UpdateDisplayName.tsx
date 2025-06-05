import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Loader2 } from 'lucide-react';

export const UpdateDisplayName = () => {
  const { user, getUserDisplayName, updateDisplayName } = useAuth();
  const { toast } = useToast();
  const [newDisplayName, setNewDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'available' | 'taken' | 'invalid' | 'checking' | null>(null);

  // Check username availability
  const checkUsernameAvailability = async (usernameToCheck: string): Promise<boolean> => {
    if (!usernameToCheck.trim() || !user) return false;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
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

      // If we got data, check if it's the current user
      return data.id === user.id;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  // Debounced username checking
  React.useEffect(() => {
    if (!newDisplayName.trim()) {
      setUsernameStatus(null);
      return;
    }

    if (newDisplayName.trim().length < 3) {
      setUsernameStatus('invalid');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(newDisplayName.trim())) {
      setUsernameStatus('invalid');
      return;
    }

    // Don't check if it's the same as current username
    if (newDisplayName.trim() === getUserDisplayName()) {
      setUsernameStatus('available');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUsernameStatus('checking');
      const isAvailable = await checkUsernameAvailability(newDisplayName.trim());
      setUsernameStatus(isAvailable ? 'available' : 'taken');
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [newDisplayName, user, getUserDisplayName]);

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDisplayName.trim()) {
      toast({
        title: "Display Name Required",
        description: "Please enter a new display name",
        variant: "destructive"
      });
      return;
    }

    if (usernameStatus !== 'available') {
      toast({
        title: "Invalid Username",
        description: "Please choose a valid and available username",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      await updateDisplayName(newDisplayName.trim());
      toast({
        title: "Display Name Updated!",
        description: "Your display name has been successfully updated.",
      });
      setNewDisplayName('');
      setUsernameStatus(null);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Update Display Name</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateDisplayName} className="space-y-4">
          <div>
            <Label htmlFor="current-display-name">Current Display Name</Label>
            <Input
              id="current-display-name"
              type="text"
              value={getUserDisplayName()}
              disabled
              className="bg-gray-50"
            />
          </div>
          <div>
            <Label htmlFor="new-display-name">New Display Name</Label>
            <div className="relative">
              <Input
                id="new-display-name"
                type="text"
                placeholder="Enter new display name"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
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
            {usernameStatus === 'invalid' && newDisplayName.trim().length > 0 && newDisplayName.trim().length < 3 && (
              <p className="text-sm text-red-600 mt-1">Username must be at least 3 characters long</p>
            )}
            {usernameStatus === 'invalid' && newDisplayName.trim().length >= 3 && (
              <p className="text-sm text-red-600 mt-1">Username can only contain letters, numbers, underscores, and hyphens</p>
            )}
            {usernameStatus === 'available' && newDisplayName.trim() !== getUserDisplayName() && (
              <p className="text-sm text-green-600 mt-1">Username is available</p>
            )}
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || usernameStatus !== 'available'}
          >
            {loading ? 'Updating...' : 'Update Display Name'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
