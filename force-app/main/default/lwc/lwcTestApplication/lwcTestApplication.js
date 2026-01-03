import { LightningElement } from 'lwc';

export default class LwcTestApplication extends LightningElement {
    name = 'Nitin Joshi';
    
handlechange(event){
    this.name = 'Sharuk Khan';

}
}