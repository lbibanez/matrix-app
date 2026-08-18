import { createContext, useContext, type RefObject } from 'react';

export const ScrollContext = createContext<RefObject<HTMLElement | null>>({ current: null });
export const useScrollContainer = () => useContext(ScrollContext);
