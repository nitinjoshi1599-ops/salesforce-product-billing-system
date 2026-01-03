import { LightningElement,api, wire } from 'lwc';
import getMyBills from '@salesforce/apex/ResidentController.getMyBills';
export default class MyBillsTableForProject extends LightningElement {
      @api residentId;   
    columns = [
        { label: 'Bill Name', fieldName: 'Name' },
        { label: 'Amount', fieldName: 'Amount__c', type: 'currency' },
        { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date' },
        { label: 'Status', fieldName: 'Status__c' }
    ];

    @wire(getMyBills ,{ residentId: '$residentId' }) bills; 
}