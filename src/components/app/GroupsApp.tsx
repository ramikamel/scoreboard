
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Hash } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  code: string;
  created_at: string;
  member_count?: number;
}

interface GroupsAppProps {
  onGroupSelect: (groupId: string) => void;
  selectedGroupId?: string | null;
  onGroupClear?: () => void;
}

export const GroupsApp = ({ onGroupSelect, selectedGroupId, onGroupClear }: GroupsAppProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;
    
    try {
      // Step 1: Get group memberships for current user
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError) {
        console.error('Error fetching memberships:', memberError);
        toast({
          title: "Error", 
          description: `Failed to load group memberships: ${memberError.message}`,
          variant: "destructive"
        });
        setGroups([]);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setGroups([]);
        return;
      }

      // Step 2: Get group details for each membership
      const groupIds = memberships.map(m => m.group_id);
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name, code, created_at')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        toast({
          title: "Error",
          description: "Failed to load groups",
          variant: "destructive"
        });
        setGroups([]);
        return;
      }

      // Step 3: Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count, error: countError } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          if (countError) {
            console.error('Error getting member count for group', group.id, ':', countError);
          }

          return {
            ...group,
            member_count: count || 0
          };
        })
      );

      setGroups(groupsWithCounts);

      // Auto-select first group if no group is selected and groups exist
      if (!selectedGroupId && groupsWithCounts.length > 0) {
        onGroupSelect(groupsWithCounts[0].id);
      }
      // Check if the currently selected group is still valid
      else if (selectedGroupId && onGroupClear) {
        const isSelectedGroupValid = groupsWithCounts.some(group => group.id === selectedGroupId);
        if (!isSelectedGroupValid) {
          onGroupClear();
          // Auto-select first group if invalid group was cleared and groups exist
          if (groupsWithCounts.length > 0) {
            onGroupSelect(groupsWithCounts[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast({
        title: "Error",
        description: "Failed to load groups",
        variant: "destructive"
      });
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return;

    setIsCreating(true);
    try {
      // Generate a random code
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let code = generateCode();
      let attempts = 0;
      
      // Try to create group with unique code
      while (attempts < 10) {
        try {
          const { data: group, error } = await supabase
            .from('groups')
            .insert({
              name: newGroupName.trim(),
              code: code,
              created_by: user.id
            })
            .select()
            .single();

          if (error) {
            if (error.code === '23505') { // Unique constraint violation
              code = generateCode();
              attempts++;
              continue;
            }
            throw error;
          }

          // Add creator as member
          const { error: memberError } = await supabase
            .from('group_members')
            .insert({
              group_id: group.id,
              user_id: user.id
            });

          if (memberError) {
            console.error('Error adding creator as member:', memberError);
            throw memberError;
          }

          setNewGroupName('');
          onGroupSelect(group.id); // Auto-select the newly created group
          fetchGroups();
          toast({
            title: "Success",
            description: `Group "${group.name}" created successfully! Code: ${group.code}`
          });
          break;
        } catch (innerError) {
          if (attempts >= 9) throw innerError;
          attempts++;
        }
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: `Failed to create group: ${error.message || 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinGroup = async () => {
    if (!joinCode.trim() || !user) return;

    setIsJoining(true);
    try {
      // Find group by code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('code', joinCode.trim().toUpperCase())
        .single();

      if (groupError) {
        console.error('Group not found:', groupError);
        throw new Error('Group not found');
      }

      console.log('Found group:', group);

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: `You're already a member of "${group.name}"`
        });
        setJoinCode('');
        return;
      }

      // Join group
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        });

      if (joinError) {
        console.error('Error joining group:', joinError);
        throw joinError;
      }

      setJoinCode('');
      onGroupSelect(group.id); // Auto-select the newly joined group
      fetchGroups();
      toast({
        title: "Success",
        description: `Joined group "${group.name}" successfully!`
      });
    } catch (error) {
      console.error('Error joining group:', error);
      toast({
        title: "Error",
        description: "Failed to join group. Check the code and try again.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const removeFromGroup = async (groupId: string, groupName: string) => {
    if (!user) return;

    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to leave the group "${groupName}"?`);
    if (!confirmed) return;

    try {
      console.log('Removing user from group:', groupId);
      
      // Remove user from group_members table
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing from group:', error);
        throw error;
      }

      // If this was the selected group, we'll auto-select first available group after refresh
      const wasSelectedGroup = selectedGroupId === groupId;
      if (wasSelectedGroup && onGroupClear) {
        onGroupClear();
      }

      // Refresh the groups list
      await fetchGroups();
      
      // If we removed the selected group, auto-select first available group
      if (wasSelectedGroup) {
        // Get updated groups list to auto-select first one
        const { data: updatedMemberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);
        
        if (updatedMemberships && updatedMemberships.length > 0) {
          const { data: firstGroup } = await supabase
            .from('groups')
            .select('id')
            .eq('id', updatedMemberships[0].group_id)
            .single();
          
          if (firstGroup) {
            onGroupSelect(firstGroup.id);
          }
        }
      }
      
      toast({
        title: "Success",
        description: `You have left the group "${groupName}"`
      });
    } catch (error) {
      console.error('Error removing from group:', error);
      toast({
        title: "Error",
        description: "Failed to leave group. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading groups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                onKeyDown={(e) => e.key === 'Enter' && createGroup()}
              />
            </div>
            <Button 
              onClick={createGroup} 
              disabled={!newGroupName.trim() || isCreating}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Create Group'}
            </Button>
          </CardContent>
        </Card>

        {/* Join Group */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Join Group
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="joinCode">Group Code</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter group code"
                onKeyDown={(e) => e.key === 'Enter' && joinGroup()}
              />
            </div>
            <Button 
              onClick={joinGroup} 
              disabled={!joinCode.trim() || isJoining}
              className="w-full"
            >
              {isJoining ? 'Joining...' : 'Join Group'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Groups List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Groups</h3>
        {groups.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No groups yet. Create one or join using a group code!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Card 
                key={group.id} 
                className={`hover:shadow-md transition-shadow ${selectedGroupId === group.id ? 'border-blue-500 shadow-md' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="cursor-pointer" onClick={() => onGroupSelect(group.id)}>
                      <h4 className="font-semibold">{group.name}</h4>
                      <p className="text-sm text-gray-600">
                        Code: {group.code} • {group.member_count} members
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant={selectedGroupId === group.id ? "default" : "outline"} 
                        size="sm"
                        onClick={() => onGroupSelect(group.id)}
                      >
                        {selectedGroupId === group.id ? "Selected" : "Select"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromGroup(group.id, group.name);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
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
