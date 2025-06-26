import { Component, Input, Output, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/services/product.service';

@Component({
  selector: 'app-offer-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offer-dialog.component.html',
  styleUrl: './offer-dialog.component.css'
})
export class OfferDialogComponent implements OnInit, OnDestroy {
  @Input() product!: Product;
  @Input() show = false;
  @Output() close = new EventEmitter<void>();

  countdown = 12 * 60; // 12 minutes in seconds
  timer: any;

  get minutes(): string {
    return Math.floor(this.countdown / 60).toString().padStart(2, '0');
  }
  get seconds(): string {
    return (this.countdown % 60).toString().padStart(2, '0');
  }

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  startTimer() {
    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      }
    }, 1000);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('offer-dialog-backdrop')) {
      this.close.emit();
    }
  }

  closeDialog() {
    this.close.emit();
  }
}