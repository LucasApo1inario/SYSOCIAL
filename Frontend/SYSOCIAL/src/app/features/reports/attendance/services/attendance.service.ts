import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { 
  AttendanceGrid, ClassOption, CourseOption, 
  ChamadaDTO, PresencaDTO, CreateChamadaPayload, CreatePresencasPayload, 
  StudentAttendance, AttendanceRecord, AttendanceResponseDTO,
  CourseDTO, ClassDTO, StudentDTO, CreatePresencaItem
} from '../interfaces/attendance.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private http = inject(HttpClient);
  
  // URL Base do Gateway (http://IP:8080/api/v1)
  private readonly API_URL = environment.apiUrl;

  // ID do usuário para criação de chamadas (Fallback)
  private readonly loggedUserId = 2; 

  // --- LEITURA BÁSICA ---

  getCourses(): Observable<CourseOption[]> {
    // Rota: GET /cursos/all
    return this.http.get<CourseDTO[]>(`${this.API_URL}/cursos/all`).pipe(
      map(courses => courses.map(c => ({ id: c.id, name: c.nome })))
    );
  }

  getClasses(courseId: number): Observable<ClassOption[]> {
    // Rota: GET /cursos/{id}/turmas
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

  getAttendanceMatrix(classId: number, month: number, year: number): Observable<AttendanceGrid> {
    const monthStr = (month + 1).toString().padStart(2, '0');
    const periodParam = `${year}${monthStr}`;

    // Rota: GET /chamadas/{turmaId}/{anoMes}
    // Exemplo: /chamadas/1/202511
    const url = `${this.API_URL}/chamadas/${classId}/${periodParam}`;

    console.log(`[Attendance] Buscando matriz: ${url}`);

    return this.http.get<AttendanceResponseDTO>(url).pipe(
      map(response => this.mapApiToGrid(response)),
      catchError(err => {
        console.error('[Attendance] Erro ao buscar matriz:', err);
        // Retorna grade vazia em caso de erro para não quebrar a tela
        return of({ dates: [], students: [] });
      })
    );
  }

  private mapApiToGrid(apiData: AttendanceResponseDTO): AttendanceGrid {
    // Proteção contra resposta nula ou sem alunos
    if (!apiData || !apiData.alunos) {
      return { dates: [], students: [] };
    }

    // Extrai e ordena as datas
    // O backend retorna: "datas": [{ "data": "2025-11-04", "id": 13 }, ...]
    const sortedDataInfos = (apiData.datas || []).sort((a: any, b: any) => {
        const dateA = a.data;
        const dateB = b.data;
        return dateA.localeCompare(dateB);
    });
    
    // Array de strings para o cabeçalho da tabela (['2025-11-04', ...])
    const dateStrings = sortedDataInfos.map((d: any) => d.data);
    
    // Mapeia os alunos e suas presenças
    const students: StudentAttendance[] = apiData.alunos.map(aluno => {
      const attendanceMap: { [date: string]: AttendanceRecord } = {};

      if (aluno.presencas) {
        Object.keys(aluno.presencas).forEach(dateKey => {
          const apiRecord = aluno.presencas[dateKey];
          
          // Ignora a entrada com timestamp ISO se ela for duplicada/extra no JSON
          if (dateKey.includes('T')) return;

          let status = 'F'; 
          const rawPresent = String(apiRecord.present).toUpperCase().trim();
          
          if (['P', 'TRUE', 'T', '1', 'S'].includes(rawPresent)) status = 'P';
          else if (['F', 'FALSE', '0', 'N'].includes(rawPresent)) status = 'F';
          else if (rawPresent === 'FJ') status = 'FJ';
          
          if (rawPresent === '') status = '___EMPTY___';

          attendanceMap[dateKey] = {
            status: status,
            observation: apiRecord.observation || ''
          };
        });
      }

      // Cálculos de estatísticas locais
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

    return { dates: dateStrings, students: students };
  }

  // --- SALVAMENTO ---

  saveDailyAttendance(classId: number, date: string, records: StudentAttendance[]): Observable<any> {
    // 1. Busca o ID da Chamada para a data específica
    return this.findChamadaId(classId, date).pipe(
      switchMap(chamadaId => {
        
        // Prepara o payload de registros (Alunos)
        const attendanceRecords = records.map(student => {
          const record = student.attendance[date];
          let safeObs = record ? (record.observation || '') : '';
          if (safeObs === '___EMPTY___') safeObs = '';
          
          let statusEnvio = 'F';
          if (record && record.status && record.status !== '___EMPTY___') {
             statusEnvio = record.status;
          }
          
          return { 
            idEstudante: student.studentId, 
            present: statusEnvio, 
            observation: safeObs 
          };
        });

        // Cenário A: Chamada JÁ existe (temos ID)
        if (chamadaId) {
            const payload = { 
              chamadaId: chamadaId, 
              records: attendanceRecords 
            };
            // Rota: POST /presencas/turma
            return this.http.post(`${this.API_URL}/presencas/turma`, payload);
        } 
        
        // Cenário B: Chamada NÃO existe -> Cria Chamada -> Salva Presenças
        else {
            console.log(`[Save] Chamada não encontrada para ${date}. Criando...`);
            
            const newCall: CreateChamadaPayload = { 
                usuarioId: this.loggedUserId, 
                turmaId: classId, 
                dataAula: date 
            };
            
            // Rota: POST /chamadas
            return this.http.post<{ id: number }>(`${this.API_URL}/chamadas`, newCall).pipe(
                switchMap(res => {
                    const payload = { 
                      chamadaId: res.id, 
                      records: attendanceRecords 
                    };
                    // Rota: POST /presencas/turma
                    return this.http.post(`${this.API_URL}/presencas/turma`, payload);
                })
            );
        }
      })
    );
  }

  // --- HELPERS ---

  // Busca o ID da chamada usando o endpoint de lista (que retorna os IDs explicitamente)
  private findChamadaId(classId: number, dateTarget: string): Observable<number | undefined> {
    // Rota: GET /chamadas/turma/{turmaId}
    return this.http.get<ChamadaDTO[]>(`${this.API_URL}/chamadas/turma/${classId}`).pipe(
      map(chamadas => {
        if (!chamadas) return undefined;
        // Normaliza a data (apenas YYYY-MM-DD) para comparar
        const found = chamadas.find(c => c.dataAula && c.dataAula.split('T')[0] === dateTarget);
        return found ? found.id : undefined;
      }),
      catchError(err => {
        console.error('[Attendance] Erro ao buscar ID da chamada:', err);
        return of(undefined);
      })
    );
  }

  private formatTime(time: string): string {
    if (!time) return '--:--';
    if (time.includes('T')) {
        const parts = time.split('T');
        return parts[1] ? parts[1].slice(0, 5) : time.slice(0, 5);
    }
    return time.slice(0, 5);
  }
}