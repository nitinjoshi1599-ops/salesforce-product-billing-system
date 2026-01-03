import { api, LightningElement, track } from 'lwc';

export default class DecoratorDemo extends LightningElement {
   @api recordId;
   @track message = "Hey!! This is a private message    "
    handleClick(event){
        this.message = event.target.value;
    }
}