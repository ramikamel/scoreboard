
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Plus, Minus, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DemoGroup, DemoGameMode } from '../AppDemo';

interface Team {
  id: number;
  players: string[];
  sets: number[];
}

interface ResultsDemoProps {
  mockGroups: DemoGroup[];
  mockGameModes: DemoGameMode[];
}

export const ResultsDemo = ({ mockGroups, mockGameModes }: ResultsDemoProps) => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [numberOfTeams, setNumberOfTeams] = useState<string>('');
  const [numberOfSets, setNumberOfSets] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [recentResults, setRecentResults] = useState([
    { game: 'Ping Pong Tournament', teams: [['Alice'], ['Bob']], sets: [[21, 18, 21], [19, 21, 15]], winner: 'Team 1 (Alice)', time: '5 min ago' },
    { game: 'Foosball Championship', teams: [['Charlie', 'Diana'], ['Eva', 'Frank']], sets: [[5, 3], [2, 5]], winner: 'Team 2 (Eva & Frank)', time: '1 hour ago' },
  ]);
  const { toast } = useToast();

  // Fixed set of player names
  const mockPlayers = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eva', 'Frank'];

  const initializeTeams = (numTeams: number) => {
    const newTeams: Team[] = [];
    for (let i = 0; i < numTeams; i++) {
      newTeams.push({
        id: i + 1,
        players: [],
        sets: numberOfSets ? new Array(parseInt(numberOfSets)).fill(0) : []
      });
    }
    setTeams(newTeams);
  };

  const addPlayerToTeam = (teamId: number) => {
    setTeams(teams.map(team => 
      team.id === teamId 
        ? { ...team, players: [...team.players, ''] }
        : team
    ));
  };

  const removePlayerFromTeam = (teamId: number, playerIndex: number) => {
    setTeams(teams.map(team => 
      team.id === teamId 
        ? { ...team, players: team.players.filter((_, index) => index !== playerIndex) }
        : team
    ));
  };

  const updatePlayerInTeam = (teamId: number, playerIndex: number, playerName: string) => {
    setTeams(teams.map(team => 
      team.id === teamId 
        ? { 
            ...team, 
            players: team.players.map((player, index) => 
              index === playerIndex ? playerName : player
            )
          }
        : team
    ));
  };

  const updateSetScore = (teamId: number, setIndex: number, score: number) => {
    setTeams(teams.map(team => 
      team.id === teamId 
        ? { 
            ...team, 
            sets: team.sets.map((setScore, index) => 
              index === setIndex ? score : setScore
            )
          }
        : team
    ));
  };

  const updateNumberOfSets = (sets: string) => {
    setNumberOfSets(sets);
    if (sets && teams.length > 0) {
      const numSets = parseInt(sets);
      setTeams(teams.map(team => ({
        ...team,
        sets: new Array(numSets).fill(0)
      })));
    }
  };

  const calculateWinner = () => {
    if (teams.length === 0 || !numberOfSets) return null;
    
    const teamScores = teams.map(team => {
      const setsWon = team.sets.reduce((count, setScore, setIndex) => {
        const maxScoreInSet = Math.max(...teams.map(t => t.sets[setIndex] || 0));
        return setScore === maxScoreInSet && setScore > 0 ? count + 1 : count;
      }, 0);
      return { teamId: team.id, setsWon };
    });

    const maxSetsWon = Math.max(...teamScores.map(score => score.setsWon));
    const winner = teamScores.find(score => score.setsWon === maxSetsWon);
    
    return winner && maxSetsWon > 0 ? winner.teamId : null;
  };

  const handleSaveMatch = () => {
    if (!selectedGroup) {
      toast({
        title: "Error",
        description: "Please select a group",
        variant: "destructive"
      });
      return;
    }

    if (!selectedGame) {
      toast({
        title: "Error",
        description: "Please select a game",
        variant: "destructive"
      });
      return;
    }

    if (teams.length === 0) {
      toast({
        title: "Error",
        description: "Please set up teams first",
        variant: "destructive"
      });
      return;
    }

    const hasEmptyPlayers = teams.some(team => team.players.length === 0 || team.players.some(player => !player));
    if (hasEmptyPlayers) {
      toast({
        title: "Error",
        description: "Please assign players to all teams",
        variant: "destructive"
      });
      return;
    }

    const winner = calculateWinner();
    const winnerTeam = teams.find(t => t.id === winner);
    const winnerText = winnerTeam ? `Team ${winner} (${winnerTeam.players.join(' & ')})` : 'No winner';

    const newResult = {
      game: selectedGame,
      teams: teams.map(team => team.players),
      sets: teams.map(team => team.sets),
      winner: winnerText,
      time: 'Just now'
    };

    setRecentResults([newResult, ...recentResults]);
    
    // Reset form
    setSelectedGroup('');
    setSelectedGame('');
    setNumberOfTeams('');
    setNumberOfSets('');
    setTeams([]);
    
    toast({
      title: "Match Saved!",
      description: `${selectedGame} match result has been recorded`,
    });
  };

  const winner = calculateWinner();

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 border-blue-300 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-blue-700">Add Match Result</CardTitle>
          <CardDescription>Set up teams, assign players, and track set scores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Group Selection */}
          <div>
            <Label htmlFor="groupSelect">Select Group</Label>
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a group" />
              </SelectTrigger>
              <SelectContent>
                {mockGroups.map((group) => (
                  <SelectItem key={group.code} value={group.code}>
                    {group.name} ({group.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Game Selection */}
          <div>
            <Label htmlFor="gameSelect">Select Game</Label>
            <Select value={selectedGame} onValueChange={setSelectedGame}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a game" />
              </SelectTrigger>
              <SelectContent>
                {mockGameModes.map((game) => (
                  <SelectItem key={game.name} value={game.name}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Number of Teams */}
          <div>
            <Label htmlFor="numberOfTeams">Number of Teams</Label>
            <Select value={numberOfTeams} onValueChange={(value) => {
              setNumberOfTeams(value);
              initializeTeams(parseInt(value));
            }}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select number of teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Teams</SelectItem>
                <SelectItem value="3">3 Teams</SelectItem>
                <SelectItem value="4">4 Teams</SelectItem>
                <SelectItem value="5">5 Teams</SelectItem>
                <SelectItem value="6">6 Teams</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Number of Sets */}
          <div>
            <Label htmlFor="numberOfSets">Number of Sets</Label>
            <Select value={numberOfSets} onValueChange={updateNumberOfSets}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select number of sets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Set</SelectItem>
                <SelectItem value="3">Best of 3</SelectItem>
                <SelectItem value="5">Best of 5</SelectItem>
                <SelectItem value="7">Best of 7</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Team Configuration */}
          {teams.map((team) => (
            <Card key={team.id} className="border border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team {team.id}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Players */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Players</Label>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm"
                      onClick={() => addPlayerToTeam(team.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Player
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {team.players.map((player, playerIndex) => (
                      <div key={playerIndex} className="flex gap-2">
                        <Select value={player} onValueChange={(value) => updatePlayerInTeam(team.id, playerIndex, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select player" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockPlayers.map(mockPlayer => (
                              <SelectItem key={mockPlayer} value={mockPlayer}>{mockPlayer}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="icon"
                          onClick={() => removePlayerFromTeam(team.id, playerIndex)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Set Scores */}
                {numberOfSets && (
                  <div>
                    <Label>Set Scores</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {team.sets.map((setScore, setIndex) => (
                        <div key={setIndex}>
                          <Label className="text-xs text-gray-600">Set {setIndex + 1}</Label>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={setScore || ''}
                            onChange={(e) => updateSetScore(team.id, setIndex, parseInt(e.target.value) || 0)}
                            className="mt-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!selectedGroup || !selectedGame || teams.length === 0) return;
                                handleSaveMatch();
                              }
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Winner Display */}
          {winner && (
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-sm text-green-700 font-medium">
                🏆 Winner: Team {winner}
              </p>
              <p className="text-xs text-green-600">
                Sets won: {teams.find(t => t.id === winner)?.sets.reduce((count, setScore, setIndex) => {
                  const maxScoreInSet = Math.max(...teams.map(t => t.sets[setIndex] || 0));
                  return setScore === maxScoreInSet && setScore > 0 ? count + 1 : count;
                }, 0)}
              </p>
            </div>
          )}

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700" 
            onClick={handleSaveMatch}
            disabled={!selectedGroup || !selectedGame || teams.length === 0}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Save Match Result
          </Button>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Results</h3>
        <div className="space-y-3">
          {recentResults.map((result, index) => (
            <Card key={index} className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{result.game}</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {result.teams.map((team, teamIndex) => (
                        <p key={teamIndex}>Team {teamIndex + 1}: {team.join(' & ')}</p>
                      ))}
                    </div>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      Winner: {result.winner}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{result.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
