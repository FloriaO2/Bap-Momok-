import React, { useState } from 'react';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const navigateTo = (screen) => {
    setCurrentScreen(screen);
  };

  const goBack = () => {
    setCurrentScreen('home');
  };

  return <HomeScreen onNavigate={navigateTo} />;
}
