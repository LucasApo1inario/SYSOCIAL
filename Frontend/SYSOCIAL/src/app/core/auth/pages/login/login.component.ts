import { Component, inject, Inject } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginFacadeService } from '../../facades/login-facade.service';

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
  loginFacadeService = inject(LoginFacadeService)

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

    this.loginFacadeService.login(payload)
    .subscribe({
      next: () => {
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
