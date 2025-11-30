import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CoursesService } from '../cadastros/courses/services/course.service';
import { TurmasService } from '../cadastros/turmas/services/turma.service';
import { LoggedInUserStoreService } from 'src/app/core/auth/stores/logged-in-user-store.ts/logged-in-user-store.ts.service';
import { toast } from 'ngx-sonner';
import { Course } from './../../features/cadastros/courses/interfaces/course.interface';
import { Turma } from './../../features/cadastros/turmas/interfaces/turma.interface';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private coursesService = inject(CoursesService);
  private turmasService = inject(TurmasService);
  private loggedInUserStore = inject(LoggedInUserStoreService);

  // Sinais
  userType = computed(() => this.loggedInUserStore.userType());
  userName = computed(() => this.loggedInUserStore.userName());

  courses = signal<Course[]>([]);
  turmas = signal<Turma[]>([]);
  loadingCourses = signal(false);
  loadingTurmas = signal(false);

  // Estatísticas computadas
  totalCourses = computed(() => this.courses().length);
  totalTurmas = computed(() => this.turmas().length);
  totalVagas = computed(() => 
    this.turmas().reduce((sum, t) => sum + (t.vagasTurma || 0), 0)
  );
  vagasDisponiveis = computed(() => 
    this.turmas().reduce((sum, t) => {
      const ocupadas = t.vagasTurma ? Math.floor(t.vagasTurma * 0.7) : 0;
      return sum + (t.vagasTurma ? t.vagasTurma - ocupadas : 0);
    }, 0)
  );

  // Últimas turmas (últimas 5)
  ultimasTurmas = computed(() => 
    this.turmas()
      .sort((a, b) => new Date(b.dataInicio || 0).getTime() - new Date(a.dataInicio || 0).getTime())
      .slice(0, 5)
  );

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loadCourses();
    this.loadTurmas();
  }

  loadCourses() {
    this.loadingCourses.set(true);
    this.coursesService.getCourses().subscribe({
      next: (data: Course[]) => {
        this.courses.set(data);
        this.loadingCourses.set(false);
      },
      error: (err: any) => {
        this.loadingCourses.set(false);
        console.error('Erro ao carregar cursos:', err);
      }
    });
  }

  loadTurmas() {
    this.loadingTurmas.set(true);
    this.turmasService.getTurmas().subscribe({
      next: (data: Turma[]) => {
        this.turmas.set(data);
        this.loadingTurmas.set(false);
      },
      error: (err: any) => {
        this.loadingTurmas.set(false);
        console.error('Erro ao carregar turmas:', err);
      }
    });
  }

  // Navegação
  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  criarCurso() {
    this.router.navigate(['cadastros/new-course']);
  }

  criarTurma() {
    this.router.navigate(['cadastros/new-turma']);
  }

  criarUsuario() {
    this.router.navigate(['administration/new-user']);
  }

  // Verifica tipo de usuário
  isAdmin() {
    return this.userType() === 'A';
  }

  isProfessor() {
    return this.userType() === 'P';
  }

  isUsuario() {
    return this.userType() === 'U';
  }

  /**
   * Admin pode visualizar TUDO - retorna true se o usuário é admin ou professor
   * Usado para determinar se deve mostrar opções que tanto professor quanto admin podem acessar
   */
  canViewAsProfessor() {
    return this.isAdmin() || this.isProfessor();
  }

  /**
   * Admin pode visualizar TUDO - retorna true se o usuário é admin ou usuário comum
   * Usado para determinar se deve mostrar opções que tanto usuário quanto admin podem acessar
   */
  canViewAsUser() {
    return this.isAdmin() || this.isUsuario();
  }

  // Métodos auxiliares
  calculateOccupancyPercentage(): number {
    if (this.totalVagas() <= 0) return 0;
    return Math.round(((this.totalVagas() - this.vagasDisponiveis()) / this.totalVagas()) * 100);
  }

  getOccupiedVagas(): number {
    return this.totalVagas() - this.vagasDisponiveis();
  }

  getOccupancyPercentageForBadge(): string {
    return this.calculateOccupancyPercentage() + '%';
  }

  getAverageVagasPerTurma(): number {
    if (this.totalTurmas() <= 0) return 0;
    return Math.round((this.totalVagas() / this.totalTurmas()) * 10) / 10;
  }

  getEfficiencyRatio(): number {
    if (this.totalTurmas() <= 0) return 0;
    return Math.round((this.totalCourses() / this.totalTurmas()) * 10) / 10;
  }

  Math = Math;
}
