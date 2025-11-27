import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header/header.component';
import { FooterComponent } from "./components/footer/footer.component";

@Component({
  selector: 'app-layout',
  imports: [HeaderComponent, FooterComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {

}
