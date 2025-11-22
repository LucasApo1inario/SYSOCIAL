import { Component, inject } from '@angular/core';
import { CourseCreateRequest } from '../../interfaces/CourseCreateRequest.interface';
import { CoursesService } from '../../services/course.service';
import { FormsModule } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { toast } from 'ngx-sonner';
import { Router } from '@angular/router';
import { ZardDialogService } from '@shared/components/dialog/dialog.service';
import { TurmaDialogComponent, TurmaDialogData } from './turma-dialog.component';
import { TurmaCreateRequest } from '../../interfaces/TurmaCreateRequest.interface';

@Component({
  selector: 'app-new-course',
  standalone: true,
  imports: [
    FormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormModule,
  ],
  templateUrl: './new-course.component.html',
  styleUrl: './new-course.component.css'
})
export class NewCourseComponent {
  private router = inject(Router);
  private courseService = inject(CoursesService);
  private dialog = inject(ZardDialogService);

  idNome = 'nome';
  idStatus = 'status';
  idVagas = 'vagas';

  model: CourseCreateRequest = {
    nome: '',
    status: 'Ativo',
    vagas: 0,
    turmas: []
  };

  loading = false;

  // --------------------------
  //   GERENCIAMENTO DE TURMAS
  // --------------------------

  addTurma() {
    this.dialog.create({
      zTitle: 'Nova Turma',
      zDescription: 'Preencha os dados da nova turma.',
      zContent: TurmaDialogComponent,
      zData: {
        dia_semana: '',
        horario_inicio: '',
        horario_fim: '',
        vagas_turma: 0
      } as TurmaDialogData,
      zOkText: 'Salvar',
      zOnOk: instance => {
        const turma = instance.form.value as TurmaCreateRequest;
        this.model.turmas!.push(turma);
      },
      zWidth: '450px',
    });
  }

  editTurma(turma: TurmaCreateRequest, index: number) {
    this.dialog.create({
      zTitle: 'Editar Turma',
      zDescription: 'Atualize as informações da turma.',
      zContent: TurmaDialogComponent,
      zData: turma,
      zOkText: 'Atualizar',
      zOnOk: instance => {
        this.model.turmas![index] = instance.form.value as TurmaCreateRequest;
      },
      zWidth: '450px',
    });
  }

  deleteTurma(index: number) {
    this.model.turmas!.splice(index, 1);
  }

  // --------------------------
  //     SUBMIT DO CURSO
  // --------------------------
  onSubmit() {
    if (!this.model.nome || !this.model.vagas || !this.model.status) {
      toast.error('Preencha os campos obrigatórios.', {
        position: 'bottom-center',
      });
      return;
    }

    if (this.model.vagas <= 0) {
      toast.error('Número de vagas deve ser maior que zero.', {
        position: 'bottom-center',
      });
      return;
    }

    this.loading = true;

    this.courseService.createCourse(this.model).subscribe({
      next: () => {
        this.loading = false;

        toast.success('Curso criado com sucesso!', {
          duration: 4000,
          position: 'bottom-center',
        });

        this.model = {
          nome: '',
          status: 'Ativo',
          vagas: 0,
          turmas: []
        };

        this.router.navigate(['cadastros/courses']);
      },
      error: (err: any) => {
        this.loading = false;

        toast.error(err?.error?.error || 'Erro ao criar curso.', {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  reset() {
    this.model = {
      nome: '',
      status: 'Ativo',
      vagas: 0,
      turmas: []
    };

    toast('Formulário limpo!', {
      position: 'bottom-center'
    });
  }

  return() {
    this.router.navigate(['cadastros/courses']);
  }
}
