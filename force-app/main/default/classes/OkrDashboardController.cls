public with sharing class OkrDashboardController {

    
    @AuraEnabled(cacheable=true)
    public static List<Objective__c> getOkrTree(String selectedYear, Id selectedUserId) {
        
        if (String.isEmpty(selectedYear) || selectedUserId == null) {
            return new List<Objective__c>();
        }

        
        return [
            SELECT Id, Name, Year__c, Assigned_User__c, Assigned_User__r.Name,
                   (SELECT Id, Name, Target__c, Current__c, Type__c FROM Key_Results__r ORDER BY Name ASC)
            FROM Objective__c
            WHERE Year__c = :selectedYear
            AND Assigned_User__c = :selectedUserId
            ORDER BY CreatedDate DESC
        ];
    }

    
    @AuraEnabled
    public static SObject createCustomActivityRecord(String objectApiName, String recordName, Id keyResultId) {
        try {
            
            Schema.SObjectType targetType = Schema.getGlobalDescribe().get(objectApiName);
            if (targetType == null) {
                throw new AuraHandledException('Invalid object type specified: ' + objectApiName);
            }
            
            SObject newRecord = targetType.newSObject();
            
            
            newRecord.put('Name', recordName);
            newRecord.put('Key_Result__c', keyResultId);
            
            
            insert newRecord;
            return newRecord;
            
        } catch (Exception ex) {
            throw new AuraHandledException('Failed to generate record: ' + ex.getMessage());
        }
    }

    
    @AuraEnabled
    public static Objective__c createQuickObjective(String year, Id userId, String name) {
        try {
            Objective__c newObj = new Objective__c(
                Name = name,
                Year__c = year,
                Assigned_User__c = userId
            );
            insert newObj;
            return newObj;
        } catch(Exception ex) {
            throw new AuraHandledException('Failed to create Objective: ' + ex.getMessage());
        }
    }
     
    @AuraEnabled(cacheable=true)
    public static List<User> getActiveUsers() {
        return [
            SELECT Id, Name 
            FROM User 
            WHERE IsActive = true 
            AND UserType = 'Standard'
            ORDER BY Name ASC
        ];
    }
}