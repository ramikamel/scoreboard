
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Gamepad2, Trophy, BarChart3 } from 'lucide-react';
import { GroupsApp } from './GroupsApp';
import { GameModesApp } from './GameModesApp';
import { MatchesApp } from './MatchesApp';
import { ScoreboardApp } from './ScoreboardApp';

export const AppMain = () => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Simple group selection handler
  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  // Clear selected group (for when user leaves a group)
  const handleGroupClear = () => {
    setSelectedGroupId(null);
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            The Scoreboard
          </h1>
          <p className="text-xl text-gray-600">
            Manage your groups, games, and track results
          </p>
        </div>

        <Card className="max-w-6xl mx-auto shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl text-center">Scoreboard App</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="groups" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="groups" className="font-medium">Groups</TabsTrigger>
                <TabsTrigger value="games" className="font-medium">Game Modes</TabsTrigger>
                <TabsTrigger value="matches" className="font-medium">Matches</TabsTrigger>
                <TabsTrigger value="scoreboard" className="font-medium">Scoreboard</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="groups" className="mt-0">
                  <GroupsApp 
                    onGroupSelect={handleGroupSelect} 
                    selectedGroupId={selectedGroupId} 
                    onGroupClear={handleGroupClear}
                  />
                </TabsContent>
                <TabsContent value="games" className="mt-0">
                  <GameModesApp selectedGroupId={selectedGroupId} />
                </TabsContent>
                <TabsContent value="matches" className="mt-0">
                  <MatchesApp selectedGroupId={selectedGroupId} />
                </TabsContent>
                <TabsContent value="scoreboard" className="mt-0">
                  <ScoreboardApp selectedGroupId={selectedGroupId} />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
