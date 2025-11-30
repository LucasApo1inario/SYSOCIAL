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
  dataInicio?: string;
  dataFim?: string;
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
  dataAula: string; // YYYY-MM-DD
}

// NOVO: Objeto de data dentro da resposta da matriz
export interface DataChamadaDTO {
  id: number;
  data: string;
}

// NOVO: Resposta completa da matriz de chamadas
export interface AttendanceResponseDTO {
  datas: DataChamadaDTO[]; 
  alunos: {
    alunoId: number;
    alunoNome: string;
    presencas: {
      [date: string]: {
        presencaId?: number; // Pode vir no JSON novo para update direto
        present: string;
        observation: string;
      }
    }
  }[];
}

export interface PresencaDTO {
  id: number;
  chamadaId: number;
  alunoId: number;
  presente: boolean;
  observacao: string;
}

export interface CreateChamadaPayload {
  usuarioId: number;
  turmaId: number;
  dataAula: string;
}

export interface CreatePresencaItem {
  idEstudante: number; // Ajustado para o padrão do endpoint novo
  present: string;     // Ajustado para string (P, F, FJ)
  observation: string;
}

export interface CreatePresencasPayload {
  chamadaId: number;
  records: CreatePresencaItem[]; // Ajustado para 'records' conforme endpoint novo
}

// --- INTERFACES VISUAIS (Mantidas para os Componentes) ---
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
  // Opcional: Mapa de IDs para facilitar salvamento
  callIds?: { [date: string]: number };
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
  status: string; // Alterado de boolean 'present' para string 'status'
  observation: string;
}

export interface AttendanceFilter {
  classId: number | null;
  courseId: number | null;
  month: number;
  year: number;
}