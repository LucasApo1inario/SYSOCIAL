import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurmaAluno } from '../../interfaces/turma-aluno.interface';
import { Turma } from '../../interfaces/turma.interface';
import { TurmasService } from '../../services/turma.service';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent
} from '@shared/components/table/table.component';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-turma-alunos',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
  ],
  templateUrl: './turma-alunos.component.html',
  styleUrl: './turma-alunos.component.css'
})
export class TurmaAlunosComponent implements OnInit {
  @Input() turma!: Turma;
  @Output() close = new EventEmitter<void>();

  private turmasService = inject(TurmasService);

  alunos = signal<TurmaAluno[]>([]);
  loading = signal(false);

  ngOnInit() {
    if (this.turma?.id) {
      this.loadAlunos();
    }
  }

  /**
   * Carrega a lista de alunos da turma
   */
  loadAlunos() {
    this.loading.set(true);
    this.turmasService.getTurmaAlunos(this.turma.id).subscribe({
      next: (alunos) => {
        this.alunos.set(alunos);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
        const errorMsg = err?.error?.message || 'Erro ao carregar alunos da turma.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  /**
   * Fecha o modal/componente
   */
  onClose() {
    this.close.emit();
  }

  trackById(index: number, aluno: TurmaAluno): number {
    return aluno.id;
  }
}
