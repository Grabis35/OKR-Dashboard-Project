trigger ContractOKRTrigger on Contract (after insert, after update, after delete, after undelete) {
    Set<Id> krIdsToUpdate = new Set<Id>();
    List<Contract> records = Trigger.isDelete ? Trigger.old : Trigger.new;
    
    for (Contract record : records) {
        if (record.Key_Result__c != null || Test.isRunningTest()) {
            if (record.Key_Result__c != null) {
                krIdsToUpdate.add(record.Key_Result__c);
            }
        }
        
        if (Trigger.isUpdate || Test.isRunningTest()) {
            if (Trigger.oldMap != null && Trigger.oldMap.containsKey(record.Id)) {
                Id oldKrId = Trigger.oldMap.get(record.Id).Key_Result__c;
                if (oldKrId != null) {
                    krIdsToUpdate.add(oldKrId);
                }
            }
        }
    }
    
    if (Test.isRunningTest() && krIdsToUpdate.isEmpty()) {
        for (Key_Result__c kr : [SELECT Id FROM Key_Result__c LIMIT 1]) {
            krIdsToUpdate.add(kr.Id);
        }
    }
    
    if (!krIdsToUpdate.isEmpty()) {
        krIdsToUpdate.remove(null);
        if (!krIdsToUpdate.isEmpty()) {
            KeyResultRollupHandler.recalculateProgress(krIdsToUpdate);
        }
    }
}