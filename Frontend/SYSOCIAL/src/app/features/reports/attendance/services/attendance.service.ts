import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { AttendanceGrid, ClassOption, CourseOption } from '../interfaces/attendance.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  // Mocks
  private courses: CourseOption[] = [
    { id: 1, name: 'Ensino Fundamental I' },
    { id: 2, name: 'Curso Extra: Robótica' }
  ];

  private classes: ClassOption[] = [
    { id: 101, courseId: 1, name: '1º Ano A', schedule: 'Seg - Sex, 07:30' },
    { id: 102, courseId: 1, name: '1º Ano B', schedule: 'Seg - Sex, 13:30' },
    { id: 201, courseId: 2, name: 'Turma Avançada', schedule: 'Terça-feira, 9h às 10h' } // Do wireframe
  ];

  getCourses(): Observable<CourseOption[]> {
    return of(this.courses).pipe(delay(300));
  }

  getClasses(courseId: number): Observable<ClassOption[]> {
    const filtered = this.classes.filter(c => c.courseId === Number(courseId));
    return of(filtered).pipe(delay(300));
  }

  // Busca a matriz de frequência para o mês
  getAttendanceMatrix(classId: number, month: number, year: number): Observable<AttendanceGrid> {
    // Simulando datas de aulas no mês (ex: todas as terças)
    const dates = ['2025-11-01', '2025-11-08', '2025-11-15', '2025-11-23', '2025-11-30'];
    
    const mockData: AttendanceGrid = {
      dates: dates,
      students: [
        { 
          studentId: 1, studentName: 'Ana Clara', 
          stats: { presents: 5, absences: 0, justified: 0 },
          attendance: {
            '2025-11-01': { present: true, observation: '' },
            '2025-11-08': { present: true, observation: '' },
            '2025-11-15': { present: true, observation: '' },
            '2025-11-23': { present: true, observation: '' },
            '2025-11-30': { present: true, observation: '' },
          }
        },
        { 
          studentId: 2, studentName: 'Bruno Silva', 
          stats: { presents: 0, absences: 5, justified: 0 },
          attendance: {
            '2025-11-01': { present: false, observation: '' }, // F
            '2025-11-08': { present: false, observation: '' }, // F
            '2025-11-15': { present: false, observation: '' }, // F
            '2025-11-23': { present: false, observation: '' }, // F
            '2025-11-30': { present: false, observation: '' }, // F
          }
        },
        { 
          studentId: 3, studentName: 'Carlos Oliveira', 
          stats: { presents: 0, absences: 0, justified: 5 },
          attendance: {
            '2025-11-01': { present: false, observation: 'Atestado Médico' }, // J
            '2025-11-08': { present: false, observation: 'Atestado Médico' }, // J
            '2025-11-15': { present: false, observation: 'Viagem autorizada' }, // J
            '2025-11-23': { present: false, observation: 'Viagem' }, // J
            '2025-11-30': { present: false, observation: 'Viagem' }, // J
          }
        }
      ]
    };

    return of(mockData).pipe(delay(500));
  }

  saveAttendance(payload: any): Observable<boolean> {
    console.log('Salvando no banco (Tabela Presenca):', payload);
    return of(true).pipe(delay(500));
  }
}