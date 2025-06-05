
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  getUserDisplayName: () => string;
  updateDisplayName: (newDisplayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  getUserDisplayName: () => '',
  updateDisplayName: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState(new Set<string>());

  const getUserDisplayName = (): string => {
    if (!user) return '';
    return user.user_metadata?.username || 
           user.user_metadata?.display_name || 
           user.email?.split('@')[0] || 
           'User';
  };

  const updateDisplayName = async (newDisplayName: string): Promise<void> => {
    if (!user) {
      throw new Error('No user logged in');
    }

    // Check if the new display name is already taken by another user
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', newDisplayName.trim())
        .single();

      if (existingUser && existingUser.id !== user.id) {
        throw new Error('This username is already taken by another user');
      }

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected when username is available
        throw checkError;
      }
    } catch (error) {
      if (error.message === 'This username is already taken by another user') {
        throw error;
      }
      console.error('Error checking username availability:', error);
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { 
          username: newDisplayName,
          display_name: newDisplayName 
        }
      });

      if (error) throw error;

      // Also update in the users table
      await supabase
        .from('users')
        .update({ username: newDisplayName })
        .eq('id', user.id);

    } catch (error) {
      console.error('Error updating display name:', error);
      throw error;
    }
  };

  useEffect(() => {
    let isInitializing = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        // Skip initial INITIAL_SESSION event to avoid duplicate processing
        if (event === 'INITIAL_SESSION' && isInitializing) {
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle new user creation or sign in - ensure user exists in users table
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          try {
            await ensureUserInDatabase(session.user);
          } catch (error) {
            console.error('Error ensuring user in database during auth event:', error);
          }
        }
        
        // Only set loading to false if this isn't the initial load
        if (!isInitializing) {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        // Ensure existing user is in database if needed
        if (session?.user) {
          await ensureUserInDatabase(session.user);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        isInitializing = false;
        setLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  // Helper function to ensure user exists in the users table
  const ensureUserInDatabase = async (user: User) => {
    // Prevent duplicate processing for the same user
    if (processingUsers.has(user.id)) {
      return;
    }

    setProcessingUsers(prev => new Set([...prev, user.id]));

    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database operation timeout')), 10000)
      );

      // Check if user already exists in users table
      const checkUserPromise = supabase
        .from('users')
        .select('id, username')
        .eq('id', user.id)
        .single();

      const { data: existingUser, error: fetchError } = await Promise.race([
        checkUserPromise,
        timeoutPromise
      ]) as any;

      // Get username from auth metadata
      const authUsername = user.user_metadata?.username || 
                          user.user_metadata?.display_name || 
                          user.email?.split('@')[0] || 
                          user.id.slice(0, 8);

      // Update the auth user's display name if it's not set or different
      if (!user.user_metadata?.display_name || user.user_metadata.display_name !== authUsername) {
        try {
          await supabase.auth.updateUser({
            data: { 
              username: authUsername,
              display_name: authUsername 
            }
          });
        } catch (updateError) {
          console.error('Error updating auth user display name:', updateError);
        }
      }

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        console.error('Error checking user in database:', fetchError);
        return;
      }

      if (!existingUser) {
        // Create new user with username from auth metadata
        const insertPromise = supabase
          .from('users')
          .insert({
            id: user.id,
            username: authUsername
          });

        const { error: insertError } = await Promise.race([
          insertPromise,
          timeoutPromise
        ]) as any;

        if (insertError) {
          console.error('Error creating user in database:', insertError);
        }
      } else if (existingUser.username !== authUsername) {
        // Update username if it's different (user might have updated their profile)
        const updatePromise = supabase
          .from('users')
          .update({ username: authUsername })
          .eq('id', user.id);

        const { error: updateError } = await Promise.race([
          updatePromise,
          timeoutPromise
        ]) as any;

        if (updateError) {
          console.error('Error updating username in database:', updateError);
        }
      }
    } catch (error) {
      if (error.message === 'Database operation timeout') {
        console.warn('Database operation timed out, proceeding with authentication');
      } else {
        console.error('Error ensuring user in database:', error);
      }
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, getUserDisplayName, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
};
