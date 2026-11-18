import React from 'react';
import { TeacherPortalUser } from '../data/teacherAccess';
import { HierarchicalDeviceControl } from './HierarchicalDeviceControl';

import type { ControlExceptionDemo } from '../data/controlExceptionDemo';

export const SchoolDeviceControl: React.FC<{ currentUser: TeacherPortalUser; demoScenario?: ControlExceptionDemo }> = ({ currentUser, demoScenario }) => <HierarchicalDeviceControl currentUser={currentUser} demoScenario={demoScenario} />;
