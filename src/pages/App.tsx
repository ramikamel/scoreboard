
import React from 'react';
import { Header } from '../components/Header';
import { AppMain } from '../components/app/AppMain';

const AppPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <AppMain />
    </div>
  );
};

export default AppPage;
