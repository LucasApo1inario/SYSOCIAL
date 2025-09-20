import { computed, Injectable, signal } from '@angular/core';
import { User } from '../../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class LoggedInUserStoreService {
  
  private readonly state = signal<User | null>(null)

  currentUser = computed(() => this.state())

  isLoggdIn = computed(()=> this.state() !== null);

  setUser(user: User){
    this.state.set(user);
  }


  logout(){
    this.state.set(null)
  }

}
