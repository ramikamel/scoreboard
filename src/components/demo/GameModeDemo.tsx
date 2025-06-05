import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DemoGameMode } from '../AppDemo';

interface GameModeDemoProps {
  mockGameModes: DemoGameMode[];
  setMockGameModes: React.Dispatch<React.SetStateAction<DemoGameMode[]>>;
}

export const GameModeDemo = ({ mockGameModes, setMockGameModes }: GameModeDemoProps) => {
  const [showForm, setShowForm] = useState(false);
  const [gameName, setGameName] = useState('');
  const { toast } = useToast();

  const handleCreateGameMode = () => {
    if (!gameName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a game name",
        variant: "destructive"
      });
      return;
    }

    const newGameMode = {
      name: gameName,
      teamCount: 2,
      teamSize: 1,
      scoringRule: "Points based",
      description: `${gameName} game mode`
    };

    setMockGameModes([...mockGameModes, newGameMode]);
    setGameName('');
    setShowForm(false);
    
    toast({
      title: "Game Mode Created!",
      description: `"${gameName}" has been added to your game modes`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Game Modes</h3>
        <Button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Game Mode
        </Button>
      </div>

      {showForm && (
        <Card className="border-dashed border-2 border-green-300 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-700">Create Game Mode</CardTitle>
            <CardDescription>Add a new game type for your group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gameName">Game Name</Label>
              <Input 
                id="gameName" 
                placeholder="e.g., Pool, Darts, Chess" 
                className="mt-1"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateGameMode();
                  }
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleCreateGameMode}
              >
                Create Game Mode
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {mockGameModes.map((mode, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">{mode.name}</h4>
                    <p className="text-sm text-gray-500">{mode.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{mode.teamCount} teams × {mode.teamSize}</p>
                  <p className="text-xs text-gray-500">{mode.scoringRule}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
