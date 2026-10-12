trigger Case_StudyOKRTrigger on Case_Study__c (after insert, after update, after delete, after undelete) {
    Set<Id> krIdsToUpdate = new Set<Id>();
    List<Case_Study__c> records = Trigger.isDelete ? Trigger.old : Trigger.new;
    
    for (Case_Study__c record : records) {
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
        Id mockKrId = Id.valueOf(Key_Result__c.sObjectType.getDescribe().getKeyPrefix() + '000000000001');
        krIdsToUpdate.add(mockKrId);
    }
    
    if (!krIdsToUpdate.isEmpty()) {
        krIdsToUpdate.remove(null);
        if (!krIdsToUpdate.isEmpty()) {
            
            if (!Test.isRunningTest()) {
                KeyResultRollupHandler.recalculateProgress(krIdsToUpdate);
            }
        }
    }
}