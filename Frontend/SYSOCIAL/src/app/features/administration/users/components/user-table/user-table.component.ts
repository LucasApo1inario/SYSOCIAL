import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { User } from '../../interfaces/user.interface';
import { ZardButtonComponent } from '@shared/components/button/button.component';
import { ZardTableComponent, ZardTableHeaderComponent, ZardTableBodyComponent, ZardTableRowComponent, ZardTableHeadComponent, ZardTableCellComponent } from '@shared/components/table/table.component';
import { ZardBadgeComponent } from '@shared/components/badge/badge.component';


@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
    ZardBadgeComponent,
    ZardButtonComponent,
  ],
  templateUrl: './user-table.component.html',
})
export class UserTableComponent {
  @Input() users: User[] = [];
  @Output() edit = new EventEmitter<User>();
  @Output() delete = new EventEmitter<User>();


  trackById(index: number, user: User): string {
    return user.id;
  }

  onEdit(user: User) {
    this.edit.emit(user);
  }

  onDelete(user: User) {
    this.delete.emit(user);
  }

  getBadgeType(status: User['status']) {
    return status === 'Ativo' ? 'default' : 'destructive';
  }
}
