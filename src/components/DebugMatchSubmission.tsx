import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const DebugMatchSubmission = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testDatabaseAccess = async () => {
    setIsLoading(true);
    setDebugInfo([]);
    
    try {
      addDebug('Starting database access test...');
      
      // Test basic table access
      addDebug('Testing matches table access...');
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .limit(1);
      
      if (matchesError) {
        addDebug(`Matches table error: ${matchesError.message}`);
      } else {
        addDebug(`Matches table accessible, found ${matches?.length || 0} records`);
      }
      
      // Test game_modes table
      addDebug('Testing game_modes table access...');
      const { data: gameModes, error: gmError } = await supabase
        .from('game_modes')
        .select('*')
        .limit(3);
      
      if (gmError) {
        addDebug(`Game modes table error: ${gmError.message}`);
      } else {
        addDebug(`Game modes table accessible, found ${gameModes?.length || 0} records`);
      }
      
      // Test users table  
      addDebug('Testing users table access...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username')
        .limit(3);
      
      if (usersError) {
        addDebug(`Users table error: ${usersError.message}`);
      } else {
        addDebug(`Users table accessible, found ${users?.length || 0} records`);
      }
      
      // Test authenticated user info
      addDebug(`Current user: ${user?.id || 'Not authenticated'}`);
      
      if (gameModes && gameModes.length > 0 && user) {
        addDebug('Attempting test match insertion...');
        
        const testMatch = {
          game_mode_id: gameModes[0].id,
          recorded_by: user.id,
          played_at: new Date().toISOString()
        };
        
        addDebug(`Test match data: ${JSON.stringify(testMatch)}`);
        
        const { data: match, error: matchError } = await supabase
          .from('matches')
          .insert(testMatch)
          .select()
          .single();
        
        if (matchError) {
          addDebug(`Match insertion failed: ${matchError.message}`);
          addDebug(`Error code: ${matchError.code}`);
          addDebug(`Error details: ${JSON.stringify(matchError.details)}`);
        } else {
          addDebug(`Match created successfully: ${match.id}`);
          
          // Test match_teams insertion
          addDebug('Testing match_teams insertion...');
          const { error: teamsError } = await supabase
            .from('match_teams')
            .insert([{
              match_id: match.id,
              team_number: 1,
              score: 10,
              is_winner: true
            }]);
          
          if (teamsError) {
            addDebug(`Match teams insertion failed: ${teamsError.message}`);
          } else {
            addDebug('Match teams created successfully');
          }
          
          // Test match_players insertion
          addDebug('Testing match_players insertion...');
          const { error: playersError } = await supabase
            .from('match_players')
            .insert([{
              match_id: match.id,
              team_number: 1,
              user_id: user.id
            }]);
          
          if (playersError) {
            addDebug(`Match players insertion failed: ${playersError.message}`);
          } else {
            addDebug('Match players created successfully');
          }
        }
      } else {
        addDebug('Skipping match insertion test - missing game modes or user');
      }
      
    } catch (error) {
      addDebug(`Unexpected error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Debug Match Submission</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDatabaseAccess} 
          disabled={isLoading || !user}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Test Database Access'}
        </Button>
        
        {debugInfo.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto">
            <h4 className="font-medium mb-2">Debug Log:</h4>
            {debugInfo.map((info, index) => (
              <div key={index} className="text-sm text-gray-700 font-mono">
                {info}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
