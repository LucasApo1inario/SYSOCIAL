import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { CourseCreateRequest } from '../interfaces/CourseCreateRequest.interface';
import { CourseCreateResponse } from '../interfaces/CourseCreateResponse.interface';
import { TurmaResponse } from '../interfaces/TurmaCreateResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {

  createCourse(payload: CourseCreateRequest): Observable<CourseCreateResponse> {
  const mockResponse: CourseCreateResponse = {
    id: Math.random().toString(36).substr(2, 9),
    nome: payload.nome,
    status: payload.status,
    vagas: payload.vagas,

    // transforma TurmaCreateRequest → TurmaResponse
    turmas: payload.turmas?.map((t, i) => ({
      id: i + 1,
      dia_semana: t.dia_semana,
      horario_inicio: t.horario_inicio,
      horario_fim: t.horario_fim,
      vagas_turma: t.vagas_turma,
    })) ?? []
  };

  return of(mockResponse).pipe(delay(800));
}




  getCourses(): Observable<CourseCreateResponse[]> {
    return of([]).pipe(delay(500));
  }

  getCourseById(id: string): Observable<CourseCreateResponse> {
  const mockCourse: CourseCreateResponse = {
    id,
    nome: 'Curso Mockado',
    status: 'Ativo',
    vagas: 30,
    turmas: [
      {
        id: 1,
        dia_semana: 'Segunda-feira',
        horario_inicio: '08:00',
        horario_fim: '10:00',
        vagas_turma: 25,
      }
    ]
  };

  return of(mockCourse).pipe(delay(500));
}



  updateCourse(id: string | number, payload: Partial<CourseCreateRequest>): Observable<CourseCreateResponse> {
  const mockResponse: CourseCreateResponse = {
    id: id.toString(),
    nome: payload.nome || 'Sem nome',
    status: payload.status || 'Ativo',
    vagas: payload.vagas || 0,

    // Mesmo mapeamento usado na criação — garantindo TurmaResponse
    turmas: payload.turmas?.map((t, i) => ({
      id: i + 1,  // mock simples, já que o backend real que vai enviar IDs
      dia_semana: t.dia_semana,
      horario_inicio: t.horario_inicio,
      horario_fim: t.horario_fim,
      vagas_turma: t.vagas_turma,
    })) ?? []
  };

  return of(mockResponse).pipe(delay(800));
}



  deleteCourse(id: string | number): Observable<void> {
    return of(void 0).pipe(delay(500));
  }
}
