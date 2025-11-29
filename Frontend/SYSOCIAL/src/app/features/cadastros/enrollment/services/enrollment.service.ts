import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, lastValueFrom, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CourseOption, EnrollmentPayload, FileUploadRequest, StudentSummary, StudentFilter, GuardianPayload } from '../interfaces/enrollment.model';

export interface StudentListState {
  filters: StudentFilter;
  page: number;
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private http = inject(HttpClient);
  
  private readonly ENROLLMENT_API_URL = 'http://localhost:8084/api/v1/enrollments';
  private readonly FILE_API_URL = 'http://localhost:8083/api/v1/files';

  private _listState: StudentListState | null = null;

  get listState() { return this._listState; }
  set listState(state: StudentListState | null) { this._listState = state; }

  public documentTypes = ['RG do Aluno', 'CPF do Aluno', 'Certidão de Nascimento', 'RG do Responsável', 'CPF do Responsável', 'Comprovante de Residência', 'Histórico Escolar', 'Carteira de Vacinação', 'Declaração de Transferência'];
  public relationshipOptions = [{ value: 'pai', label: 'Pai' }, { value: 'mae', label: 'Mãe' }, { value: 'avo', label: 'Avô/Avó' }, { value: 'tio', label: 'Tio/Tia' }, { value: 'outro', label: 'Outro' }];

  // --- Enrollment API (8084) ---

  getAvailableCourses(shift: string): Observable<CourseOption[]> {
    const params = new HttpParams().set('shift', shift);
    return this.http.get<CourseOption[]>(`${this.ENROLLMENT_API_URL}/available-courses`, { params });
  }

  createEnrollment(payload: EnrollmentPayload): Observable<any> {
    return this.http.post<any>(this.ENROLLMENT_API_URL + '/', payload);
  }

  updateEnrollment(id: number, payload: EnrollmentPayload): Observable<any> {
    return this.http.put(`${this.ENROLLMENT_API_URL}/${id}`, payload);
  }

  checkCpfExists(cpf: string): Observable<boolean> {
    const cleanCpf = cpf.replace(/\D/g, '');
    const params = new HttpParams().set('cpf', cleanCpf);
    return this.http.get<{exists: boolean}>(`${this.ENROLLMENT_API_URL}/check-cpf`, { params }).pipe(map(r => r.exists));
  }

  getGuardianByCpf(cpf: string): Observable<GuardianPayload | null> {
    const cleanCpf = cpf.replace(/\D/g, '');
    const params = new HttpParams().set('cpf', cleanCpf);
    return this.http.get<GuardianPayload>(`${this.ENROLLMENT_API_URL}/guardian`, { params }).pipe(
      catchError(err => { if (err.status === 404) return of(null); throw err; })
    );
  }

  getEnrollmentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.ENROLLMENT_API_URL}/${id}`);
  }

  cancelEnrollment(id: number): Observable<any> {
    return this.http.patch(`${this.ENROLLMENT_API_URL}/${id}/cancel`, {});
  }

  searchStudents(filters: StudentFilter): Observable<StudentSummary[]> {
    let params = new HttpParams();
    if (filters.name) params = params.set('name', filters.name);
    if (filters.cpf) params = params.set('cpf', filters.cpf.replace(/\D/g, ''));
    if (filters.status) params = params.set('status', filters.status);
    if (filters.gender) params = params.set('gender', filters.gender);
    if (filters.age) params = params.set('age', filters.age.toString());
    if (filters.school) params = params.set('school', filters.school);
    if (filters.schoolShift) params = params.set('schoolShift', filters.schoolShift);
    if (filters.course) params = params.set('course', filters.course);
    if (filters.class) params = params.set('class', filters.class);
    return this.http.get<StudentSummary[]>(`${this.ENROLLMENT_API_URL}/students`, { params });
  }

  // --- File API (8083) ---

  uploadFile(payload: FileUploadRequest): Observable<any> {
    return this.http.post<any>(this.FILE_API_URL + '/', payload);
  }

  // Busca o arquivo pelo ID no file-service
  getFile(id: number): Observable<any> {
    return this.http.get<any>(`${this.FILE_API_URL}/${id}`);
  }

  // --- VISUALIZAÇÃO DE ARQUIVOS ---

  // Determina o tipo MIME baseado na extensão ou nome
  getMimeType(fileNameOrExt: string): string {
    const ext = fileNameOrExt.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'txt': return 'text/plain';
      default: return 'application/octet-stream'; // Tipo genérico para download
    }
  }

  // Converte Base64 para Blob e abre numa nova aba
  openFile(base64Data: string, fileName: string) {
    try {
      const contentType = this.getMimeType(fileName);
      
      // Decodifica a string Base64
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Cria o Blob
      const blob = new Blob([byteArray], { type: contentType });
      
      // Cria uma URL temporária para o Blob
      const fileURL = URL.createObjectURL(blob);
      
      // Abre em nova aba
      window.open(fileURL, '_blank');
      
    } catch (e) {
      console.error('Erro ao converter arquivo:', e);
      alert('Não foi possível abrir o arquivo. O formato pode estar corrompido.');
    }
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

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Clean = result.split(',')[1]; // Remove o prefixo data:image...
        resolve(base64Clean);
      };
      reader.onerror = error => reject(error);
    });
  }
}