import { Component, inject, Inject } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginFacadeService } from '../../facades/login-facade.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { toast } from 'ngx-sonner';
import { ZardToastComponent } from '@shared/components/toast/toast.component';



@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,  
    ZardButtonComponent,
    ZardCardComponent,
    NgxSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  protected readonly idEmail = 'user' + Math.random();
  protected readonly idPassword = 'password' + Math.random();


  authService = inject(AuthService)
  router = inject(Router)
  loginFacadeService = inject(LoginFacadeService)
  spinner = inject(NgxSpinnerService)

  form = new FormGroup({
    user: new FormControl('',{
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

    this.spinner.show();
    
    const payload = {
      user: this.form.controls.user.value as string,
      password: this.form.controls.password.value as string
    };

    


    this.loginFacadeService.login(payload)
    .subscribe({
      next: () => {
        this.spinner.hide();
        this.router.navigate(['/contato']);
      },
      error: (response: HttpErrorResponse) =>{
       // if (response.status === 401){
          this.spinner.hide();
          toast.error(`Erro ao realizar o login!`, {
          duration: 5000,
          position: 'bottom-center',
        });
          this.form.setErrors({
            wrongCredentials: true
          })
//        }
      }
    })

  }
  
}
