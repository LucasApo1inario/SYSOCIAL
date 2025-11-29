import { Component, inject } from '@angular/core';
import { CourseCreateRequest } from '../../interfaces/CourseCreateRequest.interface';
import { CoursesService } from '../../services/course.service';
import { FormsModule } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { toast } from 'ngx-sonner';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-new-course',
  standalone: true,
  imports: [
    CommonModule,
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

  loading = false;

  model: CourseCreateRequest = {
    nome: '',
    vagasTotais: 0,
    ativo: true,
  };

  onSubmit() {
    if (!this.model.nome || !this.model.vagasTotais) {
      toast.error('Preencha os campos obrigatórios: nome e vagas totais.', {
        position: 'bottom-center',
      });
      return;
    }

    if (this.model.vagasTotais <= 0) {
      toast.error('Número de vagas deve ser maior que zero.', {
        position: 'bottom-center',
      });
      return;
    }

    this.loading = true;

    this.courseService.createCourse(this.model).subscribe({
      next: (response) => {
        this.loading = false;

        toast.success(`${response.message || 'Curso criado com sucesso!'}`, {
          duration: 4000,
          position: 'bottom-center',
        });

        this.reset();
        this.router.navigate(['cadastros/courses']);
      },
      error: (err: any) => {
        this.loading = false;

        const errorMsg = err?.error?.message || err?.error?.error || 'Erro ao criar curso.';
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
      vagasTotais: 0,
      ativo: true,
    };

    toast('Formulário limpo!', {
      position: 'bottom-center'
    });
  }

  return() {
    this.router.navigate(['cadastros/courses']);
  }
}
