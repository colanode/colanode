import { Outlet } from 'react-router-dom';
import { RadarProvider } from '@/renderer/radar-provider';

export const App = () => {
  return (
    <RadarProvider>
      <Outlet />
    </RadarProvider>
  );
};
