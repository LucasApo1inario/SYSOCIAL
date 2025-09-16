import { Component } from '@angular/core';

import { ZardCardComponent } from '@shared/components/card/card.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';

@Component({
  standalone: true,
  selector: 'app-contact',
  imports: [ZardCardComponent, ZardButtonComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  protected readonly idEmail = '';
  protected readonly idNome = '';
  protected readonly idMessage = '';



}
