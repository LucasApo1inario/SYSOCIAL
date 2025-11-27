// --- RESPOSTAS DO BACKEND (GET) ---

export interface ClassOption {
  id: number;
  name: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  spots: number;
  description: string;
}

export interface CourseOption {
  id: number;
  name: string;
  totalSpots: number;
  availableSpots: number;
  classes: ClassOption[];
}

// --- DTOs PARA LISTAGEM DE ALUNOS ---

export interface StudentSummary {
  id: number;
  fullName: string;
  cpf: string;
  age: number;
  gender: string; // 'M' | 'F'
  courseName: string;
  className: string;
  shift: string; // 'manha' | 'tarde' | 'integral'
  status: string; // 'ATIVO' | 'INATIVO'
  enrollmentDate: string;
}

export interface StudentFilter {
  name?: string;
  cpf?: string;
  courseId?: string;
  classId?: string;
  shift?: string;
  status?: string;
}

// --- ENVIOS PARA O BACKEND DE MATRÍCULA (Porta 8084) ---

export interface StudentPayload {
  fullName: string;
  birthDate: string;
  cpf: string;
  phone: string;
  gender: string;
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  currentSchool: string;
  series: string;
  schoolShift: string;
  observation?: string; 
}

export interface GuardianPayload {
  fullName: string;
  cpf: string;
  relationship: string;
  phone: string;
  phoneContact: string;
  messagePhone1: string;
  messagePhone1Contact: string;
  messagePhone2: string;
  messagePhone2Contact: string;
  isPrincipal: boolean;
}

export interface CourseEnrollmentPayload {
  courseId: string;
  classId: string;
}

export interface DocumentPayload {
  type: string;
  fileName: string;
  observation?: string;
}

export interface EnrollmentPayload {
  student: StudentPayload;
  guardians: GuardianPayload[];
  courses: CourseEnrollmentPayload[];
  documents: DocumentPayload[];
}

// --- ENVIO PARA O BACKEND DE ARQUIVOS (Porta 8083) ---

export interface FileUploadRequest {
  entidade_pai: string;
  id_entidade_pai: string;
  arquivo_base64: string;
  nome_arquivo: string;
  extensao: string;
  observacao: string;
}

