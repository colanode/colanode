import { Outlet } from 'react-router-dom';
import { AppContext } from '@/renderer/contexts/app';
import { RadarProvider } from '@/renderer/radar-provider';

export const App = () => {
  return (
    <AppContext.Provider value={{}}>
      <RadarProvider>
        <Outlet />
      </RadarProvider>
    </AppContext.Provider>
  );
};
