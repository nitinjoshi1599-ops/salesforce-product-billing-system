import { LightningElement,track } from 'lwc';

export default class Calculator extends LightningElement {
    @track FirstNumber;
    @track SecondNumber;
    @track result;
    @track showResult = false;
    @track previousShowResult = [];
    handlechange(event){
        if(event.target.name === 'fnum'){
            this.firstnumber = event.target.value;
        }
        else{
            this.secondnumber = event.target.value;
        }
    }

calculation(event){
    if(event.target.name === 'add'){
        this.result = 'sum of ' + this.firstnumber + ' and ' + this.secondnumber + ' is ' + (parseInt(this.firstnumber) + parseInt(this.secondnumber));
        previousShowResult.push(this.result);
    } else if (event.target.name === 'sub'){
        this.result = 'sub of ' + this.firstnumber + ' and ' + this.secondnumber + ' is ' + (parseInt(this.firstnumber) - parseInt(this.secondnumber))
        previousShowResult.push(this.result);
}else if (event.target.name === 'mul'){
        this.result = 'mul of ' + this.firstnumber + ' and ' + this.secondnumber + ' is ' + (parseInt(this.firstnumber) * parseInt(this.secondnumber))
        previousShowResult.push(this.result);
}else if (event.target.name === 'div'){
        this.result = 'div of ' + this.firstnumber + ' and ' + this.secondnumber + ' is ' + (parseInt(this.firstnumber) / parseInt(this.secondnumber))
        previousShowResult.push(this.result);
} if(event.target.name === 'preview'){
 this.showResult = true;
}
}
}