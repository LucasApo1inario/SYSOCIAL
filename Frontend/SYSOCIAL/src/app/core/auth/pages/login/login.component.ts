import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

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


  AuthService = inject(AuthService)
  router = inject(Router)


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

    this.AuthService.login(payload)
    .subscribe({
      next: (res) => {
        this.router.navigate(['']);
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
