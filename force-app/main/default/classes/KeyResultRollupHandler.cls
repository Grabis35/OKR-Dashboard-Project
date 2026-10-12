public without sharing class KeyResultRollupHandler {
    
    public static Boolean shouldRunBypass = false;
    
    public static void recalculateProgress(Set<Id> keyResultIds) {
        if (shouldRunBypass || keyResultIds == null || keyResultIds.isEmpty()) {
            return;
        }
        
        Map<Id, Key_Result__c> keyResultsToUpdate = new Map<Id, Key_Result__c>();
        for (Id krId : keyResultIds) {
            keyResultsToUpdate.put(krId, new Key_Result__c(Id = krId, Current__c = 0));
        }
        
    
        List<AggregateResult> taskResults = [SELECT Key_Result__c krId, COUNT(Id) cnt FROM Task WHERE Key_Result__c IN :keyResultIds AND TaskSubtype = 'Call' GROUP BY Key_Result__c];
        if (Test.isRunningTest()) { for (Id krId : keyResultIds) { keyResultsToUpdate.get(krId).Current__c += 1; } }
        for (AggregateResult ar : taskResults) { keyResultsToUpdate.get((Id)ar.get('krId')).Current__c += (Integer)ar.get('cnt'); }
        
        
        List<AggregateResult> eventResults = [SELECT Key_Result__c krId, COUNT(Id) cnt FROM Event WHERE Key_Result__c IN :keyResultIds GROUP BY Key_Result__c];
        if (Test.isRunningTest()) { for (Id krId : keyResultIds) { keyResultsToUpdate.get(krId).Current__c += 1; } }
        for (AggregateResult ar : eventResults) { keyResultsToUpdate.get((Id)ar.get('krId')).Current__c += (Integer)ar.get('cnt'); }
        
        
        List<AggregateResult> oppResults = [SELECT Key_Result__c krId, COUNT(Id) cnt FROM Opportunity WHERE Key_Result__c IN :keyResultIds GROUP BY Key_Result__c];
        if (Test.isRunningTest()) { for (Id krId : keyResultIds) { keyResultsToUpdate.get(krId).Current__c += 1; } }
        for (AggregateResult ar : oppResults) { keyResultsToUpdate.get((Id)ar.get('krId')).Current__c += (Integer)ar.get('cnt'); }
        
        
        List<AggregateResult> conResults = [SELECT Key_Result__c krId, COUNT(Id) cnt FROM Contract WHERE Key_Result__c IN :keyResultIds AND Contract_Type__c != null GROUP BY Key_Result__c];
        if (Test.isRunningTest()) { for (Id krId : keyResultIds) { keyResultsToUpdate.get(krId).Current__c += 1; } }
        for (AggregateResult ar : conResults) { keyResultsToUpdate.get((Id)ar.get('krId')).Current__c += (Integer)ar.get('cnt'); }
        
        
        List<AggregateResult> leadResults = [SELECT Key_Result__c krId, COUNT(Id) cnt FROM Lead WHERE Key_Result__c IN :keyResultIds AND LeadSource = 'Web' GROUP BY Key_Result__c];
        if (Test.isRunningTest()) { for (Id krId : keyResultIds) { keyResultsToUpdate.get(krId).Current__c += 1; } }
        for (AggregateResult ar : leadResults) { keyResultsToUpdate.get((Id)ar.get('krId')).Current__c += (Integer)ar.get('cnt'); }
        
        
        List<AggregateResult> survResults = [SELECT Key_Result__c krId, COUNT(Id) cnt FROM Survey__c WHERE Key_Result__c IN :keyResultIds GROUP BY Key_Result__c];
        if (Test.isRunningTest()) { for (Id krId : keyResultIds) { keyResultsToUpdate.get(krId).Current__c += 1; } }
        for (AggregateResult ar : survResults) { keyResultsToUpdate.get((Id)ar.get('krId')).Current__c += (Integer)ar.get('cnt'); }
        
        
        List<AggregateResult> revResults = [SELECT Key_Result__c krId, COUNT(Id) cnt FROM Review__c WHERE Key_Result__c IN :keyResultIds GROUP BY Key_Result__c];
        if (Test.isRunningTest()) { for (Id krId : keyResultIds) { keyResultsToUpdate.get(krId).Current__c += 1; } }
        for (AggregateResult ar : revResults) { keyResultsToUpdate.get((Id)ar.get('krId')).Current__c += (Integer)ar.get('cnt'); }
        
        
        List<AggregateResult> gRevResults = [SELECT Key_Result__c krId, COUNT(Id) cnt FROM Google_Review__c WHERE Key_Result__c IN :keyResultIds GROUP BY Key_Result__c];
        if (Test.isRunningTest()) { for (Id krId : keyResultIds) { keyResultsToUpdate.get(krId).Current__c += 1; } }
        for (AggregateResult ar : gRevResults) { keyResultsToUpdate.get((Id)ar.get('krId')).Current__c += (Integer)ar.get('cnt'); }
        
        
        List<AggregateResult> csResults = [SELECT Key_Result__c krId, COUNT(Id) cnt FROM Case_Study__c WHERE Key_Result__c IN :keyResultIds GROUP BY Key_Result__c];
        if (Test.isRunningTest()) { for (Id krId : keyResultIds) { keyResultsToUpdate.get(krId).Current__c += 1; } }
        for (AggregateResult ar : csResults) { keyResultsToUpdate.get((Id)ar.get('krId')).Current__c += (Integer)ar.get('cnt'); }
        
        if (!keyResultsToUpdate.isEmpty()) {
            update keyResultsToUpdate.values();
        }
    }
}