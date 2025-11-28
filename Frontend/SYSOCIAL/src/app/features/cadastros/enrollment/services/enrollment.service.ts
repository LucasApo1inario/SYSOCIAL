import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, lastValueFrom, of } from 'rxjs'; // lastValueFrom para usar com Promise
import { delay, map } from 'rxjs/operators';
import { CourseOption, EnrollmentPayload, FileUploadRequest, StudentSummary, StudentFilter } from '../interfaces/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private http = inject(HttpClient);
  
  // Porta 8084 (Enrollment Service)
  private readonly ENROLLMENT_API_URL = 'http://localhost:8084/api/v1/enrollments';
  
  // Porta 8083 (File Service)
  private readonly FILE_API_URL = 'http://localhost:8083/api/v1/files';

  public documentTypes = [
    'Documento com foto do Aluno', 'CPF do Aluno', 'Certidão de Nascimento',
    'Documento com foto do Responsável', 'CPF do Responsável', 'Comprovante de Residência',
    'Declaração de matrícula escolar', 'Outros'
  ];

  public relationshipOptions = [
    { value: 'pai', label: 'Pai' },
    { value: 'mae', label: 'Mãe' },
    { value: 'avo', label: 'Avô/Avó' },
    { value: 'tio', label: 'Tio/Tia' },
    { value: 'outro', label: 'Outro' }
  ];

  // --- Enrollment API (8084) ---

  getAvailableCourses(shift: string): Observable<CourseOption[]> {
    const params = new HttpParams().set('shift', shift);
    return this.http.get<CourseOption[]>(`${this.ENROLLMENT_API_URL}/available-courses`, { params });
  }

  createEnrollment(payload: EnrollmentPayload): Observable<any> {
    return this.http.post<any>(this.ENROLLMENT_API_URL + '/', payload);
  }

  // --- File API (8083) ---

  uploadFile(payload: FileUploadRequest): Observable<any> {
    return this.http.post<any>(this.FILE_API_URL + '/', payload);
  }

    // Método de Busca de Alunos ---
  searchStudents(filters: StudentFilter): Observable<StudentSummary[]> {
    // MOCK DATA ENRIQUECIDO
    const mockData: StudentSummary[] = [
      { 
        id: 1, fullName: 'João Silva', cpf: '123.456.789-00', age: 10, gender: 'M', 
        school: 'Escola Municipal Central', schoolShift: 'manha', // Dados da Escola
        courses: ['Ensino Fundamental I'], classes: ['Turma A'], shifts: ['Manhã'], 
        status: 'ATIVO', enrollmentDate: '2024-01-15' 
      },
      { 
        id: 2, fullName: 'Maria Oliveira', cpf: '987.654.321-11', age: 12, gender: 'F', 
        school: 'Colégio Estrela do Saber', schoolShift: 'tarde',
        courses: ['Robótica', 'Ballet', 'Futsal'], classes: ['Turma B', 'Baby Class', 'Sub-12'], 
        shifts: ['Tarde', 'Tarde', 'Noite'], 
        status: 'ATIVO', enrollmentDate: '2024-02-10' 
      },
      { 
        id: 3, fullName: 'Pedro Santos', cpf: '456.123.789-22', age: 15, gender: 'M', 
        school: 'Escola Estadual Norte', schoolShift: 'integral',
        courses: ['Ensino Médio', 'Robótica'], classes: ['1º Ano', 'Avançado'], shifts: ['Integral', 'Tarde'], 
        status: 'INATIVO', 
        enrollmentDate: '2023-11-20' 
      },
    ];
    
    const filtered = mockData.filter(s => {
      // Helper para ignorar case e acentos
      const normalize = (text: string) => text ? text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";

      // 1. Nome e CPF
      const matchName = !filters.name || normalize(s.fullName).includes(normalize(filters.name));
      const matchCpf = !filters.cpf || s.cpf.includes(filters.cpf);
      
      // 2. Status
      const matchStatus = !filters.status || s.status === filters.status;

      // 3. Novos Filtros
      const matchGender = !filters.gender || s.gender === filters.gender;
      const matchAge = !filters.age || s.age === Number(filters.age); // Convertendo string do input para numero
      
      // Escola e Turno Escolar
      const matchSchool = !filters.school || normalize(s.school).includes(normalize(filters.school));
      const matchSchoolShift = !filters.schoolShift || s.schoolShift === filters.schoolShift;

      // Cursos (Arrays - Verifica se ALGUM item do array bate com a busca)
      const matchCourse = !filters.course || s.courses.some(c => normalize(c).includes(normalize(filters.course!)));
      const matchClass = !filters.class || s.classes.some(c => normalize(c).includes(normalize(filters.class!)));
      const matchCourseShift = !filters.courseShift || s.shifts.some(sh => normalize(sh) === normalize(filters.courseShift!));

      return matchName && matchCpf && matchStatus && matchGender && matchAge && matchSchool && matchSchoolShift && matchCourse && matchClass && matchCourseShift;
    });

    return of(filtered).pipe(delay(500));
  }


  // --- Helpers ---

  calculateAge(birthDate: string): number {
    if (!birthDate) return -1;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  // Converte File para Base64 (Promise)
  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo (ex: "data:image/png;base64,") para enviar apenas o hash
        const base64Clean = result.split(',')[1];
        resolve(base64Clean);
      };
      reader.onerror = error => reject(error);
    });
  }
}