import { Component, signal } from '@angular/core';
import { LayoutComponent } from "./core/layout/layout.component";

@Component({
  selector: 'app-root',
  imports: [ LayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('SYSOCIAL');
}
