import { Component, inject } from '@angular/core';
import { FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { AuthService } from '../../services/auth/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { LoginFacadeService } from '../../facades/login-facade.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { toast } from 'ngx-sonner';
import { ChangePasswordDialogComponent } from '../../dialogs/change-password-dialog.component';
import { ZardDialogService } from '@shared/components/dialog/dialog.service';
import { LogoutFacadeService } from '../../facades/logout-facade.service';

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

  authService = inject(AuthService);
  router = inject(Router);
  loginFacadeService = inject(LoginFacadeService);
  private readonly logoutFacadeService = inject(LogoutFacadeService)
  
  spinner = inject(NgxSpinnerService);
  dialog = inject(ZardDialogService);

  form = new FormGroup({
    user: new FormControl('', {
      validators: [Validators.required]
    }),
    password: new FormControl('', {
      validators: [Validators.required]
    })
  });

  submit() {
    if (this.form.invalid) {
      return;
    }

    this.spinner.show();

    const payload = {
      user: this.form.controls.user.value as string,
      password: this.form.controls.password.value as string
    };

    this.loginFacadeService.login(payload).subscribe({
      next: (response) => {
        this.spinner.hide();

        // Necessita troca de senha
        if (response.troca_senha) {
          this.dialog.create({
            zTitle: "Alterar senha",
            zWidth: "450px",
            zContent: ChangePasswordDialogComponent,
            zData: { userId: response.id },
            zOkText: "Salvar",
            zCancelText: "Sair",
            zClosable: false,
            zMaskClosable: false,
            zOnOk: async (componentInstance) => {
              const saved = await componentInstance.save(); 
              
              if (saved) {
                this.logout();
              }

             
            },
          });
        
          return;   
        }


        // Login normal
        this.router.navigate(['/home']);
      },

      error: (response: HttpErrorResponse) => {
        this.spinner.hide();

        toast.error("Erro ao realizar o login!", {
          duration: 5000,
          position: "bottom-center",
        });

        this.form.setErrors({ wrongCredentials: true });
      },
    });

  }


  logout(){
    this.logoutFacadeService.logout()
    .subscribe({
      next:()=>{
        this.router.navigate(['auth/login']);  
        window.location.reload();      
      }
    })
  }

}
