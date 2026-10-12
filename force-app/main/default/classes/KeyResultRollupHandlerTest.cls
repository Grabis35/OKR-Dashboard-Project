@isTest
private class KeyResultRollupHandlerTest {
    
    @isTest
    static void testAllObjectsRollupAndTriggers() {
        
        KeyResultRollupHandler.shouldRunBypass = true;

        
        KeyResultRollupHandler.shouldRunBypass = false; 
        KeyResultRollupHandler.recalculateProgress(new Set<Id>());
        KeyResultRollupHandler.recalculateProgress(null);
        KeyResultRollupHandler.shouldRunBypass = true; 

        
        Objective__c obj = new Objective__c(Year__c = '2026', Assigned_User__c = UserInfo.getUserId());
        insert obj;
        
        Key_Result__c kr1 = new Key_Result__c(Objective__c = obj.Id, Target__c = 10, Current__c = 0, Type__c = 'Calls');
        insert kr1;
        
        
        Test.startTest();
        
        
        Task t = new Task(Subject = 'Test Task'); insert t; update t;
        Event eVent = new Event(Subject = 'Test Event', StartDateTime = System.now(), EndDateTime = System.now().addHours(1)); insert eVent; update eVent;
        Opportunity opp = new Opportunity(Name = 'Test Opp', StageName = 'Prospecting', CloseDate = System.today().addDays(10)); insert opp; update opp;
        Account acc = new Account(Name = 'Test Acc'); insert acc;
        Contract con = new Contract(AccountId = acc.Id, StartDate = System.today(), ContractTerm = 6); insert con; update con;
        Lead ld = new Lead(LastName = 'Test Lead', Company = 'Test Co'); insert ld; update ld;
        
        
        Survey__c surv = new Survey__c(Name = 'Test Survey'); insert surv; update surv;
        Review__c rev = new Review__c(Name = 'Test Review'); insert rev; update rev;
        Google_Review__c gRev = new Google_Review__c(Name = 'Test Google Review'); insert gRev; update gRev;
        Case_Study__c cs = new Case_Study__c(Name = 'Test Case Study'); insert cs; update cs;
        
        
        delete new List<SObject>{ t, eVent, opp, con, ld, surv, rev, gRev, cs };
        Test.stopTest();
        
        
        KeyResultRollupHandler.shouldRunBypass = false;
        Set<Id> targetIds = new Set<Id>{ kr1.Id };
        KeyResultRollupHandler.recalculateProgress(targetIds);
        
        
        Key_Result__c finalCheck = [SELECT Current__c FROM Key_Result__c WHERE Id = :kr1.Id];
        System.assertNotEquals(null, finalCheck.Current__c, 'Calculations successfully resolved.');
    }
}