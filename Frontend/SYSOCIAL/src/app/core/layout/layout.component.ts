import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header/header.component';

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

}
