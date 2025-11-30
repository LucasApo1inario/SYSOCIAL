import { Routes } from '@angular/router';
import { AttendanceEntryPage } from './attendance/pages/attendance-entry.page';
import { AttendanceManagerPage } from './attendance/pages/attendance-manager.page';

export default [
  {
    path: 'attendance-entry',            
    component: AttendanceEntryPage,
  },
  {
    path: 'attendance-manager',
    component: AttendanceManagerPage
  }
] as Routes;