
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Trophy, Target, Plus } from 'lucide-react';

export const Features = () => {
  const features = [
    {
      icon: Users,
      title: "Group Management",
      description: "Create groups with unique codes. Friends join instantly and start tracking games together."
    },
    {
      icon: Target,
      title: "Custom Game Modes",
      description: "Configure any game type - ping pong, foosball, UNO. Set team sizes and scoring rules."
    },
    {
      icon: Plus,
      title: "Quick Result Entry",
      description: "Log match results in seconds. Select players, enter scores, and let the app calculate winners."
    },
    {
      icon: Trophy,
      title: "Live Scoreboards",
      description: "Track wins, losses, points, and win percentages. See who's leading in real-time."
    }
  ];

  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything you need to track games
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built for speed and simplicity. No complex setup, just pure game tracking fun.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center">
                <div className="mx-auto bg-gradient-to-br from-blue-500 to-green-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
