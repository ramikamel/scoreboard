
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Target } from 'lucide-react';

export const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-green-600 text-white">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="flex space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Trophy className="h-8 w-8" />
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Users className="h-8 w-8" />
              </div>
              <div className="bg-white/20 p-3 rounded-full">
                <Target className="h-8 w-8" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Scoreboard
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Track game results with friends. Simple, fast, and customizable for any game.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3"
              onClick={() => {
                document.getElementById('app-demo')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Try Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
