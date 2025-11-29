import { Component, inject, OnInit } from '@angular/core';
import { CourseCreateRequest } from '../../interfaces/CourseCreateRequest.interface';
import { CoursesService } from '../../services/course.service';
import { FormsModule } from '@angular/forms';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardInputDirective } from '@shared/components/input/input.directive';
import { ZardFormModule } from '@shared/components/form/form.module';
import { toast } from 'ngx-sonner';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-course',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardButtonComponent,
    ZardInputDirective,
    ZardFormModule,
  ],
  templateUrl: './edit-course.component.html',
  styleUrl: './edit-course.component.css'
})
export class EditCourseComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private courseService = inject(CoursesService);

  loading = false;
  courseId: number | null = null;

  model: CourseCreateRequest = {
    nome: '',
    vagasTotais: 0,
    ativo: true,
  };

  ngOnInit() {
    this.courseId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.courseId) {
      this.loadCourse();
    }
  }

  /**
   * Carrega os dados do curso para edição
   */
  loadCourse() {
    if (!this.courseId) return;

    this.loading = true;
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.model = {
          nome: course.nome,
          vagasTotais: course.vagasTotais,
          ativo: course.ativo,
          vagasRestantes: course.vagasRestantes,
        };
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        const errorMsg = err?.error?.message || 'Erro ao carregar curso.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
        this.router.navigate(['cadastros/courses']);
      }
    });
  }

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

    if (!this.courseId) {
      toast.error('ID do curso não encontrado.', {
        position: 'bottom-center',
      });
      return;
    }

    this.loading = true;

    this.courseService.updateCourse(this.courseId, this.model).subscribe({
      next: (response) => {
        this.loading = false;

        toast.success(`${response.message || 'Curso atualizado com sucesso!'}`, {
          duration: 4000,
          position: 'bottom-center',
        });

        this.router.navigate(['cadastros/courses']);
      },
      error: (err: any) => {
        this.loading = false;

        const errorMsg = err?.error?.message || err?.error?.error || 'Erro ao atualizar curso.';
        toast.error(errorMsg, {
          duration: 5000,
          position: 'bottom-center',
        });
      }
    });
  }

  reset() {
    this.loadCourse();

    toast('Formulário restaurado!', {
      position: 'bottom-center'
    });
  }

  return() {
    this.router.navigate(['cadastros/courses']);
  }
}
