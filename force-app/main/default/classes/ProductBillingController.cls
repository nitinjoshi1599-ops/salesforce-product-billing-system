public with sharing class ProductBillingController {
    // Return active pricebooks
    @AuraEnabled(cacheable=true)
    public static List<Pricebook2> getActivePricebooks() {
        return [SELECT Id, Name FROM Pricebook2 WHERE IsActive = true ORDER BY Name];
    }

    @AuraEnabled
    public static List<ProductWrapper> getProductDetailsByCodes(List<String> productCodes, Id pricebookId) {
        if (productCodes == null || productCodes.isEmpty() || pricebookId == null) {
            return new List<ProductWrapper>();
        }
        List<Product2> prods = [
            SELECT Id, Name, ProductCode, GST_Applicable__c, Expiry_Date__c
            FROM Product2
            WHERE ProductCode IN :productCodes
        ];

        Map<String, Product2> codeToProd = new Map<String, Product2>();
        List<Id> productIds = new List<Id>();
        for (Product2 p : prods) {
            codeToProd.put(p.ProductCode, p);
            productIds.add(p.Id);
        }

        List<PricebookEntry> pbes = [
            SELECT Id, Product2Id, UnitPrice, Pricebook2Id, IsActive
            FROM PricebookEntry
            WHERE Pricebook2Id = :pricebookId AND Product2Id IN :productIds AND IsActive = true
        ];

        Map<Id, PricebookEntry> pbeByProdId = new Map<Id, PricebookEntry>();
        for (PricebookEntry pbe : pbes) pbeByProdId.put(pbe.Product2Id, pbe);

        List<ProductWrapper> result = new List<ProductWrapper>();
        for (String code : productCodes) {
            Product2 p = codeToProd.get(code);
            if (p != null) {
                PricebookEntry pbe = pbeByProdId.get(p.Id);
                Decimal unit = pbe != null ? pbe.UnitPrice : 0;
               result.add(new ProductWrapper(
    p.Id,
    p.Name,
    p.ProductCode,
    unit,
    p.GST_Applicable__c,
    p.Expiry_Date__c
));
            }
        }
        return result;
    }

    // Wrapper class returned to LWC
    public class ProductWrapper {
        @AuraEnabled public Id productId;
        @AuraEnabled public String name;
        @AuraEnabled public String productCode;
        @AuraEnabled public Decimal unitPrice;
        @AuraEnabled public Decimal gst; 
        @AuraEnabled public Date expiryDate;

        public ProductWrapper(Id productId, String name, String productCode, Decimal unitPrice, Decimal gst, Date expiryDate)  {
            this.productId = productId;
            this.name = name;
            this.productCode = productCode;
            this.unitPrice = unitPrice;
            this.gst = gst;
            this.expiryDate = expiryDate;
        }
    }
}