import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserTeamStatus, Squad, PBLRole } from './types';
import { LobbyView } from './LobbyView';
import { SquadRoomView } from './SquadRoomView';
import { LockedBadgeView } from './LockedBadgeView';

interface TeamFormationModalProps {
  onClose: () => void;
  userStatus: UserTeamStatus;
  currentSquad: Squad | undefined;
  squads: Squad[];
  currentUserId: string;
  actions: {
    createSquad: (name: string, slogan: string, requiredRoles: PBLRole[]) => void;
    joinSquad: (squadId: string) => void;
    leaveSquad: () => void;
    updateRole: (role: PBLRole) => void;
    toggleReady: (isReady: boolean) => void;
    kickMember: (userId: string) => void;
    lockSquad: () => void;
  };
}

export const TeamFormationModal: React.FC<TeamFormationModalProps> = ({ 
    onClose,
    userStatus,
    currentSquad,
    squads,
    currentUserId,
    actions
}) => {
  return (
    <motion.div 
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="absolute top-16 right-8 w-[480px] h-[600px] bg-[#0f1115] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
    >
        {/* Close Button (Absolute) */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-1 rounded-full bg-black/20 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
            <X size={16} />
        </button>

        {/* View Switcher */}
        <div className="flex-1 overflow-hidden relative">
            {userStatus === 'IDLE' && (
                <LobbyView 
                    squads={squads.filter(s => s.status === 'FORMING')}
                    onCreateSquad={actions.createSquad}
                    onJoinSquad={actions.joinSquad}
                />
            )}

            {userStatus === 'FORMING' && currentSquad && (
                <SquadRoomView 
                    squad={currentSquad}
                    currentUserId={currentUserId}
                    onUpdateRole={actions.updateRole}
                    onToggleReady={actions.toggleReady}
                    onLeaveSquad={actions.leaveSquad}
                    onKickMember={actions.kickMember}
                    onLockSquad={actions.lockSquad}
                />
            )}

            {userStatus === 'LOCKED' && currentSquad && (
                <LockedBadgeView squad={currentSquad} />
            )}
        </div>
    </motion.div>
  );
};
