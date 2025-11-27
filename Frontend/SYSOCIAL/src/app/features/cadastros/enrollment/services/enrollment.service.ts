import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, lastValueFrom, of } from 'rxjs';
import { catchError, map, delay } from 'rxjs/operators';
import { CourseOption, EnrollmentPayload, FileUploadRequest, GuardianPayload, StudentSummary, StudentFilter } from '../interfaces/enrollment.model';

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

  checkCpfExists(cpf: string): Observable<boolean> {
    const cleanCpf = cpf.replace(/\D/g, '');
    const params = new HttpParams().set('cpf', cleanCpf);
    
    return this.http.get<{exists: boolean}>(`${this.ENROLLMENT_API_URL}/check-cpf`, { params })
      .pipe(map(response => response.exists));
  }

  // --- File API (8083) ---

  uploadFile(payload: FileUploadRequest): Observable<any> {
    return this.http.post<any>(this.FILE_API_URL + '/', payload);
  }

    // --- NOVO: Método de Busca de Alunos ---
  searchStudents(filters: StudentFilter): Observable<StudentSummary[]> {
    // TODO: Quando o backend tiver a rota, descomente abaixo:
    // let params = new HttpParams();
    // if (filters.name) params = params.set('name', filters.name);
    // if (filters.cpf) params = params.set('cpf', filters.cpf);
    // return this.http.get<StudentSummary[]>(`${this.ENROLLMENT_API_URL}/students`, { params });

    // MOCK DATA (Para testar o visual agora)
    const mockData: StudentSummary[] = [
      { id: 1, fullName: 'João Silva', cpf: '123.456.789-00', age: 10, gender: 'M', courseName: ['Ensino Fundamental I', 'Teste 1', 'Teste 2', 'Teste 3'], className: 'Turma A', shift: 'Manhã', status: 'ATIVO', enrollmentDate: '2024-01-15' },
      { id: 2, fullName: 'Maria Oliveira', cpf: '987.654.321-11', age: 12, gender: 'F', courseName: ['Robótica'], className: 'Turma B', shift: 'Tarde', status: 'ATIVO', enrollmentDate: '2024-02-10' },
    ];
    
    // Filtra o mock baseado no nome para simular busca
    const filtered = mockData.filter(s => 
      (!filters.name || s.fullName.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.cpf || s.cpf.includes(filters.cpf))
    );

    return of(filtered).pipe(delay(500)); // Simula delay de rede
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

  // Busca dados de responsável existente
  getGuardianByCpf(cpf: string): Observable<GuardianPayload | null> {
    const cleanCpf = cpf.replace(/\D/g, '');
    const params = new HttpParams().set('cpf', cleanCpf);
    
    // Retorna null se der 404 (catchError)
    return this.http.get<GuardianPayload>(`${this.ENROLLMENT_API_URL}/guardian`, { params }).pipe(
      catchError(err => {
        if (err.status === 404) return of(null); // Não achou
        throw err;
      })
    );
  }
}