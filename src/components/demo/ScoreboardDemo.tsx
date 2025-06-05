
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, TrendingUp, TrendingDown, Target } from 'lucide-react';

export const ScoreboardDemo = () => {
  const [sortBy, setSortBy] = useState('winRate');

  const mockStats = [
    { name: 'Alice', gamesPlayed: 15, wins: 12, losses: 3, pointsFor: 315, pointsAgainst: 267, winRate: 80.0 },
    { name: 'Bob', gamesPlayed: 18, wins: 11, losses: 7, pointsFor: 378, pointsAgainst: 332, winRate: 61.1 },
    { name: 'Charlie', gamesPlayed: 12, wins: 7, losses: 5, pointsFor: 252, pointsAgainst: 228, winRate: 58.3 },
    { name: 'Diana', gamesPlayed: 14, wins: 8, losses: 6, pointsFor: 294, pointsAgainst: 276, winRate: 57.1 },
    { name: 'Eva', gamesPlayed: 10, wins: 4, losses: 6, pointsFor: 210, pointsAgainst: 234, winRate: 40.0 },
    { name: 'Frank', gamesPlayed: 16, wins: 5, losses: 11, pointsFor: 288, pointsAgainst: 352, winRate: 31.3 }
  ];

  const sortedStats = [...mockStats].sort((a, b) => {
    switch (sortBy) {
      case 'winRate':
        return b.winRate - a.winRate;
      case 'wins':
        return b.wins - a.wins;
      case 'gamesPlayed':
        return b.gamesPlayed - a.gamesPlayed;
      default:
        return b.winRate - a.winRate;
    }
  });

  const getPositionIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Trophy className="h-5 w-5 text-orange-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{index + 1}</span>;
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 70) return 'text-green-600';
    if (winRate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Group Scoreboard</h3>
          <p className="text-sm text-gray-500">Office Champions - All Games</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="winRate">Win Rate</SelectItem>
              <SelectItem value="wins">Total Wins</SelectItem>
              <SelectItem value="gamesPlayed">Games Played</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3">
        {sortedStats.map((player, index) => (
          <Card key={player.name} className={`transition-all duration-200 hover:shadow-md ${
            index === 0 ? 'ring-2 ring-yellow-200 bg-yellow-50' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getPositionIcon(index)}
                  <div>
                    <h4 className="font-medium text-lg">{player.name}</h4>
                    <p className="text-sm text-gray-500">
                      {player.wins}W - {player.losses}L
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Win Rate</p>
                    <p className={`text-lg font-bold ${getWinRateColor(player.winRate)}`}>
                      {player.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Games</p>
                    <p className="text-lg font-bold text-gray-700">{player.gamesPlayed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Points</p>
                    <p className="text-lg font-bold text-gray-700">
                      {player.pointsFor}-{player.pointsAgainst}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">85</p>
              <p className="text-sm text-blue-700">Total Games</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">1,737</p>
              <p className="text-sm text-green-700">Total Points</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">6</p>
              <p className="text-sm text-purple-700">Active Players</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
