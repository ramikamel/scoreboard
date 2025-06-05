import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trophy, X } from 'lucide-react';

interface GameMode {
  id: string;
  name: string;
}

interface Team {
  number: number;
  players: string[];
  score: number;
}

interface Match {
  id: string;
  played_at: string;
  game_modes: { name: string };
  match_teams: Array<{
    team_number: number;
    score: number;
    is_winner: boolean;
  }>;
}

interface MatchesAppProps {
  selectedGroupId: string | null;
}

export const MatchesApp = ({ selectedGroupId }: MatchesAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gameModes, setGameModes] = useState<GameMode[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGameModeId, setSelectedGameModeId] = useState<string>('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [groupUsers, setGroupUsers] = useState<Array<{id: string, username: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedGroupId) {
      fetchGameModes();
      fetchMatches();
      fetchGroupUsers();
    } else {
      setGameModes([]);
      setMatches([]);
      setGroupUsers([]);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    if (selectedGameModeId) {
      // Initialize with 2 teams by default
      setTeams([
        { number: 1, players: [], score: 0 },
        { number: 2, players: [], score: 0 }
      ]);
    }
  }, [selectedGameModeId]);

  const fetchGameModes = async () => {
    if (!selectedGroupId) return;

    try {
      const { data, error } = await supabase
        .from('game_modes')
        .select('id, name')
        .eq('group_id', selectedGroupId);

      if (error) throw error;
      setGameModes(data || []);
    } catch (error) {
      console.error('Error fetching game modes:', error);
    }
  };

  const fetchGroupUsers = async () => {
    if (!selectedGroupId) return;

    try {
      // Get all users in the selected group - usernames are now synced from auth metadata
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          user_id,
          users!inner(id, username)
        `)
        .eq('group_id', selectedGroupId);

      if (error) throw error;
      
      const users = data?.map(member => ({
        id: member.users.id,
        username: member.users.username || member.users.id.slice(0, 8)
      })) || [];
      
      setGroupUsers(users);
    } catch (error) {
      console.error('Error fetching group users:', error);
      // Fallback: get user IDs and try to get usernames from auth metadata
      try {
        const { data: memberData } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', selectedGroupId);

        if (memberData) {
          const fallbackUsers = memberData.map(member => ({
            id: member.user_id,
            username: member.user_id.slice(0, 8)
          }));
          setGroupUsers(fallbackUsers);
        }
      } catch (fallbackError) {
        console.error('Fallback error:', fallbackError);
        setGroupUsers([]);
      }
    }
  };

  const fetchMatches = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          played_at,
          game_modes!inner(name, group_id),
          match_teams(team_number, score, is_winner)
        `)
        .eq('game_modes.group_id', selectedGroupId)
        .order('played_at', { ascending: false });

      if (error) throw error;
      setMatches(data || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error",
        description: "Failed to load matches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitMatch = async () => {
    if (!selectedGameModeId || !user || teams.length === 0) return;

    // Validate that all teams have players and scores
    const hasEmptyTeams = teams.some(team => team.players.length === 0 || team.players.some(p => !p));
    if (hasEmptyTeams) {
      toast({
        title: "Error",
        description: "Please add players to all teams",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          game_mode_id: selectedGameModeId,
          recorded_by: user.id,
          played_at: new Date().toISOString()
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // Determine winner (highest score)
      const maxScore = Math.max(...teams.map(team => team.score));
      const winnerTeams = teams.filter(team => team.score === maxScore).map(team => team.number);

      // Create match teams
      const matchTeamsData = teams.map((team) => ({
        match_id: match.id,
        team_number: team.number,
        score: team.score,
        is_winner: winnerTeams.includes(team.number)
      }));

      const { error: teamsError } = await supabase
        .from('match_teams')
        .insert(matchTeamsData);

      if (teamsError) throw teamsError;

      // Create match players
      const matchPlayersData = teams.flatMap(team => 
        team.players.map(playerId => ({
          match_id: match.id,
          team_number: team.number,
          user_id: playerId
        }))
      );

      const { error: playersError } = await supabase
        .from('match_players')
        .insert(matchPlayersData);

      if (playersError) throw playersError;

      // Reset form
      setSelectedGameModeId('');
      setTeams([]);
      fetchMatches();
      
      toast({
        title: "Success",
        description: "Match recorded successfully!"
      });
    } catch (error) {
      console.error('Error submitting match:', error);
      toast({
        title: "Error",
        description: "Failed to record match",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTeam = () => {
    const newTeamNumber = teams.length + 1;
    setTeams([...teams, { number: newTeamNumber, players: [], score: 0 }]);
  };

  const removeTeam = (teamNumber: number) => {
    if (teams.length <= 2) return; // Keep at least 2 teams
    setTeams(teams.filter(team => team.number !== teamNumber));
  };

  const addPlayerToTeam = (teamNumber: number) => {
    setTeams(teams.map(team => 
      team.number === teamNumber 
        ? { ...team, players: [...team.players, ''] }
        : team
    ));
  };

  const removePlayerFromTeam = (teamNumber: number, playerIndex: number) => {
    setTeams(teams.map(team => 
      team.number === teamNumber 
        ? { ...team, players: team.players.filter((_, index) => index !== playerIndex) }
        : team
    ));
  };

  const updatePlayerInTeam = (teamNumber: number, playerIndex: number, playerId: string) => {
    setTeams(teams.map(team => 
      team.number === teamNumber 
        ? { 
            ...team, 
            players: team.players.map((player, index) => 
              index === playerIndex ? playerId : player
            )
          }
        : team
    ));
  };

  const updateTeamScore = (teamNumber: number, score: number) => {
    setTeams(teams.map(team => 
      team.number === teamNumber 
        ? { ...team, score }
        : team
    ));
  };

  if (!selectedGroupId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select a group first to record matches.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedGameMode = gameModes.find(gm => gm.id === selectedGameModeId);

  return (
    <div className="space-y-6">
      {/* Record Match */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Record New Match
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="gameMode">Select Game Mode</Label>
            <Select value={selectedGameModeId} onValueChange={setSelectedGameModeId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a game mode" />
              </SelectTrigger>
              <SelectContent>
                {gameModes.map((gameMode) => (
                  <SelectItem key={gameMode.id} value={gameMode.id}>
                    {gameMode.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedGameMode && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Teams & Players</h4>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addTeam}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Team
                </Button>
              </div>
              
              <div className="space-y-4">
                {teams.map((team) => (
                  <Card key={team.number} className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium">Team {team.number}</h5>
                      {teams.length > 2 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeTeam(team.number)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {/* Players */}
                      <div>
                        <Label className="text-sm font-medium">Players</Label>
                        <div className="space-y-2 mt-2">
                          {team.players.map((playerId, playerIndex) => (
                            <div key={playerIndex} className="flex gap-2">
                              <Select 
                                value={playerId} 
                                onValueChange={(value) => updatePlayerInTeam(team.number, playerIndex, value)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Select player" />
                                </SelectTrigger>
                                <SelectContent>
                                  {groupUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.username}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={() => removePlayerFromTeam(team.number, playerIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addPlayerToTeam(team.number)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Player
                          </Button>
                        </div>
                      </div>
                      
                      {/* Score */}
                      <div>
                        <Label htmlFor={`team${team.number}Score`} className="text-sm font-medium">Score</Label>
                        <Input
                          id={`team${team.number}Score`}
                          type="number"
                          min="0"
                          value={team.score}
                          onChange={(e) => updateTeamScore(team.number, parseInt(e.target.value) || 0)}
                          placeholder="Enter score"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <Button 
                onClick={submitMatch} 
                disabled={isSubmitting || teams.length === 0}
                className="w-full"
              >
                {isSubmitting ? 'Recording...' : 'Record Match'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Matches */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Matches</h3>
        {loading ? (
          <div className="text-center py-4">Loading matches...</div>
        ) : matches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No matches recorded yet. Record your first match!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {matches.map((match) => (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{match.game_modes.name}</h4>
                    <span className="text-sm text-gray-600">
                      {new Date(match.played_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    {match.match_teams
                      .sort((a, b) => a.team_number - b.team_number)
                      .map((team) => (
                      <div key={team.team_number} className="text-center">
                        <div className={`font-bold ${team.is_winner ? 'text-green-600' : 'text-gray-600'}`}>
                          Team {team.team_number}
                        </div>
                        <div className="text-lg">{team.score}</div>
                        {team.is_winner && <div className="text-xs text-green-600">Winner</div>}
                      </div>
                    ))}
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
