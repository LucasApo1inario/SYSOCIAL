import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ZardBreadcrumbModule } from '@shared/components/breadcrumb/breadcrumb.module';
import { LogoutFacadeService } from 'src/app/core/auth/facades/logout-facade.service';
import { LoggedInUserStoreService } from 'src/app/core/auth/stores/logged-in-user-store.ts/logged-in-user-store.ts.service';

@Component({
  selector: 'app-header',
  imports: [ZardBreadcrumbModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  private readonly logoutFacadeService = inject(LogoutFacadeService)
  private readonly router = inject(Router)
  private readonly loggedInUserStoreService = inject(LoggedInUserStoreService)

  isLoggedIn = computed (() => this.loggedInUserStoreService.isLoggdIn())

  logout(){
    this.logoutFacadeService.logout()
    .subscribe({
      next:()=>{
        this.router.navigate(['auth/login']);        
      }
    })
  }
 
}
