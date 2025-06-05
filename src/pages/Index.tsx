
import React from 'react';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { AppDemo } from '../components/AppDemo';
import { Header } from '../components/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <Hero />
      <Features />
      <AppDemo />
    </div>
  );
};

export default Index;
