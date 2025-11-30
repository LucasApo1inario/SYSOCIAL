import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  AttendanceGrid, ClassOption, CourseOption, 
  AttendanceResponseDTO, UpsertPresencasPayload,
  CourseDTO, ClassDTO, StudentAttendance, AttendanceRecord
} from '../interfaces/attendance.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  
  private readonly API_URL = environment.apiUrl;

  // --- LEITURA BÁSICA ---

  getCourses(): Observable<CourseOption[]> {
    return this.http.get<CourseDTO[]>(`${this.API_URL}/cursos/all`).pipe(
      map(courses => courses.map(c => ({ id: c.id, name: c.nome })))
    );
  }

  getClasses(courseId: number): Observable<ClassOption[]> {
    return this.http.get<{ turmas: ClassDTO[] }>(`${this.API_URL}/cursos/${courseId}/turmas`).pipe(
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

  // --- LEITURA DA MATRIZ (GRADE) ---

  getAttendanceMatrix(classId: number, month: number, year: number, classRange?: { start?: Date, end?: Date }): Observable<AttendanceGrid> {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const periodParam = `${year}${monthStr}`;
    
    const userIdPlaceholder = 2; 

    const url = `${this.API_URL}/chamadas/${classId}/${periodParam}`;

    console.log(`[Attendance] Buscando matriz: ${url}`);

    return this.http.get<AttendanceResponseDTO>(url).pipe(
      map(response => this.mapApiToGrid(response, classRange)),
      catchError(err => {
        console.error('[Attendance] Erro ao buscar matriz:', err);
        return of({ dates: [], students: [], dateIdMap: {} });
      })
    );
  }

  private mapApiToGrid(apiData: AttendanceResponseDTO, classRange?: { start?: Date, end?: Date }): AttendanceGrid {
    if (!apiData || !apiData.alunos) {
      return { dates: [], students: [], dateIdMap: {} };
    }

    const sortedDataInfos = (apiData.datas || []).sort((a, b) => {
        return a.data.localeCompare(b.data);
    });

    const dates: string[] = [];
    const dateIdMap: { [date: string]: number } = {};

    sortedDataInfos.forEach(info => {
      // Normaliza data da coluna
      const cleanDate = info.data.split('T')[0];
      
      // === LÓGICA DE FILTRO DE DATAS ===
      if (classRange) {
        const currentDate = new Date(cleanDate);
        currentDate.setHours(0, 0, 0, 0);

        if (classRange.start) {
          const start = new Date(classRange.start);
          start.setHours(0, 0, 0, 0);
          if (currentDate < start) return; // Data anterior ao início da turma
        }

        if (classRange.end) {
          const end = new Date(classRange.end);
          end.setHours(0, 0, 0, 0);
          if (currentDate > end) return; // Data posterior ao fim da turma
        }
      }

      dates.push(cleanDate);
      dateIdMap[cleanDate] = info.id; 
    });

    const students: StudentAttendance[] = apiData.alunos.map(aluno => {
      const attendanceMap: { [date: string]: AttendanceRecord } = {};

      if (aluno.presencas) {
        Object.keys(aluno.presencas).forEach(dateKey => {
          const apiRecord = aluno.presencas[dateKey];
          const cleanKey = dateKey.split('T')[0];

          if (!dateIdMap[cleanKey]) return;

          let status = 'F'; 
          const rawPresent = String(apiRecord.present).toUpperCase().trim();
          
          if (['P', 'TRUE', 'T', '1', 'S'].includes(rawPresent)) status = 'P';
          else if (['F', 'FALSE', '0', 'N'].includes(rawPresent)) status = 'F';
          else if (rawPresent === 'FJ') status = 'FJ';
          
          if (rawPresent === '') status = '___EMPTY___';

          attendanceMap[cleanKey] = {
            status: status,
            observation: apiRecord.observation || ''
          };
        });
      }

      // Estatísticas (Recalculadas apenas com as datas visíveis)
      const records = Object.values(attendanceMap);
      const stats = {
        presents: records.filter(r => r.status === 'P').length,
        justified: records.filter(r => r.status === 'FJ').length,
        absences: records.filter(r => r.status === 'F').length
      };

      return {
        studentId: aluno.alunoId,
        studentName: aluno.alunoNome,
        attendance: attendanceMap,
        stats: stats
      };
    });

    return { dates, students, dateIdMap };
  }

  // --- SALVAMENTO ---

  saveAttendanceForCall(callId: number, records: StudentAttendance[], date: string): Observable<any> {
    const payloadRecords = records.map(student => {
      const record = student.attendance[date];
      
      let safeObs = '';
      let statusEnvio = 'F'; 

      if (record) {
        if (record.observation && record.observation !== '___EMPTY___') {
          safeObs = record.observation;
        }
        if (record.status && record.status !== '___EMPTY___') {
          statusEnvio = record.status;
        }
      }
      
      if (statusEnvio === '___EMPTY___') statusEnvio = 'F'; 

      return { 
        idEstudante: student.studentId, 
        present: statusEnvio, 
        observation: safeObs 
      };
    });

    const payload: UpsertPresencasPayload = {
      chamadaId: callId,
      records: payloadRecords
    };

    return this.http.post(`${this.API_URL}/presencas/turma`, payload);
  }

  // --- HELPERS ---
  private formatTime(time: string): string {
    if (!time) return '--:--';
    if (time.includes('T')) {
        const parts = time.split('T');
        return parts[1] ? parts[1].slice(0, 5) : time.slice(0, 5);
    }
    return time.slice(0, 5);
  }
}