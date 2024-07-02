import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-buy-popup',
  templateUrl: './buy-popup.component.html',
  styleUrls: ['./buy-popup.component.css']
})
export class BuyPopupComponent {
  quantity: number = 0; // Default quantity is 1
  money: number = 2000.36;
  totalCost: number = 0;
  notEnoughMoney: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<BuyPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onCancel(): void {
    this.dialogRef.close();
  }

  onBuy(): void {
    // You can handle the buy action here, e.g., send the quantity to the server
    console.log('Buying', this.quantity, 'of', this.data.ticker);
    this.dialogRef.close();
  }

  checkCost(): void {
    this.totalCost = this.quantity * this.data.curPrice;
    this.notEnoughMoney = this.totalCost > this.money;
  }
}
