// admin-layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-reports-layout',
  template: `
    <div class="p-6">
      <router-outlet></router-outlet>
    </div>
  `,
  imports: [RouterOutlet],
})
export class AdminLayoutComponent {}
