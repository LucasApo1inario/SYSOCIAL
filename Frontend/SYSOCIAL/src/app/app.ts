import { Component, signal } from '@angular/core';
import { LayoutComponent } from "./core/layout/layout.component";
import { RouterOutlet } from '@angular/router';
import { ZardToastComponent } from '@shared/components/toast/toast.component';
 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent, RouterOutlet,ZardToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('SYSOCIAL');
}
