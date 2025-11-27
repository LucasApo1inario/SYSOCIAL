import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ZardInputDirective } from '@shared/components/input/input.directive';
import { Z_MODAL_DATA } from '@shared/components/dialog/dialog.service';

export interface TurmaDialogData {
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  vagas_turma: number;
}

@Component({
  selector: 'app-turma-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ZardInputDirective
  ],
  template: `
    <form [formGroup]="form" class="grid gap-4">

      <!-- DIA DA SEMANA -->
      <div class="grid gap-2">
        <label class="text-sm font-medium">Dia da Semana</label>

        <select z-input formControlName="dia_semana">
          <option value="" disabled selected>Selecione o dia</option>
          <option value="Segunda-feira">Segunda-feira</option>
          <option value="Terça-feira">Terça-feira</option>
          <option value="Quarta-feira">Quarta-feira</option>
          <option value="Quinta-feira">Quinta-feira</option>
          <option value="Sexta-feira">Sexta-feira</option>
          <option value="Sábado">Sábado</option>
          <option value="Domingo">Domingo</option>
        </select>
      </div>

      <!-- HORÁRIO INÍCIO -->
      <div class="grid gap-2">
        <label class="text-sm font-medium">Horário (Início)</label>
        <input
          z-input
          type="time"
          formControlName="horario_inicio"
        />
      </div>

      <!-- HORÁRIO FIM -->
      <div class="grid gap-2">
        <label class="text-sm font-medium">Horário (Fim)</label>
        <input
          z-input
          type="time"
          formControlName="horario_fim"
        />
      </div>

      <!-- VAGAS -->
      <div class="grid gap-2">
        <label class="text-sm font-medium">Vagas da Turma</label>
        <input
          z-input
          type="number"
          min="1"
          formControlName="vagas_turma"
          placeholder="30"
        />
      </div>

    </form>
  `,
  exportAs: 'turmaDialog',
})
export class TurmaDialogComponent {
  private zData: TurmaDialogData = inject(Z_MODAL_DATA);

  form = new FormGroup({
    dia_semana: new FormControl(''),
    horario_inicio: new FormControl(''),
    horario_fim: new FormControl(''),
    vagas_turma: new FormControl(0),
  });

  constructor() {
    if (this.zData) {
      this.form.patchValue(this.zData);
    }
  }
}
