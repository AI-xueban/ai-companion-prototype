import { createContext, useContext } from 'react';
import type { RewardGrantResult } from '../../types/reward';

export const RewardGrantContext = createContext<((result: RewardGrantResult) => void) | undefined>(undefined);
export const useRewardGranted = () => useContext(RewardGrantContext);
