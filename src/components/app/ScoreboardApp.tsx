
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Medal, Award } from 'lucide-react';

interface PlayerStats {
  user_id: string;
  username: string;
  wins: number;
  total_points: number;
  rank: number;
}

interface ScoreboardAppProps {
  selectedGroupId: string | null;
}

export const ScoreboardApp = ({ selectedGroupId }: ScoreboardAppProps) => {
  const { toast } = useToast();
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedGroupId) {
      fetchPlayerStats();
    } else {
      setPlayerStats([]);
    }
  }, [selectedGroupId]);

  const fetchPlayerStats = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      // First, get all group members to ensure everyone is shown
      const { data: groupMembers, error: membersError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          users(id, username)
        `)
        .eq('group_id', selectedGroupId);

      if (membersError) throw membersError;

      // Get all matches for this group
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          match_teams(team_number, score, is_winner),
          match_players(user_id, team_number),
          game_modes!inner(group_id)
        `)
        .eq('game_modes.group_id', selectedGroupId);

      if (error) throw error;

      // Initialize stats for all group members
      const statsMap = new Map<string, {
        wins: number;
        total_points: number;
        user_id: string;
        username: string;
      }>();

      // Initialize all group members with 0 stats
      groupMembers?.forEach(member => {
        if (member.users) {
          statsMap.set(member.user_id, {
            wins: 0,
            total_points: 0,
            user_id: member.user_id,
            username: member.users.username || member.users.id.slice(0, 8) || 'Unknown'
          });
        }
      });

      // Calculate stats from matches
      matches?.forEach(match => {
        match.match_players?.forEach(player => {
          const team = match.match_teams?.find(t => t.team_number === player.team_number);
          if (!team) return;

          const current = statsMap.get(player.user_id);
          if (current) {
            current.total_points += team.score;
            if (team.is_winner) current.wins += 1;
          }
        });
      });

      // Convert to array and sort by wins first, then by points
      const sortedStats = Array.from(statsMap.values()).sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.total_points - a.total_points;
      });

      // Calculate ranks with proper tie handling
      const formattedStats: PlayerStats[] = [];
      let currentRank = 1;
      
      for (let i = 0; i < sortedStats.length; i++) {
        const player = sortedStats[i];
        
        // Check if this player is tied with the previous player
        if (i > 0) {
          const prevPlayer = sortedStats[i - 1];
          if (player.wins !== prevPlayer.wins || player.total_points !== prevPlayer.total_points) {
            // Not tied, so rank is current position + 1
            currentRank = i + 1;
          }
          // If tied, keep the same rank as previous player
        }
        
        formattedStats.push({
          ...player,
          rank: currentRank
        });
      }

      setPlayerStats(formattedStats);
    } catch (error) {
      console.error('Error fetching player stats:', error);
      toast({
        title: "Error",
        description: "Failed to load scoreboard",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedGroupId) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please select a group first to view the scoreboard.</p>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2: return <Medal className="h-5 w-5 text-gray-400" />;
      case 3: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-gray-500 font-bold">#{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Group Scoreboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading scoreboard...</div>
          ) : playerStats.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No group members found. Join a group to see the scoreboard!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Rank</th>
                    <th className="text-left py-3 px-2">Player</th>
                    <th className="text-center py-3 px-2">Wins</th>
                    <th className="text-center py-3 px-2">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {playerStats.map((player) => (
                    <tr 
                      key={player.user_id} 
                      className={`border-b hover:bg-gray-50 ${
                        player.rank === 1 ? 'bg-yellow-50' : 
                        player.rank === 2 ? 'bg-gray-50' :
                        player.rank === 3 ? 'bg-amber-50' : 'bg-white'
                      }`}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-center w-8 h-8">
                          {getRankIcon(player.rank)}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-semibold">{player.username}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="font-bold text-lg">{player.wins}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="font-bold text-lg">{player.total_points}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
