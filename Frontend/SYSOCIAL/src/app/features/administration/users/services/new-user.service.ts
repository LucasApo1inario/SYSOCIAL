// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserCreateRequest } from '../interfaces/UserCreateRequest.interface';
import { UserCreateResponse } from '../interfaces/UserCreateResponse.interface';
import { environment } from 'src/environments/enviroment';

@Injectable({
  providedIn: 'root'
})

export class UsersService {
  private readonly baseUrl = environment.apiUrl + '/auth/register';

  constructor(private http: HttpClient) {}

  createUser(payload: UserCreateRequest): Observable<UserCreateResponse> {
    return this.http.post<UserCreateResponse>(this.baseUrl, payload);
  }

  getUsers(): Observable<UserCreateResponse[]> {
    return this.http.get<UserCreateResponse[]>(this.baseUrl);
  }

  getUserById(id: string | number): Observable<UserCreateResponse> {
    return this.http.get<UserCreateResponse>(`${this.baseUrl}/${id}`);
  }
}
