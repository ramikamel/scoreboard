
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Gamepad2, Trash2 } from 'lucide-react';

interface GameMode {
  id: string;
  name: string;
  created_at: string;
}

interface GameModesAppProps {
  selectedGroupId: string | null;
}

export const GameModesApp = ({ selectedGroupId }: GameModesAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameModes, setGameModes] = useState<GameMode[]>([]);
  const [loading, setLoading] = useState(false);
  const [newGameModeName, setNewGameModeName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [removingGameModeId, setRemovingGameModeId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGameModes();
    } else {
      setGameModes([]);
    }
  }, [selectedGroupId]);

  const fetchGameModes = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_modes')
        .select('*')
        .eq('group_id', selectedGroupId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGameModes(data || []);
    } catch (error) {
      console.error('Error fetching game modes:', error);
      toast({
        title: "Error",
        description: "Failed to load game modes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createGameMode = async () => {
    if (!newGameModeName.trim() || !selectedGroupId || !user) {
      toast({
        title: "Error",
        description: "Please enter a game mode name and select a group",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('game_modes')
        .insert({
          name: newGameModeName.trim(),
          group_id: selectedGroupId
        })
        .select();

      if (error) {
        console.error('Error creating game mode:', error);
        let errorMessage = "Failed to create game mode";
        
        // Check for specific error types
        if (error.code === '23505') {
          errorMessage = "A game mode with this name already exists in this group";
        } else if (error.code === '23503') {
          errorMessage = "The selected group does not exist";
        } else if (error.message) {
          errorMessage = `Failed to create game mode: ${error.message}`;
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      setNewGameModeName('');
      fetchGameModes();
      toast({
        title: "Success",
        description: `Game mode "${newGameModeName}" created successfully!`
      });
    } catch (error) {
      console.error('Error creating game mode:', error);
      toast({
        title: "Error",
        description: "Failed to create game mode",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const removeGameMode = async (gameModeId: string, gameModeName: string) => {
    if (!confirm(`Are you sure you want to remove "${gameModeName}"? This action cannot be undone.`)) {
      return;
    }

    setRemovingGameModeId(gameModeId);
    try {
      const { error } = await supabase
        .from('game_modes')
        .delete()
        .eq('id', gameModeId);

      if (error) throw error;

      fetchGameModes();
      toast({
        title: "Success",
        description: `Game mode "${gameModeName}" removed successfully!`
      });
    } catch (error) {
      console.error('Error removing game mode:', error);
      toast({
        title: "Error",
        description: "Failed to remove game mode",
        variant: "destructive"
      });
    } finally {
      setRemovingGameModeId(null);
    }
  };

  if (!selectedGroupId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select a group first to manage game modes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Game Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Game Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gameModeName">Game Mode Name</Label>
            <Input
              id="gameModeName"
              value={newGameModeName}
              onChange={(e) => setNewGameModeName(e.target.value)}
              placeholder="e.g., Pool, Darts, Chess"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  createGameMode();
                }
              }}
            />
          </div>
          <Button 
            onClick={createGameMode} 
            disabled={!newGameModeName.trim() || isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Game Mode'}
          </Button>
        </CardContent>
      </Card>

      {/* Game Modes List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Game Modes</h3>
        {loading ? (
          <div className="text-center py-4">Loading game modes...</div>
        ) : gameModes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No game modes yet. Create one to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {gameModes.map((gameMode) => (
              <Card key={gameMode.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{gameMode.name}</h4>
                      <p className="text-sm text-gray-600">
                        Created {new Date(gameMode.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeGameMode(gameMode.id, gameMode.name)}
                        disabled={removingGameModeId === gameMode.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {removingGameModeId === gameMode.id ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
