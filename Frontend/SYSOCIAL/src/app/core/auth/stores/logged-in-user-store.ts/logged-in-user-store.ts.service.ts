import { computed, Injectable, signal } from '@angular/core';
import { User } from '../../interfaces/user';
import { AuthTokenResponse } from '../../interfaces/auth-token-response';

@Injectable({
  providedIn: 'root'
})
export class LoggedInUserStoreService {
  
  private readonly state = signal<User | null>(null)

  currentUser = computed(() => this.state())
  userName = computed(() => this.state()?.username ?? '');
  userType = computed(() => this.state()?.type ?? '' );

  isLoggdIn = computed(()=> this.state() !== null);

  setUser(user: User){
    this.state.set(user);
  }


  logout(){
    this.state.set(null)
  }

}
