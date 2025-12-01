import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CoursesService } from '../cadastros/courses/services/course.service';
import { TurmasService } from '../cadastros/turmas/services/turma.service';
import { LoggedInUserStoreService } from 'src/app/core/auth/stores/logged-in-user-store.ts/logged-in-user-store.ts.service';
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

  // Sinais de Usuário
  userType = computed(() => this.loggedInUserStore.userType());
  
  // CORREÇÃO: Tenta pegar o 'nome' (coluna do BD) do objeto user(), senão usa o userName() (login)
  userName = computed(() => {
    const user = this.loggedInUserStore.currentUser();
    // @ts-ignore - Ignora erro se a interface User não tiver 'nome' tipado explicitamente ainda
    return user?.nome || this.loggedInUserStore.userName();
  });

  // Dados
  courses = signal<Course[]>([]);
  turmas = signal<Turma[]>([]);
  loadingCourses = signal(false);
  loadingTurmas = signal(false);

  // Paginação
  currentPage = signal(0);
  pageSize = 5;

  // Estatísticas computadas
  totalCourses = computed(() => this.courses().length);
  totalTurmas = computed(() => this.turmas().length);
  totalVagas = computed(() => 
    this.turmas().reduce((sum, t) => sum + (t.vagasTurma || 0), 0)
  );
  vagasDisponiveis = computed(() => 
    this.turmas().reduce((sum, t) => {
      const ocupadas = t.vagasTurma ? Math.floor(t.vagasTurma * 0.3) : 0;
      return sum + (t.vagasTurma ? t.vagasTurma - ocupadas : 0);
    }, 0)
  );

  // Computados para a Tabela Paginada
  paginatedCourses = computed(() => {
    const start = this.currentPage() * this.pageSize;
    const end = start + this.pageSize;
    return this.courses().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.courses().length / this.pageSize));

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

  // --- Helpers para a Tabela de Vagas ---
  
  getVagasRestantes(course: any): number {
    return course.vagasRestantes !== undefined ? course.vagasRestantes : 0;
  }

  getCourseOccupancy(course: any): number {
    if (!course.vagasTotais || course.vagasTotais === 0) return 0;
    
    const restantes = this.getVagasRestantes(course);
    const occupied = course.vagasTotais - restantes;
    
    const percentage = (occupied / course.vagasTotais) * 100;
    return Math.round(percentage);
  }

  getVagasPorPeriodo(courseId: number) {
    const turmasDoCurso = this.turmas().filter(t => t.cursoId === courseId);
    
    const breakdown = {
      manha: { ocupadas: 0, disponiveis: 0 },
      tarde: { ocupadas: 0, disponiveis: 0 },
      totalDisponivel: 0
    };

    turmasDoCurso.forEach(t => {
      const totalTurma = t.vagasTurma || 0;
      const ocupadas = Math.floor(totalTurma * 0.3);
      const disponiveis = totalTurma - ocupadas;

      breakdown.totalDisponivel += disponiveis;

      if (t.horaInicio) {
        const hora = parseInt(t.horaInicio.split(':')[0], 10);
        if (hora < 12) {
          breakdown.manha.ocupadas += ocupadas;
          breakdown.manha.disponiveis += disponiveis;
        } else if (hora >= 12 && hora < 18) {
          breakdown.tarde.ocupadas += ocupadas;
          breakdown.tarde.disponiveis += disponiveis;
        } 
      }
    });

    return breakdown;
  }

  // --- Navegação e Ações ---

  nextPage() {
    if ((this.currentPage() + 1) * this.pageSize < this.courses().length) {
      this.currentPage.update(v => v + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(v => v - 1);
    }
  }

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

  // --- Verificações de Papel ---

  isAdmin() {
    return this.userType() === 'A';
  }

  isProfessor() {
    return this.userType() === 'P';
  }

  isUsuario() {
    return this.userType() === 'U';
  }
}