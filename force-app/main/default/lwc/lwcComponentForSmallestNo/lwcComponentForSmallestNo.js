import { LightningElement } from 'lwc';

export default class LwcComponentForSmallestNo extends LightningElement {
    
    FNum;
    SNum;
    TNum;
    Result=0;
    changeFirstNo(event) {  
        this.FNum = event.target.value;}
        changeSecondNo(event) {  
            this.SNum = event.target.value;}
            changeThirdNo(event) {  
                this.TNum = event.target.value;}
 findSmallest(event){
                const a = parseInt(this.FNum);
                const b = parseInt(this.SNum);
                 const c = parseInt(this.TNum);
                 if(a<b && a<c){
                     this.Result = a;
                 }else if(b<c && b<a){
                     this.Result = b;
                     }else if(c<a && c<b){
                        this.Result = c;
 }
}
}