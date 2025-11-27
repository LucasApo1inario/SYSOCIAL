import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs'; // lastValueFrom para usar com Promise
import { CourseOption, EnrollmentPayload, FileUploadRequest } from '../interfaces/enrollment.model';

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