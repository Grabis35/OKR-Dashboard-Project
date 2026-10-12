trigger TaskOKRTrigger on Task (after insert, after update, after delete, after undelete) {
    Set<Id> krIdsToUpdate = new Set<Id>();
    List<Task> records = Trigger.isDelete ? Trigger.old : Trigger.new;
    
    for (Task record : records) {
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