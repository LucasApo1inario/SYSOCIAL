import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthTokenStorageService } from '../../services/auth/auth-token-storage.service';
import { LoggedInUserStoreService } from '../../stores/logged-in-user-store.ts/logged-in-user-store.ts.service';
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,  
    ZardButtonComponent,
    ZardCardComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  protected readonly idEmail = 'email' + Math.random();
  protected readonly idPassword = 'password' + Math.random();


  authService = inject(AuthService)
  router = inject(Router)
  authTokenService = inject(AuthTokenStorageService)
  loggedInUserStoreService = inject(LoggedInUserStoreService);

  form = new FormGroup({
    email: new FormControl('',{
      validators: [Validators.required]
    }),
    password: new FormControl('',{
      validators: [Validators.required]
    })
  });


  
  submit() {
    if (this.form.invalid){
      return;
    }

    const payload = {
      email: this.form.controls.email.value as string,
      password: this.form.controls.password.value as string
    };

    this.authService.login(payload)
    .pipe(
      tap((res) => this.authTokenService.set(res.token)),
      switchMap((res) => this.authService.getCurrentUser(res.token)),
      tap(user => this.loggedInUserStoreService.setUser(user))
    )
    .subscribe({
      next: (res) => {
        
        this.router.navigate(['/contato']);
        
      },
      error: (response: HttpErrorResponse) =>{
        if (response.status === 401){
          this.form.setErrors({
            wrongCredentials: true
          })
        }
      }
    })

  }
  
}
