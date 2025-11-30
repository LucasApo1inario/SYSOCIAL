import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { 
  AttendanceGrid, ClassOption, CourseOption, 
  ChamadaDTO, PresencaDTO, CreateChamadaPayload, CreatePresencasPayload, 
  StudentAttendance, AttendanceRecord,
  CourseDTO, ClassDTO, StudentDTO, CreatePresencaItem
} from '../interfaces/attendance.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  
  private readonly COURSES_API_URL = environment.apiUrl + '/api-courses'; 
  private readonly ATTENDANCE_API_URL = environment.apiUrl + '/api-attendance';

  // --- LEITURA BÁSICA ---

  getCourses(): Observable<CourseOption[]> {
    return this.http.get<CourseDTO[]>(`${this.COURSES_API_URL}/cursos/`).pipe(
      map(courses => courses.map(c => ({ id: c.id, name: c.nome })))
    );
  }

  getClasses(courseId: number): Observable<ClassOption[]> {
    return this.http.get<{ turmas: ClassDTO[] }>(`${this.COURSES_API_URL}/cursos/${courseId}/turmas`).pipe(
      map(response => response && response.turmas ? response.turmas.map(c => {
        const start = this.formatTime(c.horaInicio);
        const end = this.formatTime(c.horaFim);
        
        let startDate: Date | undefined = undefined;
        let endDate: Date | undefined = undefined;

        if (c.dataInicio && c.dataInicio.length >= 10) startDate = new Date(c.dataInicio);
        if (c.dataFim && c.dataFim.length >= 10) endDate = new Date(c.dataFim);

        return {
          id: c.id,
          courseId: c.cursoId,
          name: c.nomeTurma,
          schedule: `${c.diaSemana} • ${start} às ${end}`,
          startDate: startDate,
          endDate: endDate
        };
      }) : [])
    );
  }

  // --- ORQUESTRADOR PRINCIPAL ---

  getAttendanceMatrix(classId: number, month: number, year: number): Observable<AttendanceGrid> {
    return this.http.get<ClassDTO>(`${this.COURSES_API_URL}/turmas/${classId}`).pipe(
      switchMap(turma => {
        console.log(`[Auto-Create] Analisando Turma ID ${classId} (${turma.nomeTurma}) para ${month + 1}/${year}`);
        
        const expectedDates = this.calculateExpectedDates(turma, month, year);
        console.log(`[Auto-Create] Datas válidas encontradas:`, expectedDates);
        
        return this.syncCalls(turma.id, expectedDates).pipe(
          switchMap(() => {
            return this.loadFullData(classId, expectedDates);
          })
        );
      })
    );
  }

  // --- SINCRONIZAÇÃO (AUTO-CREATE) ---

  private syncCalls(classId: number, expectedDates: string[]): Observable<any> {
    return this.http.get<ChamadaDTO[]>(`${this.ATTENDANCE_API_URL}/chamadas/turma/${classId}`).pipe(
      catchError(() => of([])),
      switchMap(existingCalls => {
        const existingDates = new Set((existingCalls || []).map(c => c.dataAula.split('T')[0]));
        const missingDates = expectedDates.filter(date => !existingDates.has(date));

        if (missingDates.length === 0) return of(true);

        console.log(`[Auto-Create] Criando ${missingDates.length} chamadas...`, missingDates);

        const createRequests = missingDates.map(date => {
          const payload: CreateChamadaPayload = {
            usuarioId: 2, 
            turmaId: classId,
            dataAula: date
          };
          return this.http.post(`${this.ATTENDANCE_API_URL}/chamadas/`, payload).pipe(
             catchError(err => {
                 console.error(`[Auto-Create] Erro ao criar chamada para ${date}:`, err);
                 return of(null); 
             })
          );
        });

        return forkJoin(createRequests);
      })
    );
  }

  // --- CARREGAMENTO ---

  private loadFullData(classId: number, expectedDates: string[]): Observable<AttendanceGrid> {
    const students$ = this.http.get<StudentDTO[]>(`${this.COURSES_API_URL}/turmas/${classId}/alunos`).pipe(map(s => s || []));
    const calls$ = this.http.get<ChamadaDTO[]>(`${this.ATTENDANCE_API_URL}/chamadas/turma/${classId}`).pipe(
      catchError(() => of([]))
    );

    return forkJoin({
      students: students$,
      allCalls: calls$
    }).pipe(
      switchMap(({ students, allCalls }) => {
        const targetDatesSet = new Set(expectedDates);
        const relevantCalls = (allCalls || []).filter(c => {
            if (!c.dataAula) return false;
            return targetDatesSet.has(c.dataAula.split('T')[0]);
        });

        const presencasRequests = relevantCalls.map(c => 
          this.http.get<PresencaDTO[]>(`${this.ATTENDANCE_API_URL}/presencas/chamada/${c.id}`).pipe(
            map(presencas => ({ chamada: c, presencas: presencas || [] })),
            catchError(() => of({ chamada: c, presencas: [] }))
          )
        );

        if (presencasRequests.length === 0) {
           return of(this.buildGrid(expectedDates, students, []));
        }

        return forkJoin(presencasRequests).pipe(
          map(results => this.buildGrid(expectedDates, students, results))
        );
      })
    );
  }

  // --- CÁLCULO DE DATAS (REVERTIDO PARA STRICT) ---

  private calculateExpectedDates(turma: ClassDTO, month: number, year: number): string[] {
    const dates: string[] = [];
    const targetDay = this.mapDayOfWeek(turma.diaSemana);
    
    if (targetDay === -1) return [];

    const startStr = (turma.dataInicio && turma.dataInicio.length >= 10) ? turma.dataInicio.split('T')[0] : '1900-01-01';
    const endStr = (turma.dataFim && turma.dataFim.length >= 10) ? turma.dataFim.split('T')[0] : '2100-01-01';

    const m = Number(month);
    const y = Number(year);
    const date = new Date(y, m, 1, 12, 0, 0);
    
    while (date.getMonth() === m) {
      if (date.getDay() === targetDay) {
          const currentStr = date.toISOString().split('T')[0];
          
          if (currentStr >= startStr && currentStr <= endStr) {
              dates.push(currentStr);
          } else {
              console.log(`[Calendário] Data ${currentStr} ignorada (fora de vigência: ${startStr} a ${endStr})`);
          }
      }
      date.setDate(date.getDate() + 1);
    }

    return dates;
  }

  private mapDayOfWeek(dayName: string): number {
    if (!dayName) return -1;
    const normalized = dayName.toLowerCase().trim();
    if (normalized.includes('domingo')) return 0;
    if (normalized.includes('segunda')) return 1;
    if (normalized.includes('terça') || normalized.includes('terca')) return 2;
    if (normalized.includes('quarta')) return 3;
    if (normalized.includes('quinta')) return 4;
    if (normalized.includes('sexta')) return 5;
    if (normalized.includes('sábado') || normalized.includes('sabado')) return 6;
    return -1;
  }

  private formatTime(time: string): string {
    if (!time) return '--:--';
    if (time.includes('T')) {
        const parts = time.split('T');
        return parts[1] ? parts[1].slice(0, 5) : time.slice(0, 5);
    }
    return time.slice(0, 5);
  }

  // --- SALVAMENTO E HELPERS (Mantidos) ---

  saveDailyAttendance(classId: number, date: string, records: StudentAttendance[]): Observable<any> {
    return this.findChamada(classId, date).pipe(
      switchMap(existingCall => {
        const presencasPayload: CreatePresencaItem[] = records.map(student => {
          const record = student.attendance[date];
          let safeObs = record ? (record.observation || '') : '';
          if (safeObs === '___EMPTY___') safeObs = '';
          
          let statusEnvio = 'F';
          if (record && record.status && record.status !== '___EMPTY___') {
             statusEnvio = record.status;
          }
          return { alunoId: student.studentId, presente: statusEnvio, observacao: safeObs };
        });

        if (existingCall) {
          return this.http.delete(`${this.ATTENDANCE_API_URL}/presencas/chamada/${existingCall.id}`).pipe(
            switchMap(() => {
              const payload: CreatePresencasPayload = { chamadaId: existingCall.id, presencas: presencasPayload };
              return this.http.post(`${this.ATTENDANCE_API_URL}/presencas/`, payload);
            })
          );
        } else {
            const newCall: CreateChamadaPayload = { usuarioId: 2, turmaId: classId, dataAula: date };
            return this.http.post<{ id: number }>(`${this.ATTENDANCE_API_URL}/chamadas/`, newCall).pipe(
            switchMap(res => {
              const payload: CreatePresencasPayload = { chamadaId: res.id, presencas: presencasPayload };
              return this.http.post(`${this.ATTENDANCE_API_URL}/presencas/`, payload);
            })
          );
        }
      })
    );
  }

  private findChamada(classId: number, date: string): Observable<ChamadaDTO | undefined> {
    return this.http.get<ChamadaDTO[]>(`${this.ATTENDANCE_API_URL}/chamadas/turma/${classId}`).pipe(
      map(chamadas => {
          if (!chamadas) return undefined;
          return chamadas.find(c => c.dataAula && c.dataAula.split('T')[0] === date);
      }),
      catchError(() => of(undefined))
    );
  }

  private buildEmptyGrid(students: StudentDTO[]): AttendanceGrid {
    return {
      dates: [],
      students: students.map(s => ({
        studentId: s.id,
        studentName: s.nome,
        attendance: {},
        stats: { presents: 0, absences: 0, justified: 0 }
      }))
    };
  }

  private buildGrid(dates: string[], students: StudentDTO[], results: {chamada: ChamadaDTO, presencas: PresencaDTO[]}[]): AttendanceGrid {
    const grid: AttendanceGrid = {
      dates: dates,
      students: students.map(s => ({
        studentId: s.id,
        studentName: s.nome,
        attendance: {},
        stats: { presents: 0, absences: 0, justified: 0 }
      }))
    };

    results.forEach(item => {
      const dateKey = item.chamada.dataAula.split('T')[0];
      const listaPresencas = item.presencas || [];

      listaPresencas.forEach(p => {
        const studentRow = grid.students.find(s => String(s.studentId) === String(p.alunoId));
        if (studentRow) {
          let rawStatus = String(p.presente).toUpperCase().trim();
          let finalStatus = 'F';
          if (['P', 'TRUE', 'T', '1', 'S', 'SIM'].includes(rawStatus)) finalStatus = 'P';
          else if (['F', 'FALSE', '0', 'N', 'NAO'].includes(rawStatus)) finalStatus = 'F';
          else if (rawStatus === 'FJ') finalStatus = 'FJ';

          studentRow.attendance[dateKey] = {
            presenceId: p.id,
            callId: item.chamada.id,
            status: finalStatus,
            observation: p.observacao
          };
        }
      });
    });

    grid.students.forEach(row => {
      const records = Object.values(row.attendance);
      row.stats.presents = records.filter(r => r.status === 'P').length;
      row.stats.justified = records.filter(r => r.status === 'FJ').length;
      row.stats.absences = records.filter(r => r.status === 'F').length;
    });

    return grid;
  }
}