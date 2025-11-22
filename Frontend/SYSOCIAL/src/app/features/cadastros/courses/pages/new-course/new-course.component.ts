import { Component, inject } from '@angular/core';
import { CourseCreateRequest } from '../../interfaces/CourseCreateRequest.interface';
import { CoursesService } from '../../services/course.service';
import { FormsModule } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { toast } from 'ngx-sonner';
import { Router } from '@angular/router';

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

  idNome = 'nome';
  idDescricao = 'descricao';
  idCargaHoraria = 'cargaHoraria';
  idDataInicio = 'dataInicio';
  idDataTermino = 'dataTermino';
  idModalidade = 'modalidade';
  idStatus = 'status';
  idInstrutor = 'instrutor';
  idVagas = 'vagas';

  model: CourseCreateRequest = {
    nome: '',
    descricao: '',
    cargaHoraria: 0,
    dataInicio: '',
    dataTermino: '',
    modalidade: 'Online',
    status: 'Ativo',
    instrutor: '',
    vagas: 0
  };

  loading = false;

  onSubmit() {
    if (!this.model.nome || !this.model.descricao || !this.model.instrutor || !this.model.dataInicio) {
      toast.error('Preencha os campos obrigatórios.', {
        position: 'bottom-center',
      });
      return;
    }

    if (this.model.cargaHoraria <= 0) {
      toast.error('Carga horária deve ser maior que zero.', {
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
          descricao: '',
          cargaHoraria: 0,
          dataInicio: '',
          dataTermino: '',
          modalidade: 'Online',
          status: 'Ativo',
          instrutor: '',
          vagas: 0
        };

        this.router.navigate(['administration/courses']);
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
      descricao: '',
      cargaHoraria: 0,
      dataInicio: '',
      dataTermino: '',
      modalidade: 'Online',
      status: 'Ativo',
      instrutor: '',
      vagas: 0
    };

    toast('Formulário limpo!', {
      position: 'bottom-center'
    });
  }

  return() {
    this.router.navigate(['administration/courses']);
  }
}
