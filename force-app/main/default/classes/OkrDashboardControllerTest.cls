@isTest
private class OkrDashboardControllerTest {

    @isTest
    static void testOkrDashboardControllerMethods() {
        
        Id currentUserId = UserInfo.getUserId();
        Objective__c testObj = new Objective__c(Name = 'Test Goal', Year__c = '2026', Assigned_User__c = currentUserId);
        insert testObj;

        Key_Result__c testKR = new Key_Result__c(Objective__c = testObj.Id, Target__c = 10, Current__c = 0, Type__c = 'Calls');
        insert testKR;

        Test.startTest();
        
       
        List<Objective__c> activeTree = OkrDashboardController.getOkrTree('2026', currentUserId);
        System.assertEquals(1, activeTree.size(), 'Should successfully pull back matching hierarchy.');
        
        
        List<Objective__c> emptyTree = OkrDashboardController.getOkrTree('', null);
        System.assertEquals(0, emptyTree.size(), 'Should exit safely when arguments are missing.');

       
        SObject generatedSurvey = OkrDashboardController.createCustomActivityRecord('Survey__c', 'Q3 Customer Feedback', testKR.Id);
        System.assertNotEquals(null, generatedSurvey.Id, 'Dynamic creation engine should insert records successfully.');

        
        Objective__c generatedObj = OkrDashboardController.createQuickObjective('2026', currentUserId, 'Dynamic Goal');
        System.assertNotEquals(null, generatedObj.Id, 'Quick goal creation layout parameter verified.');

        Test.stopTest();
    }

    @isTest
    static void testCustomActivityRecordException() {
        Id currentUserId = UserInfo.getUserId();
        Boolean exceptionThrown = false;
        
        Test.startTest();
        try {
            
            OkrDashboardController.createCustomActivityRecord('NonExistentObject__c', 'Test Fail', currentUserId);
        } catch (AuraHandledException e) {
            
            exceptionThrown = true;
        }
        Test.stopTest();
        
        System.assertEquals(true, exceptionThrown, 'An AuraHandledException should have been thrown for invalid object type.');
    }

    @isTest
    static void testQuickObjectiveException() {
        Id currentUserId = UserInfo.getUserId();
        Boolean exceptionThrown = false;
        
       
        String invalidLongName = 'A'.repeat(85);

        Test.startTest();
        try {
            
            OkrDashboardController.createQuickObjective('2026', currentUserId, invalidLongName);
        } catch (AuraHandledException e) {
            
            exceptionThrown = true;
        }
        Test.stopTest();
        
        System.assertEquals(true, exceptionThrown, 'An AuraHandledException should have been thrown for an invalid name length.');
    }
    
        @isTest
    static void testGetActiveUsers() {
        Test.startTest();
        List<User> userList = OkrDashboardController.getActiveUsers();
        System.assert(userList.size() > 0, 'Active user collection query verified.');
        Test.stopTest();
    }

}