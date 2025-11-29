import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course } from '../interfaces/course.interface';
import { CourseCreateRequest } from '../interfaces/CourseCreateRequest.interface';
import { CourseCreateResponse } from '../interfaces/CourseCreateResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {

  private apiUrl = 'http://64.181.170.230:8080/api/v1/cursos';

  constructor(private http: HttpClient) {}

  /**
   * GET /api/v1/cursos
   * Recupera lista de todos os cursos
   */
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl);
  }

  /**
   * GET /api/v1/cursos/:id
   * Recupera um curso específico por ID
   */
  getCourseById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  /**
   * POST /api/v1/cursos
   * Cria um novo curso
   * Retorna: { id: number, message: string }
   */
  createCourse(payload: CourseCreateRequest): Observable<CourseCreateResponse> {
    return this.http.post<CourseCreateResponse>(this.apiUrl, payload);
  }

  /**
   * PUT /api/v1/cursos/:id
   * Atualiza um curso existente
   * Retorna: { message: string }
   */
  updateCourse(id: number, payload: CourseCreateRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * DELETE /api/v1/cursos/:id
   * Deleta um curso
   */
  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
