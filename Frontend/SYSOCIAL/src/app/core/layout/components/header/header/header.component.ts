import { Component } from '@angular/core';
import { ZardBreadcrumbModule } from '@shared/components/breadcrumb/breadcrumb.module';

@Component({
  selector: 'app-header',
  imports: [ZardBreadcrumbModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

}
