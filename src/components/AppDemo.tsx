
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupDemo } from './demo/GroupDemo';
import { GameModeDemo } from './demo/GameModeDemo';
import { ResultsDemo } from './demo/ResultsDemo';
import { ScoreboardDemo } from './demo/ScoreboardDemo';

// Define the types to share across components
export interface DemoGroup {
  name: string;
  code: string;
  members: number;
  lastActive: string;
}

export interface DemoGameMode {
  name: string;
  teamCount: number;
  teamSize: number;
  scoringRule: string;
  description: string;
}

export const AppDemo = () => {
  // Shared state for demo components
  const [mockGroups, setMockGroups] = useState<DemoGroup[]>([
    { name: "Office Champions", code: "PING2024", members: 8, lastActive: "2 hours ago" },
    { name: "Weekend Warriors", code: "FOOSE2024", members: 4, lastActive: "1 day ago" }
  ]);

  // Shared game modes state
  const [mockGameModes, setMockGameModes] = useState<DemoGameMode[]>([
    {
      name: "Ping Pong",
      teamCount: 2,
      teamSize: 1,
      scoringRule: "First to 21 points",
      description: "Classic 1v1 ping pong"
    },
    {
      name: "Foosball",
      teamCount: 2,
      teamSize: 2,
      scoringRule: "First to 10 goals",
      description: "Team foosball matches"
    },
    {
      name: "UNO",
      teamCount: 4,
      teamSize: 1,
      scoringRule: "Lowest points wins",
      description: "Free-for-all card game"
    }
  ]);

  return (
    <div id="app-demo" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            See it in action
          </h2>
          <p className="text-xl text-gray-600">
            Explore the app features with this interactive demo
          </p>
        </div>

        <Card className="max-w-4xl mx-auto shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl text-center">Scoreboard Demo</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="groups" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="groups" className="font-medium">Groups</TabsTrigger>
                <TabsTrigger value="games" className="font-medium">Game Modes</TabsTrigger>
                <TabsTrigger value="results" className="font-medium">Add Results</TabsTrigger>
                <TabsTrigger value="scoreboard" className="font-medium">Scoreboard</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="groups" className="mt-0">
                  <GroupDemo mockGroups={mockGroups} setMockGroups={setMockGroups} />
                </TabsContent>
                <TabsContent value="games" className="mt-0">
                  <GameModeDemo mockGameModes={mockGameModes} setMockGameModes={setMockGameModes} />
                </TabsContent>
                <TabsContent value="results" className="mt-0">
                  <ResultsDemo mockGroups={mockGroups} mockGameModes={mockGameModes} />
                </TabsContent>
                <TabsContent value="scoreboard" className="mt-0">
                  <ScoreboardDemo />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
