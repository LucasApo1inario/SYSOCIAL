import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { CourseCreateRequest } from '../interfaces/CourseCreateRequest.interface';
import { CourseCreateResponse } from '../interfaces/CourseCreateResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {

  createCourse(payload: CourseCreateRequest): Observable<CourseCreateResponse> {
    const mockResponse: CourseCreateResponse = {
      id: Math.random().toString(36).substr(2, 9),
      ...payload,
      createdAt: new Date().toISOString()
    };
    
    return of(mockResponse).pipe(delay(800));
  }

  getCourses(): Observable<CourseCreateResponse[]> {
    return of([]).pipe(delay(500));
  }

  getCourseById(id: string | number): Observable<CourseCreateResponse> {
    const mockCourse: CourseCreateResponse = {
      id: id.toString(),
      nome: 'Curso Mockado',
      descricao: 'Descrição do curso',
      cargaHoraria: 40,
      dataInicio: '2025-01-01',
      dataTermino: '2025-02-01',
      modalidade: 'Online',
      status: 'Ativo',
      instrutor: 'Instrutor Teste',
      vagas: 30
    };
    
    return of(mockCourse).pipe(delay(500));
  }

  updateCourse(id: string | number, payload: Partial<CourseCreateRequest>): Observable<CourseCreateResponse> {
    const mockResponse: CourseCreateResponse = {
      id: id.toString(),
      nome: payload.nome || '',
      descricao: payload.descricao || '',
      cargaHoraria: payload.cargaHoraria || 0,
      dataInicio: payload.dataInicio || '',
      dataTermino: payload.dataTermino || '',
      modalidade: payload.modalidade || 'Online',
      status: payload.status || 'Ativo',
      instrutor: payload.instrutor || '',
      vagas: payload.vagas || 0
    };
    
    return of(mockResponse).pipe(delay(800));
  }

  deleteCourse(id: string | number): Observable<void> {
    return of(void 0).pipe(delay(500));
  }
}
