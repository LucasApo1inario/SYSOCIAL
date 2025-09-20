import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardCardComponent } from '@shared/components/card/card.component';

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


  Submit() {
    if (this.form.valid) {
      console.log("submitou")
    } else {
      this.form.markAllAsTouched();
    }
  }


  
  form = new FormGroup({
    email: new FormControl('',{
      validators: [Validators.required]
    }),
    password: new FormControl('',{
      validators: [Validators.required]
    })
  });

  
}
