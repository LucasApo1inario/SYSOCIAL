import { Component } from '@angular/core';
 
import { ZardAccordionComponent } from '@shared/components/accordion/accordion.component';
import { ZardAccordionItemComponent } from '@shared/components/accordion/accordion-item.component';
 
@Component({
  standalone: true,
  imports: [ZardAccordionComponent, ZardAccordionItemComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {}
 