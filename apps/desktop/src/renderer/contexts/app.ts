import { createContext, useContext } from 'react';

interface AppContext {}

export const AppContext = createContext<AppContext>({} as AppContext);

export const useApp = () => useContext(AppContext);
