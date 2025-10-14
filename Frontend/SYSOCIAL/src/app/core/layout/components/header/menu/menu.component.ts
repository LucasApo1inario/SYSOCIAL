import { Component, computed, inject } from '@angular/core';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardDividerComponent } from '@shared/components/divider/divider.component';
import { ZardMenuModule } from '@shared/components/menu/menu.module';
import { Router } from '@angular/router';
import { LogoutFacadeService } from 'src/app/core/auth/facades/logout-facade.service';
import { LoggedInUserStoreService } from 'src/app/core/auth/stores/logged-in-user-store.ts/logged-in-user-store.ts.service';

@Component({
  selector: 'app-menu',
  imports: [ZardButtonComponent, ZardMenuModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css',
  standalone: true
})
export class MenuComponent {
  private readonly logoutFacadeService = inject(LogoutFacadeService)
  private readonly router = inject(Router)
  private readonly loggedInUserStoreService = inject(LoggedInUserStoreService)

  isLoggedIn = computed (() => this.loggedInUserStoreService.isLoggdIn())
  userName = computed(() => this.loggedInUserStoreService.userName())
  userType = computed(() => this.loggedInUserStoreService.userType())

  logout(){
    this.logoutFacadeService.logout()
    .subscribe({
      next:()=>{
        this.router.navigate(['auth/login']);        
      }
    })
  }

   log(item: string) {
    console.log('Navigate to:', item);
  }

}
