import { Routes } from '@angular/router';
import { AttendanceEntryPage } from './attendance/pages/attendance-entry.page';
import { AttendanceListPage } from './attendance/pages/attendance-list.page';

export default [
  {
    path: 'attendance-entry',            
    component: AttendanceEntryPage,
  },
  {
    path: 'attendance-list',
    component: AttendanceListPage
  }
] as Routes;