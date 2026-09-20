// 角色定义（预设的PBL角色池）
export type PBLRole = 'LEADER' | 'RESEARCHER' | 'DESIGNER' | 'CODER' | 'SPEAKER';

// 小队状态
export type SquadStatus = 'FORMING' | 'PENDING_APPROVAL' | 'LOCKED';

// 成员对象
export interface SquadMember {
  userId: string;
  name: string;
  avatar: string;
  role: PBLRole | null; // 当前在组内承担的角色
  isReady: boolean;     // 是否已点击准备
  joinedAt: Date;
}

// 小队对象
export interface Squad {
  id: string;
  name: string;
  slogan: string;
  leaderId: string;     // 队长ID
  status: SquadStatus;
  members: SquadMember[];
  maxMembers: number;   // 通常为4-6人
  requiredRoles: PBLRole[]; // 招募需求
}

// 用户当前状态（用于前端展示逻辑）
export type UserTeamStatus = 'IDLE' | 'FORMING' | 'LOCKED';













