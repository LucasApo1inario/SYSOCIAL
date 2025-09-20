import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';
import { AuthService } from '../../services/auth/auth.service';

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


  form = new FormGroup({
    email: new FormControl('',{
      validators: [Validators.required]
    }),
    password: new FormControl('',{
      validators: [Validators.required]
    })
  });


  
  submit() {
      console.log("entrou")
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
        console.log(res)
      }
    })

  }
  
}
