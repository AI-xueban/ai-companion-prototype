import React from 'react';
import { TeacherPortalUser } from '../data/teacherAccess';
import { HierarchicalDeviceControl } from './HierarchicalDeviceControl';

export const SchoolDeviceControl: React.FC<{ currentUser: TeacherPortalUser }> = ({ currentUser }) => <HierarchicalDeviceControl currentUser={currentUser} />;
