import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Turma } from '../../interfaces/turma.interface';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent
} from '@shared/components/table/table.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-turma-table',
  standalone: true,
  imports: [
    CommonModule,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    ZardButtonComponent,
  ],
  templateUrl: './turma-table.component.html',
})
export class TurmaTableComponent {
  @Input() turmas: Turma[] = [];
  @Output() edit = new EventEmitter<Turma>();
  @Output() delete = new EventEmitter<Turma>();
  @Output() viewAlunos = new EventEmitter<Turma>();

  trackById(index: number, turma: Turma): number {
    return turma.id;
  }

  onEdit(turma: Turma) {
    this.edit.emit(turma);
  }

  onDelete(turma: Turma) {
    this.delete.emit(turma);
  }

  onViewAlunos(turma: Turma) {
    this.viewAlunos.emit(turma);
  }
}
