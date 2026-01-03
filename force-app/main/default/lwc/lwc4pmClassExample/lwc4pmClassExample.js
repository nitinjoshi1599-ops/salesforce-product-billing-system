import { LightningElement } from 'lwc';

export default class Lwc4pmClassExample extends LightningElement {
    FNum;
    SNum;
    Result=0;
    changeFirstNo(event) {
        this.FNum = event.target.value;
    }
    changeSecondNo(event) {
        this.SNum = event.target.value;
    }
      multiply(event) {
       const a = parseInt(this.FNum);
       const b = parseInt(this.SNum);
        this.Result = a * b;
    }
    }