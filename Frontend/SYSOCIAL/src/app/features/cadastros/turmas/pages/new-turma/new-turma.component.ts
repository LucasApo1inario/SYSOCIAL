import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TurmasService } from '../../services/turma.service';
import { CursoSearchModalComponent } from '../../components/curso-search-modal/curso-search-modal.component';
import { Course } from '../../../courses/interfaces/course.interface';
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
    CursoSearchModalComponent,
  ],
  templateUrl: './new-turma.component.html',
  styleUrl: './new-turma.component.css'
})
export class NewTurmaComponent {
  private router = inject(Router);
  private turmasService = inject(TurmasService);

  loading = signal(false);
  showCourseModal = signal(false);
  selectedCourse = signal<Course | null>(null);

  model: any = {
    cursoId: 0,
    nomeTurma: '',
    descricao: '',
    diaSemana: '',
    horaInicio: '',
    horaFim: '',
    vagasTurma: 0,
    dataInicio: '',
    dataFim: '',
  };

  onSubmit() {
    if (!this.model.nomeTurma || !this.model.cursoId || !this.model.vagasTurma) {
      toast.error('Preencha os campos obrigatórios: nome, curso e vagas.', {
        position: 'bottom-center',
      });
      return;
    }

    if (this.model.vagasTurma <= 0) {
      toast.error('Número de vagas deve ser maior que zero.', {
        position: 'bottom-center',
      });
      return;
    }

    if (!this.model.dataInicio || !this.model.dataFim) {
      toast.error('Preencha as datas de início e fim.', {
        position: 'bottom-center',
      });
      return;
    }

    // Preencher cursoId do curso selecionado
    if (!this.selectedCourse()) {
      toast.error('Selecione um curso.', {
        position: 'bottom-center',
      });
      return;
    }

    const payload = {
      cursoId: this.selectedCourse()!.id,
      nomeTurma: this.model.nomeTurma.trim(),
      descricao: this.model.descricao.trim(),
      diaSemana: this.model.diaSemana,
      horaInicio: this.model.horaInicio ? `${this.model.horaInicio}:00` : '00:00:00',
      horaFim: this.model.horaFim ? `${this.model.horaFim}:00` : '00:00:00',
      vagasTurma: this.model.vagasTurma,
      dataInicio: this.model.dataInicio,
      dataFim: this.model.dataFim,
    };

    console.log('Payload enviado:', payload);

    this.loading.set(true);

    this.turmasService.createTurma(payload).subscribe({
      next: (response) => {
        this.loading.set(false);

        toast.success(`${response.message || 'Turma criada com sucesso!'}`, {
          duration: 4000,
          position: 'bottom-center',
        });

        this.router.navigate(['cadastros/turmas']);
      },
      error: (err: any) => {
        this.loading.set(false);

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
      cursoId: 0,
      nomeTurma: '',
      descricao: '',
      diaSemana: '',
      horaInicio: '',
      horaFim: '',
      vagasTurma: 0,
      dataInicio: '',
      dataFim: '',
    };
    this.selectedCourse.set(null);

    toast('Formulário limpo!', {
      position: 'bottom-center'
    });
  }

  openCourseModal() {
    this.showCourseModal.set(true);
  }

  onCourseSelected(course: Course) {
    this.selectedCourse.set(course);
    this.model.cursoId = course.id;
    this.showCourseModal.set(false);
    toast.success(`Curso "${course.nome}" selecionado!`, {
      duration: 3000,
      position: 'bottom-center',
    });
  }

  onCourseModalClose() {
    this.showCourseModal.set(false);
  }

  private extractTimeFromISO(isoString: string): string {
    if (!isoString) return '';
    const match = isoString.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : '';
  }

  return() {
    this.router.navigate(['cadastros/turmas']);
  }
}
