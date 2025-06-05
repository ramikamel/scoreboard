
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DemoGroup } from '../AppDemo';

interface GroupDemoProps {
  mockGroups: DemoGroup[];
  setMockGroups: React.Dispatch<React.SetStateAction<DemoGroup[]>>;
}

export const GroupDemo = ({ mockGroups, setMockGroups }: GroupDemoProps) => {
  const [activeView, setActiveView] = useState('create');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const { toast } = useToast();

  const generateGroupCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive"
      });
      return;
    }

    const newCode = generateGroupCode();
    const newGroup = {
      name: groupName,
      code: newCode,
      members: 1,
      lastActive: "Just now"
    };

    setMockGroups([newGroup, ...mockGroups]);
    setGroupName('');
    
    toast({
      title: "Group Created!",
      description: `Your group "${groupName}" has been created with code: ${newCode}`,
    });
  };

  const handleJoinGroup = () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group code",
        variant: "destructive"
      });
      return;
    }

    const existingGroup = mockGroups.find(group => group.code === joinCode.toUpperCase());
    
    if (existingGroup) {
      toast({
        title: "Joined Group!",
        description: `You've joined "${existingGroup.name}"`,
      });
      setJoinCode('');
    } else {
      toast({
        title: "Group Not Found",
        description: "The group code you entered doesn't exist",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <Button 
          variant={activeView === 'create' ? 'default' : 'outline'}
          onClick={() => setActiveView('create')}
          className="flex-1"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
        <Button 
          variant={activeView === 'join' ? 'default' : 'outline'}
          onClick={() => setActiveView('join')}
          className="flex-1"
        >
          <Users className="h-4 w-4 mr-2" />
          Join Group
        </Button>
      </div>

      {activeView === 'create' && (
        <Card className="border-dashed border-2 border-blue-300 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-700">Create New Group</CardTitle>
            <CardDescription>Set up a group for your friends to join</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input 
                id="groupName" 
                placeholder="Office Champions" 
                className="mt-1"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateGroup();
                  }
                }}
              />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleCreateGroup}>
              Create Group
            </Button>
          </CardContent>
        </Card>
      )}

      {activeView === 'join' && (
        <Card className="border-dashed border-2 border-green-300 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-700">Join Existing Group</CardTitle>
            <CardDescription>Enter the group code shared by your friend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="groupCode">Group Code</Label>
              <Input 
                id="groupCode" 
                placeholder="Enter group code" 
                className="mt-1 uppercase"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleJoinGroup();
                  }
                }}
              />
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleJoinGroup}>
              Join Group
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Your Groups</h3>
        <div className="space-y-3">
          {mockGroups.map((group, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{group.name}</h4>
                      <p className="text-sm text-gray-500">Code: {group.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{group.members} members</p>
                    <p className="text-xs text-gray-500">{group.lastActive}</p>
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
