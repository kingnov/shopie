import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  type?: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'badge' | 'image' | 'actions';
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: (value: any) => string;
  badgeColors?: { [key: string]: string };
}

export interface TableAction {
  label: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  action: (item: any) => void;
  visible?: (item: any) => boolean;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | null;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css'
})
export class DataTableComponent implements OnInit {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() actions: TableAction[] = [];
  @Input() loading: boolean = false;
  @Input() selectable: boolean = false;
  @Input() searchable: boolean = true;
  @Input() sortable: boolean = true;
  @Input() emptyMessage: string = 'No data available';
  @Input() loadingMessage: string = 'Loading...';

  @Output() sort = new EventEmitter<SortEvent>();
  @Output() search = new EventEmitter<string>();
  @Output() selectionChange = new EventEmitter<any[]>();

  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' | null = null;
  selectedItems: any[] = [];
  allSelected: boolean = false;

  ngOnInit() {
    // Initialize component
  }

  onSearch() {
    this.search.emit(this.searchTerm);
  }

  onSort(column: TableColumn) {
    if (!column.sortable) return;

    if (this.sortColumn === column.key) {
      // Toggle direction
      if (this.sortDirection === 'asc') {
        this.sortDirection = 'desc';
      } else if (this.sortDirection === 'desc') {
        this.sortDirection = null;
        this.sortColumn = '';
      } else {
        this.sortDirection = 'asc';
      }
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.sort.emit({
      column: this.sortColumn,
      direction: this.sortDirection
    });
  }

  onSelectAll() {
    this.allSelected = !this.allSelected;
    if (this.allSelected) {
      this.selectedItems = [...this.data];
    } else {
      this.selectedItems = [];
    }
    this.selectionChange.emit(this.selectedItems);
  }

  onSelectItem(item: any) {
    const index = this.selectedItems.findIndex(selected => selected.id === item.id);
    if (index > -1) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(item);
    }
    
    this.allSelected = this.selectedItems.length === this.data.length;
    this.selectionChange.emit(this.selectedItems);
  }

  isSelected(item: any): boolean {
    return this.selectedItems.some(selected => selected.id === item.id);
  }

  getCellValue(item: any, column: TableColumn): any {
    const value = this.getNestedValue(item, column.key);
    
    if (column.format) {
      return column.format(value);
    }

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value || 0);
      
      case 'date':
        return value ? new Date(value).toLocaleDateString() : '';
      
      case 'boolean':
        return value ? 'Yes' : 'No';
      
      default:
        return value;
    }
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  getBadgeClass(value: any, column: TableColumn): string {
    if (!column.badgeColors) return 'bg-gray-100 text-gray-800';
    
    const colorClass = column.badgeColors[value] || 'bg-gray-100 text-gray-800';
    return colorClass;
  }

  getActionClass(action: TableAction): string {
    const baseClasses = 'px-3 py-1 text-xs font-medium rounded-md transition-colors';
    
    switch (action.color) {
      case 'primary':
        return `${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-200`;
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800 hover:bg-green-200`;
      case 'warning':
        return `${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-200`;
      case 'danger':
        return `${baseClasses} bg-red-100 text-red-800 hover:bg-red-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 hover:bg-gray-200`;
    }
  }

  isActionVisible(action: TableAction, item: any): boolean {
    return action.visible ? action.visible(item) : true;
  }

  executeAction(action: TableAction, item: any) {
    action.action(item);
  }

  getSortIcon(column: TableColumn): string {
    if (!column.sortable || this.sortColumn !== column.key) {
      return 'M7 10l5 5 5-5z'; // Default sort icon
    }

    if (this.sortDirection === 'asc') {
      return 'M7 14l5-5 5 5z'; // Up arrow
    } else if (this.sortDirection === 'desc') {
      return 'M7 10l5 5 5-5z'; // Down arrow
    }

    return 'M7 10l5 5 5-5z';
  }

  getColumnAlignment(column: TableColumn): string {
    switch (column.align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}
