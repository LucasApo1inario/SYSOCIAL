import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Turma } from '../../interfaces/turma.interface';
import { TurmasService } from '../../services/turma.service';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-edit-turma',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormModule,
  ],
  templateUrl: './edit-turma.component.html',
  styleUrl: './edit-turma.component.css'
})
export class EditTurmaComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private turmasService = inject(TurmasService);

  loading = false;
  turmaId: number | null = null;

  model: any = {
    nome: '',
    curso_id: 0,
    dias_semana: '',
    horario_inicio: '',
    horario_fim: '',
    vagas_totais: 0,
    vagas_restantes: 0,
    ativo: true,
  };

  ngOnInit() {
    this.turmaId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.turmaId) {
      this.loadTurma();
    }
  }

  /**
   * Carrega os dados da turma para edição
   */
  loadTurma() {
    if (!this.turmaId) return;

    this.loading = true;
    this.turmasService.getTurmaById(this.turmaId).subscribe({
      next: (turma) => {
        this.model = {
          nome: turma.nome,
          curso_id: turma.curso_id,
          dias_semana: turma.dias_semana || '',
          horario_inicio: turma.horario_inicio || '',
          horario_fim: turma.horario_fim || '',
          vagas_totais: turma.vagas_totais || 0,
          vagas_restantes: turma.vagas_restantes || 0,
          ativo: turma.ativo,
        };
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        const errorMsg = err?.error?.message || 'Erro ao carregar turma.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
        this.router.navigate(['cadastros/turmas']);
      }
    });
  }

  onSubmit() {
    if (!this.model.nome || !this.model.curso_id || !this.model.vagas_totais) {
      toast.error('Preencha os campos obrigatórios: nome, curso e vagas totais.', {
        position: 'bottom-center',
      });
      return;
    }

    if (this.model.vagas_totais <= 0) {
      toast.error('Número de vagas deve ser maior que zero.', {
        position: 'bottom-center',
      });
      return;
    }

    if (!this.turmaId) {
      toast.error('ID da turma não encontrado.', {
        position: 'bottom-center',
      });
      return;
    }

    this.loading = true;

    this.turmasService.updateTurma(this.turmaId, this.model).subscribe({
      next: (response) => {
        this.loading = false;

        toast.success(`${response.message || 'Turma atualizada com sucesso!'}`, {
          duration: 4000,
          position: 'bottom-center',
        });

        this.router.navigate(['cadastros/turmas']);
      },
      error: (err: any) => {
        this.loading = false;

        const errorMsg = err?.error?.message || err?.error?.error || 'Erro ao atualizar turma.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  reset() {
    this.loadTurma();

    toast('Formulário restaurado!', {
      position: 'bottom-center'
    });
  }

  return() {
    this.router.navigate(['cadastros/turmas']);
  }
}
