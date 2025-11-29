import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TurmasService } from '../../services/turma.service';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-new-turma',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormModule,
  ],
  templateUrl: './new-turma.component.html',
  styleUrl: './new-turma.component.css'
})
export class NewTurmaComponent {
  private router = inject(Router);
  private turmasService = inject(TurmasService);

  loading = false;

  model: any = {
    nome: '',
    curso_id: 0,
    dias_semana: '',
    horario_inicio: '',
    horario_fim: '',
    vagas_totais: 0,
    ativo: true,
  };

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

    this.loading = true;

    this.turmasService.createTurma(this.model).subscribe({
      next: (response) => {
        this.loading = false;

        toast.success(`${response.message || 'Turma criada com sucesso!'}`, {
          duration: 4000,
          position: 'bottom-center',
        });

        this.reset();
        this.router.navigate(['cadastros/turmas']);
      },
      error: (err: any) => {
        this.loading = false;

        const errorMsg = err?.error?.message || err?.error?.error || 'Erro ao criar turma.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  reset() {
    this.model = {
      nome: '',
      curso_id: 0,
      dias_semana: '',
      horario_inicio: '',
      horario_fim: '',
      vagas_totais: 0,
      ativo: true,
    };

    toast('Formulário limpo!', {
      position: 'bottom-center'
    });
  }

  return() {
    this.router.navigate(['cadastros/turmas']);
  }
}
