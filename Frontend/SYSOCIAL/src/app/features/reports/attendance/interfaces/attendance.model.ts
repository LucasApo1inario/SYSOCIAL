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

// --- DTOs da API de Chamadas (Porta 8086) ---
export interface ChamadaDTO {
  id: number;
  usuarioId: number;
  turmaId: number;
  dataAula: string; // YYYY-MM-DD
}

// Objeto de data dentro da resposta da matriz
export interface DataChamadaDTO {
  id: number;       // ID da Chamada
  data: string;     // YYYY-MM-DD
}

// Resposta completa da matriz de chamadas
export interface AttendanceResponseDTO {
  datas: DataChamadaDTO[]; 
  alunos: {
    alunoId: number;
    alunoNome: string;
    presencas: {
      [date: string]: {
        present: string;
        observation: string;
      }
    }
  }[];
}

// Payload para Upsert (Salvar Presenças)
export interface UpsertPresencaRecord {
  idEstudante: number; 
  present: string;    
  observation: string;
}

export interface UpsertPresencasPayload {
  chamadaId: number;
  records: UpsertPresencaRecord[];
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
  dates: string[]; // Lista de datas para colunas da tabela
  students: StudentAttendance[]; // Dados dos alunos
  dateIdMap: { [date: string]: number }; // Data (YYYY-MM-DD) -> ID da Chamada
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
  status: string; 
  observation: string;
}

export interface AttendanceFilter {
  classId: number | null;
  courseId: number | null;
  month: number;
  year: number;
}