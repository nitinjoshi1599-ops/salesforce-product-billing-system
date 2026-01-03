import { LightningElement,track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import JSQR from '@salesforce/resourceUrl/jsQR';

import getActivePricebooks from '@salesforce/apex/ProductBillingController.getActivePricebooks';
import getProductDetailsByCodes from '@salesforce/apex/ProductBillingController.getProductDetailsByCodes';

export default class ProductBilling extends LightningElement {
    @track pricebookOptions = [];
    selectedPricebook = '';
    gstMode = 'with';
    gstModeOptions = [
        { label: 'With GST', value: 'with' },
        { label: 'Without GST', value: 'without' }
    ];
    manualCode = '';
    lines = []; 
    jsqrLoaded = false;

    // totals
    totalQuantity = 0;
    subTotal = 0;
    totalCgst = 0;
    totalSgst = 0;
    totalIgst = 0;
    grandTotal = 0;

    connectedCallback() {
        this.loadPricebooks();
        // preload jsQR but will also load when scanning
    }

    // load active pricebooks from Apex
    loadPricebooks() {
        getActivePricebooks()
            .then(result => {
                this.pricebookOptions = result.map(pb => ({ label: pb.Name, value: pb.Id }));
            })
            .catch(error => {
                console.error('Error loading pricebooks', error);
            });
    }

    handlePricebookChange(event) {
        this.selectedPricebook = event.detail.value;
    }

    handleGstModeChange(event) {
        this.gstMode = event.detail.value;
        this.computeTotals();
    }

    handleManualCode(event) {
        this.manualCode = event.detail.value;
    }

    handleAddManual() {
        const code = (this.manualCode || '').trim();
        if (!code) {
            alert('Enter a product code to add.');
            return;
        }
        if (!this.selectedPricebook) {
            alert('Please select a Price Book first.');
            return;
        }
        this.addProductsByCodes([code]);
        this.manualCode = '';
    }

    // Button: Scan Product (click) 
    handleScanClick() {
        const fileInput = this.template.querySelector('input[type="file"]');
        if (fileInput) fileInput.click();
    }

    // When a file selected from camera -> decode using jsQR
    handleFileChange(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // create canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
               
                if (!this.jsqrLoaded) {
                    loadScript(this, JSQR)
                        .then(() => {
                            this.jsqrLoaded = true;
                            this.decodeCanvas(canvas, ctx);
                        })
                        .catch(err => {
                            console.error('Error loading jsQR', err);
                            alert('Failed to load QR decoder.');
                        });
                } else {
                    this.decodeCanvas(canvas, ctx);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        // clear value so same file can be uploaded again
        event.target.value = '';
    }

    decodeCanvas(canvas, ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        try {
            const code = window.jsQR(imageData.data, imageData.width, imageData.height);
            if (code && code.data) {
                // assume QR contains product code
                this.addProductsByCodes([code.data.trim()]);
            } else {
                alert('No QR code detected. Try a clear, well-lit photo of the QR.');
            }
        } catch (e) {
            console.error('QR decode error', e);
            alert('Error decoding QR. Try again.');
        }
    }

   
    addProductsByCodes(codes) {
        getProductDetailsByCodes({ productCodes: codes, pricebookId: this.selectedPricebook })
            .then(result => {
                if (!result || result.length === 0) {
                    alert('Product not found in selected price book or missing Product record.');
                    return;
                }
                result.forEach(p => {
                    // check duplicate by productCode
                    const existing = this.lines.find(l => l.productCode === p.productCode);
                    if (existing) {
                        existing.quantity = Number(existing.quantity) + 1;
                    } else {
                        const gstPercent = p.gst ? Number(p.gst) : 0;
                        const line = {
                            productId: p.productId,
                            name: p.name,
                            productCode: p.productCode,
                            quantity: 1,
                            unitPrice: p.unitPrice !== null ? p.unitPrice : 0,
                            gstPercent: gstPercent,
                            expiryDate: p.expiryDate,
                            isNearExpiry: this.checkNearExpiry(p.expiryDate),
                            rowClass: this.checkNearExpiry(p.expiryDate) ? 'near-expiry' : ''
                        };
                       
                        line.cgstAmount = 0;
                        line.sgstAmount = 0;
                        line.igstAmount = 0;
                        this.lines.push(line);
                    }
                });
                this.computeTotals();
            })
            .catch(error => {
                console.error('Error fetching product', error);
                alert('Error fetching product details. Check console for details.');
            });
    }

    checkNearExpiry(expiryDateStr) {
        if (!expiryDateStr) return false;
        const expiry = new Date(expiryDateStr);
        const today = new Date();
        const diffMs = expiry - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const THRESHOLD = 30; // days
        return diffDays <= THRESHOLD;
    }

    handleQtyChange(event) {
        const code = event.target.dataset.productcode;
        const val = Number(event.detail ? event.detail.value : event.target.value);
        const line = this.lines.find(l => l.productCode === code);
        if (line) {
            line.quantity = val < 1 ? 1 : val;
            this.computeTotals();
        }
    }

    handleRemoveLine(event) {
        const code = event.target.dataset.productcode;
        this.lines = this.lines.filter(l => l.productCode !== code);
        this.computeTotals();
    }

    // Compute totals and GST split 
    computeTotals() {
        // For demo 
        let billingState = this.template.querySelector('[data-id="billingState"]') ? this.template.querySelector('[data-id="billingState"]').value : null;
        let shippingState = this.template.querySelector('[data-id="shippingState"]') ? this.template.querySelector('[data-id="shippingState"]').value : null;

        let sub = 0;
        let totalQty = 0;
        let totCgst = 0;
        let totSgst = 0;
        let totIgst = 0;

        this.lines.forEach(line => {
            const qty = Number(line.quantity);
            const unit = Number(line.unitPrice);
            const gst = Number(line.gstPercent || 0);
            const lineSub = unit * qty;
            sub += lineSub;
            totalQty += qty;

            // default: if GST mode without apply 0
            if (this.gstMode === 'without') {
                line.cgstAmount = 0;
                line.sgstAmount = 0;
                line.igstAmount = 0;
            } else {
                // determine if IGST or CGST/SGST
                const gstAmount = (lineSub * gst) / 100.0;
                if (billingState && shippingState && billingState.trim().toLowerCase() === shippingState.trim().toLowerCase()) {
                    // same state -> split equally into CGST & SGST
                    line.cgstAmount = (gstAmount / 2).toFixed(2);
                    line.sgstAmount = (gstAmount / 2).toFixed(2);
                    line.igstAmount = 0;
                } else {
                    // different state -> IGST
                    line.cgstAmount = 0;
                    line.sgstAmount = 0;
                    line.igstAmount = gstAmount.toFixed(2);
                }
            }

            totCgst += Number(line.cgstAmount || 0);
            totSgst += Number(line.sgstAmount || 0);
            totIgst += Number(line.igstAmount || 0);
        });

        const grand = sub + totCgst + totSgst + totIgst;

        // set reactive fields
        this.totalQuantity = totalQty;
        this.subTotal = sub.toFixed(2);
        this.totalCgst = totCgst.toFixed(2);
        this.totalSgst = totSgst.toFixed(2);
        this.totalIgst = totIgst.toFixed(2);
        this.grandTotal = grand.toFixed(2);
    }
}

console.log