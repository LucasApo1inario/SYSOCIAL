// Estrutura para os filtros
export interface CourseOption {
  id: number;
  name: string;
}

export interface ClassOption {
  id: number;
  courseId: number;
  name: string;
  schedule: string; // Ex: "Terça-feira, 9h às 10h"
}

// Estrutura de visualização (Matriz)
export interface AttendanceGrid {
  dates: string[]; // Cabeçalho das datas: ["2025-11-01", "2025-11-08"...]
  students: StudentAttendanceRow[];
}

export interface StudentAttendanceRow {
  studentId: number;
  studentName: string;
  // Mapa: Chave é a data (YYYY-MM-DD), Valor é o registro de presença
  attendance: { [date: string]: AttendanceRecord }; 
  stats: {
    presents: number;
    absences: number;
    justified: number;
  };
}

export interface AttendanceRecord {
  presenceId?: number; // id_presenca (se já existir no banco)
  callId?: number;     // id_chamada
  present: boolean;    // Mapeia para coluna 'presente'
  observation: string; // Mapeia para coluna 'observacao'
}

// Payload para salvar (Batch update)
export interface SaveAttendancePayload {
  classId: number;
  date: string;
  records: {
    studentId: number;
    present: boolean;
  }[];
}