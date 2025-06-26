import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold mb-4">{{ title }}</h3>
        <p class="mb-6">{{ message }}</p>
        <div class="flex justify-end gap-2">
          <button (click)="cancel.emit()" class="px-4 py-2 rounded bg-gray-200">Cancel</button>
          <button (click)="confirm.emit()" class="px-4 py-2 rounded bg-red-600 text-white">Confirm</button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmModalComponent {
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure?';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}