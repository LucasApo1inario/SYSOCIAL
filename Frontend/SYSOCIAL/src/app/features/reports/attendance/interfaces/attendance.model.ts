// --- DTOs da API de Cursos/Turmas (Porta 8085) ---
export interface CourseDTO {
  id: number;
  nome: string;
  vagasTotais: number;
  ativo: boolean;
}

export interface ClassDTO {
  id: number;
  cursoId: number;
  nomeTurma: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  descricao?: string;
  dataInicio?: string; // YYYY-MM-DD
  dataFim?: string;    // YYYY-MM-DD
}

export interface StudentDTO {
  id: number;
  nome: string;
}

// --- DTOs da API de Chamadas (Porta 8086) ---
export interface ChamadaDTO {
  id: number;
  usuarioId: number;
  turmaId: number;
  dataAula: string; 
}

export interface PresencaDTO {
  id: number;
  chamadaId: number;
  alunoId: number;
  presente: string; 
  observacao: string;
}

export interface CreateChamadaPayload {
  usuarioId?: number;
  turmaId: number;
  dataAula: string;
}

export interface CreatePresencaItem {
  alunoId: number;
  presente: string; 
  observacao: string;
}

export interface CreatePresencasPayload {
  chamadaId: number;
  presencas: CreatePresencaItem[];
}

// --- INTERFACES VISUAIS ---
export interface CourseOption {
  id: number;
  name: string;
}

export interface ClassOption {
  id: number;
  courseId: number;
  name: string;
  schedule: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AttendanceGrid {
  dates: string[];
  students: StudentAttendance[];
}

export interface StudentAttendance {
  studentId: number;
  studentName: string;
  attendance: { [date: string]: AttendanceRecord };
  stats: {
    presents: number;
    absences: number;
    justified: number;
  };
}

export interface AttendanceRecord {
  presenceId?: number;
  callId?: number;
  status: string; 
  observation: string;
}

export interface AttendanceFilter {
  classId: number | null;
  courseId: number | null;
  month: number;
  year: number;
}