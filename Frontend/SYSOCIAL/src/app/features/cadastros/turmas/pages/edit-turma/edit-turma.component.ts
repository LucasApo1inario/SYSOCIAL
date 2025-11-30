import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Turma } from '../../interfaces/turma.interface';
import { TurmasService } from '../../services/turma.service';
import { CursoSearchModalComponent } from '../../components/curso-search-modal/curso-search-modal.component';
import { Course } from '../../../courses/interfaces/course.interface';
import { CoursesService } from '../../../courses/services/course.service';
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
    CursoSearchModalComponent,
  ],
  templateUrl: './edit-turma.component.html',
  styleUrl: './edit-turma.component.css'
})
export class EditTurmaComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private turmasService = inject(TurmasService);
  private coursesService = inject(CoursesService);

  loading = signal(false);
  showCourseModal = signal(false);
  selectedCourse = signal<Course | null>(null);
  turmaId: number | null = null;

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

    this.loading.set(true);
    this.turmasService.getTurmaById(this.turmaId).subscribe({
      next: (turma: any) => {
        console.log(turma);
        // Extrai horários e datas do formato ISO quando necessário
        const horaInicio = turma.horaInicio
          ? this.extractTimeFromISO(turma.horaInicio)
          : (turma.horario_inicio ? this.extractTimeFromISO(turma.horario_inicio) : '');
        const horaFim = turma.horaFim
          ? this.extractTimeFromISO(turma.horaFim)
          : (turma.horario_fim ? this.extractTimeFromISO(turma.horario_fim) : '');
        const dataInicio = turma.dataInicio
          ? this.extractDateFromISO(turma.dataInicio)
          : '';
        const dataFim = turma.dataFim
          ? this.extractDateFromISO(turma.dataFim)
          : '';

        this.model = {
          cursoId: turma.cursoId || turma.curso_id || 0,
          nomeTurma: turma.nomeTurma || turma.nome || '',
          descricao: turma.descricao || '',
          diaSemana: turma.diaSemana || turma.dias_semana || '',
          horaInicio: horaInicio,
          horaFim: horaFim,
          vagasTurma: turma.vagasTurma || turma.vagas_totais || 0,
          dataInicio: dataInicio,
          dataFim: dataFim,
        };
        this.selectedCourse.set(null);
        
        // Buscar o curso vinculado à turma
        const cursoId = turma.cursoId || turma.curso_id;
        if (cursoId) {
          this.coursesService.getCourseById(cursoId).subscribe({
            next: (course) => {
              this.selectedCourse.set(course);
            },
            error: (err) => {
              console.error('Erro ao buscar curso:', err);
            }
          });
        }
        
        this.loading.set(false);
      },
      error: (err: any) => {
        this.loading.set(false);
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

    if (!this.turmaId) {
      toast.error('ID da turma não encontrado.', {
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

    this.turmasService.updateTurma(this.turmaId, payload).subscribe({
      next: (response) => {
        this.loading.set(false);

        toast.success(`${response.message || 'Turma atualizada com sucesso!'}`, {
          duration: 4000,
          position: 'bottom-center',
        });

        this.router.navigate(['cadastros/turmas']);
      },
      error: (err: any) => {
        this.loading.set(false);

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

  private extractDateFromISO(isoString: string): string {
    if (!isoString) return '';
    const match = isoString.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }

  return() {
    this.router.navigate(['cadastros/turmas']);
  }
}
