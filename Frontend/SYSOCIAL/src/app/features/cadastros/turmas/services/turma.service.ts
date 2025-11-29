import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Turma } from '../interfaces/turma.interface';
import { TurmaAluno } from '../interfaces/turma-aluno.interface';

@Injectable({
  providedIn: 'root'
})
export class TurmasService {

  private apiUrl = 'http://64.181.170.230:8080/api/v1/turmas';

  constructor(private http: HttpClient) {}

  /**
   * GET /api/v1/turmas
   * Recupera lista de todas as turmas
   */
  getTurmas(): Observable<Turma[]> {
    return this.http.get<Turma[]>(this.apiUrl);
  }

  /**
   * GET /api/v1/turmas/:id
   * Recupera uma turma específica por ID
   */
  getTurmaById(id: number): Observable<Turma> {
    return this.http.get<Turma>(`${this.apiUrl}/${id}`);
  }

  /**
   * GET /api/v1/turmas/:id/alunos
   * Recupera lista de alunos de uma turma específica
   */
  getTurmaAlunos(id: number): Observable<TurmaAluno[]> {
    return this.http.get<TurmaAluno[]>(`${this.apiUrl}/${id}/alunos`);
  }

  /**
   * POST /api/v1/turmas
   * Cria uma nova turma
   */
  createTurma(payload: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  /**
   * PUT /api/v1/turmas/:id
   * Atualiza uma turma existente
   */
  updateTurma(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  /**
   * DELETE /api/v1/turmas/:id
   * Deleta uma turma
   */
  deleteTurma(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
