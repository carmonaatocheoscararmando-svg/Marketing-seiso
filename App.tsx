import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import AdsGenerator from './modules/AdsGenerator';
import CarouselCreator from './modules/CarouselCreator';
import VideoArchitect from './modules/VideoArchitect';
import Planner from './modules/Planner';
import PhotoStudio from './modules/PhotoStudio';
import { ViewState } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('ads');

  const renderView = () => {
    switch (currentView) {
      case 'ads':
        return <AdsGenerator />;
      case 'carousel':
        return <CarouselCreator />;
      case 'video':
        return <VideoArchitect />;
      case 'studio':
        return <PhotoStudio />;
      case 'planner':
        return <Planner />;
      default:
        return <AdsGenerator />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 ml-64 transition-all duration-300">
        {renderView()}
      </main>
    </div>
  );
}

export default App;