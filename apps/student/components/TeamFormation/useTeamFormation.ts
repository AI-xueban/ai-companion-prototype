import { useState } from 'react';
import { UserTeamStatus, Squad, PBLRole } from './types';

const MOCK_USER_ID = 'user-me';
const MOCK_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo'
];

export const useTeamFormation = () => {
  const [currentSquadId, setCurrentSquadId] = useState<string | null>(null);
  
  // Mock Database
  const [squads, setSquads] = useState<Squad[]>([
    {
      id: 'sq-1',
      name: '量子纠缠观测组',
      slogan: '不仅是物理，更是哲学',
      leaderId: 'user-2',
      status: 'FORMING',
      maxMembers: 4,
      requiredRoles: ['CODER', 'RESEARCHER'],
      members: [
        { userId: 'user-2', name: '张伟', avatar: MOCK_AVATARS[1], role: 'LEADER', isReady: true, joinedAt: new Date() },
        { userId: 'user-3', name: 'Emily', avatar: MOCK_AVATARS[2], role: 'DESIGNER', isReady: true, joinedAt: new Date() }
      ]
    }
  ]);

  // Derived Status
  const currentSquad = squads.find(s => s.id === currentSquadId);
  let userStatus: UserTeamStatus = 'IDLE';
  if (currentSquad) {
      userStatus = currentSquad.status === 'LOCKED' ? 'LOCKED' : 'FORMING';
  }

  // Actions
  const createSquad = (name: string, slogan: string, requiredRoles: PBLRole[]) => {
    const newSquad: Squad = {
      id: `sq-${Date.now()}`,
      name,
      slogan,
      leaderId: MOCK_USER_ID,
      status: 'FORMING',
      maxMembers: 4,
      requiredRoles,
      members: [
        {
          userId: MOCK_USER_ID,
          name: '我 (Alex)',
          avatar: MOCK_AVATARS[0],
          role: 'LEADER',
          isReady: false,
          joinedAt: new Date()
        }
      ]
    };
    setSquads([...squads, newSquad]);
    setCurrentSquadId(newSquad.id);
  };

  const joinSquad = (squadId: string) => {
    setSquads(prev => prev.map(sq => {
      if (sq.id === squadId) {
        return {
          ...sq,
          members: [
            ...sq.members,
            {
              userId: MOCK_USER_ID,
              name: '我 (Alex)',
              avatar: MOCK_AVATARS[0],
              role: null,
              isReady: false,
              joinedAt: new Date()
            }
          ]
        };
      }
      return sq;
    }));
    setCurrentSquadId(squadId);
  };

  const leaveSquad = () => {
    if (!currentSquadId) return;
    setSquads(prev => prev.map(sq => {
        if (sq.id === currentSquadId) {
            return {
                ...sq,
                members: sq.members.filter(m => m.userId !== MOCK_USER_ID)
            };
        }
        return sq;
    }));
    setCurrentSquadId(null);
  };

  const updateRole = (role: PBLRole) => {
    if (!currentSquadId) return;
    setSquads(prev => prev.map(sq => {
        if (sq.id === currentSquadId) {
            return {
                ...sq,
                members: sq.members.map(m => m.userId === MOCK_USER_ID ? { ...m, role } : m)
            };
        }
        return sq;
    }));
  };

  const toggleReady = (isReady: boolean) => {
    if (!currentSquadId) return;
    setSquads(prev => prev.map(sq => {
        if (sq.id === currentSquadId) {
            return {
                ...sq,
                members: sq.members.map(m => m.userId === MOCK_USER_ID ? { ...m, isReady } : m)
            };
        }
        return sq;
    }));
  };

  const kickMember = (userId: string) => {
      if (!currentSquadId) return;
      setSquads(prev => prev.map(sq => {
          if (sq.id === currentSquadId) {
              return {
                  ...sq,
                  members: sq.members.filter(m => m.userId !== userId)
              };
          }
          return sq;
      }));
  };

  const lockSquad = () => {
      if (!currentSquadId) return;
      setSquads(prev => prev.map(sq => {
          if (sq.id === currentSquadId) {
              return { ...sq, status: 'LOCKED' };
          }
          return sq;
      }));
  };

  return {
      userStatus,
      currentSquad,
      currentSquadId,
      squads,
      currentUserId: MOCK_USER_ID,
      actions: {
          createSquad,
          joinSquad,
          leaveSquad,
          updateRole,
          toggleReady,
          kickMember,
          lockSquad
      }
  };
};













