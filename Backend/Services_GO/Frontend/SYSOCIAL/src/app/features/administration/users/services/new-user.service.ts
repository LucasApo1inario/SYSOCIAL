// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserCreateRequest } from '../interfaces/UserCreateRequest.interface';
import { UserCreateResponse } from '../interfaces/UserCreateResponse.interface';
import { environment } from 'src/environments/enviroment';
import { UserApiResponse } from '../interfaces/UserApiResponse.interface';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly baseUrl = environment.apiUrl + '/users';

  constructor(private http: HttpClient) {}

  createUser(payload: UserCreateRequest): Observable<UserCreateResponse> {
    return this.http.post<UserCreateResponse>(
      environment.apiUrl + '/auth/register',
      payload
    );
  }

  getUsers(limit = 10, offset = 0): Observable<{
    data: UserApiResponse[];
    pagination: { limit: number; offset: number; total: number };
    success: boolean;
  }> {
    return this.http.get<{
      data: UserApiResponse[];
      pagination: { limit: number; offset: number; total: number };
      success: boolean;
    }>(`${environment.apiUrl}/users/all?offset=${offset}`);
  }

  getUserById(id: string | number): Observable<UserCreateResponse> {
    return this.http.get<UserCreateResponse>(`${this.baseUrl}/${id}`);
  }

  updateUser(id: number | string, payload: Partial<UserCreateRequest>): Observable<UserCreateResponse> {
    return this.http.put<UserCreateResponse>(
      `${this.baseUrl}/${id}`,
      payload
    );
  }
}
