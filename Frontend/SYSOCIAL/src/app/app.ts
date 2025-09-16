import { Component, signal } from '@angular/core';
import { LayoutComponent } from "./core/layout/layout.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('SYSOCIAL');
}
