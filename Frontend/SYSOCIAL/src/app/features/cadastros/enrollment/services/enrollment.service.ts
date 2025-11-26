import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Course, ClassItem } from '../interfaces/enrollment.model';

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {

  // Dados Mockados
  private availableCourses: Course[] = [
    { id: '1', name: 'Ensino Fundamental I' },
    { id: '2', name: 'Ensino Fundamental II' },
    { id: '3', name: 'Ensino Médio' },
    { id: '4', name: 'Curso Extra: Robótica' },
    { id: '5', name: 'Curso Extra: Ballet' },
    { id: '6', name: 'Curso Extra: Futsal' }
  ];

  private allClasses: ClassItem[] = [
    { id: '101', courseId: '1', name: '1º Ano A - Manhã' },
    { id: '102', courseId: '1', name: '1º Ano B - Tarde' },
    { id: '103', courseId: '1', name: '2º Ano A - Manhã' },
    { id: '401', courseId: '4', name: 'Turma Iniciante - Ter/Qui 14h' },
    { id: '402', courseId: '4', name: 'Turma Avançada - Sex 14h' },
    { id: '501', courseId: '5', name: 'Baby Class - Seg/Qua 09h' },
    { id: '502', courseId: '5', name: 'Preparatório - Seg/Qua 10h' }
  ];

  public documentTypes = [
    'RG do Aluno', 'CPF do Aluno', 'Certidão de Nascimento',
    'RG do Responsável', 'CPF do Responsável', 'Comprovante de Residência',
    'Histórico Escolar', 'Carteira de Vacinação', 'Declaração de Transferência'
  ];

  public relationshipOptions = [
    { value: 'pai', label: 'Pai' },
    { value: 'mae', label: 'Mãe' },
    { value: 'avo', label: 'Avô/Avó' },
    { value: 'tio', label: 'Tio/Tia' },
    { value: 'outro', label: 'Outro' }
  ];

  getCourses(): Observable<Course[]> {
    return of(this.availableCourses);
  }

  getAllClasses(): Observable<ClassItem[]> {
    return of(this.allClasses);
  }

  calculateAge(birthDate: string): number {
    if (!birthDate) return -1;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }
}