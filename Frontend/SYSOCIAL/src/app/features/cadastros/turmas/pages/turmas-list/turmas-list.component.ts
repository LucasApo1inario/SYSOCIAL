import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Turma } from '../../interfaces/turma.interface';
import { TurmasService } from '../../services/turma.service';
import { TurmaTableComponent } from '../../components/turma-table/turma-table.component';
import { TurmaAlunosComponent } from '../../components/turma-alunos/turma-alunos.component';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-turmas-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TurmaTableComponent,
    TurmaAlunosComponent,
    ZardButtonComponent,
    ZardInputDirective,
  ],
  templateUrl: './turmas-list.component.html',
  styleUrl: './turmas-list.component.css'
})
export class TurmasListComponent implements OnInit {
  private router = inject(Router);
  private turmasService = inject(TurmasService);

  searchQuery = signal('');
  turmas: WritableSignal<Turma[]> = signal([]);
  loading = signal(false);
  selectedTurma = signal<Turma | null>(null);
  showAlunosModal = signal(false);

  displayedTurmas = computed(() =>
    this.turmas().filter(t =>
      t.nome.toLowerCase().includes(this.searchQuery().toLowerCase())
    )
  );

  ngOnInit() {
    this.loadTurmas();
  }

  /**
   * Carrega a lista de turmas da API
   */
  loadTurmas() {
    this.loading.set(true);
    this.turmasService.getTurmas().subscribe({
      next: (turmas) => {
        this.turmas.set(turmas);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        const errorMsg = err?.error?.message || 'Erro ao carregar turmas.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  /**
   * Navega para página de criação de nova turma
   */
  addTurma() {
    this.router.navigate(['cadastros/new-turma']);
  }

  /**
   * Navega para página de edição da turma
   */
  editTurma(turma: Turma) {
    this.router.navigate(['cadastros/edit-turma', turma.id]);
  }

  /**
   * Deleta uma turma
   */
  deleteTurma(turma: Turma) {
    if (!confirm(`Tem certeza que deseja deletar a turma "${turma.nome}"?`)) {
      return;
    }

    this.turmasService.deleteTurma(turma.id).subscribe({
      next: () => {
        toast.success('Turma deletada com sucesso!', {
          duration: 4000,
          position: 'bottom-center',
        });
        this.loadTurmas();
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || 'Erro ao deletar turma.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  /**
   * Abre modal para visualizar alunos da turma
   */
  viewTurmaAlunos(turma: Turma) {
    this.selectedTurma.set(turma);
    this.showAlunosModal.set(true);
  }

  /**
   * Fecha modal de alunos
   */
  closeAlunosModal() {
    this.showAlunosModal.set(false);
    this.selectedTurma.set(null);
  }

  get search(): string {
    return this.searchQuery();
  }

  set search(value: string) {
    this.searchQuery.set(value);
  }
}
