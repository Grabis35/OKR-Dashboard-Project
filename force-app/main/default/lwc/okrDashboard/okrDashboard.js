import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import Id from '@salesforce/user/Id';
import { createRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from 'lightning/pageReferenceUtils';

// Import our Apex controller endpoints
import getOkrTree from '@salesforce/apex/OkrDashboardController.getOkrTree';
import createCustomActivityRecord from '@salesforce/apex/OkrDashboardController.createCustomActivityRecord';
import createQuickObjective from '@salesforce/apex/OkrDashboardController.createQuickObjective';
import getActiveUsers from '@salesforce/apex/OkrDashboardController.getActiveUsers';
import getActiveYears from '@salesforce/apex/OkrDashboardController.getActiveYears';

export default class OkrDashboard extends NavigationMixin(LightningElement) { 
    currentUserId = Id;
    
    @track selectedYear = String(new Date().getFullYear()); 
    @track selectedUserId = Id; 
    @track okrData = [];
    @track userOptions = []; 
    @track yearOptions = []; 
    @track error;
    
    @track isActivityModalOpen = false;
    @track isObjectiveModalOpen = false;
    @track isKeyResultModalOpen = false;
    @track isGlobalKeyResultAction = false; 
    @track isGlobalActivityAction = false;
    @track isDropdownDisabled = false; 
    
    activeKeyResultId;
    activeObjectiveId; 
    selectedActivityType = 'Survey__c';
    activityRecordName = '';
    newObjectiveName = '';
    
    newKeyResultName = '';
    newKeyResultTarget = 10;
    newKeyResultType = 'Calls';

    wiredOkrResult;
    wiredYearsResult; 

    get activityTypeOptions() {
        return [
            { label: 'Survey', value: 'Survey__c' },
            { label: 'Review', value: 'Review__c' },
            { label: 'Google Review', value: 'Google_Review__c' },
            { label: 'Case Study', value: 'Case_Study__c' }
        ];
    }

    get krTypeOptions() {
        return [
            { label: 'Calls', value: 'Calls' },
            { label: 'Events', value: 'Events' },
            { label: 'Opportunities', value: 'Opportunities' },
            { label: 'Contracts', value: 'Contracts' },
            { label: 'Leads', value: 'Leads' },
            { label: 'Surveys', value: 'Surveys' },
            { label: 'Reviews', value: 'Reviews' },
            { label: 'Google Reviews', value: 'Google Reviews' },
            { label: 'Case Studies', value: 'Case Studies' }
        ];
    }

    get objectiveOptions() {
        return this.okrData.map(obj => ({ label: obj.Name, value: obj.Id }));
    }

    get targetMappingType() {
        if (this.selectedActivityType === 'Survey__c') return 'Surveys';
        if (this.selectedActivityType === 'Review__c') return 'Reviews';
        if (this.selectedActivityType === 'Google_Review__c') return 'Google Reviews';
        if (this.selectedActivityType === 'Case_Study__c') return 'Case Studies';
        return '';
    }

    get availableEligibleKeyResults() {
        let choices = [];
        const requiredType = this.targetMappingType;

        this.okrData.forEach(obj => {
            if (obj.Key_Results__r) {
                obj.Key_Results__r.forEach(kr => {
                    if (!kr.isCompleted && kr.Type__c === requiredType) {
                        choices.push({
                            label: `${obj.Name} ➡️ ${kr.Name} (${kr.Current__c}/${kr.Target__c})`,
                            value: kr.Id
                        });
                    }
                });
            }
        });
        return choices;
    }

    @wire(getActiveYears)
    wiredYears(result) {
        this.wiredYearsResult = result;
        const { error, data } = result;
        if (data) {
            this.yearOptions = data.map(yr => ({ label: yr, value: yr }));
        } else if (error) {
            this.showToast('Error Loading Years', error.body.message, 'error');
        }
    }

    @wire(getActiveUsers)
    wiredUsers({ error, data }) {
        if (data) {
            this.userOptions = data.map(user => ({ label: user.Name, value: user.Id }));
        } else if (error) {
            this.showToast('Error Loading Users', error.body.message, 'error');
        }
    }

    @wire(getOkrTree, { selectedYear: '$selectedYear', selectedUserId: '$selectedUserId' })
    wiredOkrs(result) {
        this.wiredOkrResult = result;
        const { error, data } = result;
        if (data) {
            this.okrData = data.map(obj => ({
                ...obj,
                Key_Results__r: obj.Key_Results__r ? obj.Key_Results__r.map(kr => ({
                    ...kr,
                    progressPercentage: kr.Target__c > 0 ? Math.min(Math.round((kr.Current__c / kr.Target__c) * 100), 100) : 0,
                    isCompleted: kr.Current__c >= kr.Target__c 
                })) : []
            }));
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.okrData = [];
        }
    }

    handleYearChange(event) {
        this.selectedYear = event.detail.value;
    }

    handleUserChange(event) {
        this.selectedUserId = event.detail.value;
    }

    handleMenuSelect(event) {
        const selectedAction = event.detail.value;
        if (selectedAction === 'new_objective') {
            this.openObjectiveModal();
        } else if (selectedAction === 'new_key_result') {
            if (this.okrData && this.okrData.length > 0) {
                this.isGlobalKeyResultAction = true; 
                this.activeObjectiveId = this.okrData.Id; 
                this.isKeyResultModalOpen = true;
            } else {
                this.showToast('Warning', 'Please initialize at least one Objective first.', 'warning');
            }
        } else if (selectedAction.startsWith('new_activity_')) {
            this.selectedActivityType = selectedAction.replace('new_activity_', '') + '__c';
            const eligibleKrs = this.availableEligibleKeyResults;
            if (eligibleKrs.length > 0) {
                this.isGlobalActivityAction = true;
                this.isDropdownDisabled = true; 
                this.activeKeyResultId = eligibleKrs.value; 
                this.isActivityModalOpen = true;
            } else {
                this.showToast('Validation Check', `No open Key Results found that track ${this.targetMappingType}.`, 'info');
            }
        }
    }

    openKeyResultModalFromCard(event) {
        this.isGlobalKeyResultAction = false; 
        this.activeObjectiveId = event.target.dataset.id; 
        this.isKeyResultModalOpen = true;
    }

    
    openActivityModalFromCard(event) {
        const krId = event.target.dataset.id;
        const krType = event.target.dataset.type; 

        
        let standardObjectApiName = '';
        if (krType === 'Calls') standardObjectApiName = 'Task';
        if (krType === 'Events') standardObjectApiName = 'Event';
        if (krType === 'Opportunities') standardObjectApiName = 'Opportunity';
        if (krType === 'Contracts') standardObjectApiName = 'Contract';
        if (krType === 'Leads') standardObjectApiName = 'Lead';

        if (standardObjectApiName !== '') {
            
            const defaultValues = encodeDefaultFieldValues({
                Key_Result__c: krId,
                TaskSubtype: krType === 'Calls' ? 'Call' : '',
                LeadSource: krType === 'Leads' ? 'Web' : ''
            });

            this[NavigationMixin.Navigate]({
                type: 'standard__objectPage',
                attributes: {
                    objectApiName: standardObjectApiName,
                    actionName: 'new'
                },
                state: {
                    defaultFieldValues: defaultValues
                }
            });
        } else {
            
            this.isGlobalActivityAction = false;
            this.isDropdownDisabled = true;
            this.activeKeyResultId = krId;
            if (krType === 'Surveys') this.selectedActivityType = 'Survey__c';
            if (krType === 'Reviews') this.selectedActivityType = 'Review__c';
            if (krType === 'Google Reviews') this.selectedActivityType = 'Google_Review__c';
            if (krType === 'Case Studies') this.selectedActivityType = 'Case_Study__c';
            this.isActivityModalOpen = true;
        }
    }

    handleFormInputChange(event) {
        const field = event.target.dataset.id;
        if (field === 'activityName') this.activityRecordName = event.target.value;
        if (field === 'activityType') this.selectedActivityType = event.target.value;
        if (field === 'objectiveName') this.newObjectiveName = event.target.value;
        if (field === 'krName') this.newKeyResultName = event.target.value;
        if (field === 'krTarget') this.newKeyResultTarget = event.target.value;
        if (field === 'krType') this.newKeyResultType = event.target.value;
        if (field === 'krParentObj') this.activeObjectiveId = event.target.value;
        if (field === 'activityTargetKr') this.activeKeyResultId = event.target.value;
    }

    closeModals() {
        this.isActivityModalOpen = false;
        this.isObjectiveModalOpen = false;
        this.isKeyResultModalOpen = false;
        this.activityRecordName = '';
        this.newObjectiveName = '';
        this.newKeyResultName = '';
        this.newKeyResultTarget = 10;
        this.isDropdownDisabled = false;
    }

    openObjectiveModal() {
        this.isObjectiveModalOpen = true;
    }

        handleSaveKeyResult() {
        if (!this.newKeyResultName || !this.activeObjectiveId) return;

        const fields = {};
        fields['Name'] = this.newKeyResultName;
        fields['Objective__c'] = this.activeObjectiveId;
        fields['Target__c'] = this.newKeyResultTarget;
        fields['Current__c'] = 0;
        fields['Type__c'] = this.newKeyResultType;

        const recordInput = { apiName: 'Key_Result__c', fields };

        createRecord(recordInput)
            .then(() => {
                this.showToast('Success', 'Key Result added successfully.', 'success');
                this.closeModals();
                return refreshApex(this.wiredOkrResult);
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    handleSaveActivity() {
        if (!this.activityRecordName || !this.activeKeyResultId) return;

        createCustomActivityRecord({
            objectApiName: this.selectedActivityType,
            recordName: this.activityRecordName,
            keyResultId: this.activeKeyResultId
        })
            .then(() => {
                this.showToast('Success', 'Activity record logged successfully.', 'success');
                this.closeModals();
                return refreshApex(this.wiredOkrResult);
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    handleSaveObjective() {
        if (!this.newObjectiveName) return;

        createQuickObjective({
            year: this.selectedYear,
            userId: this.selectedUserId,
            name: this.newObjectiveName
        })
            .then(() => {
                this.showToast('Success', 'Objective initialized successfully.', 'success');
                this.closeModals();
                refreshApex(this.wiredYearsResult);
                return refreshApex(this.wiredOkrResult);
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}