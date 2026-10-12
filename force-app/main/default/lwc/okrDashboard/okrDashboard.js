import { LightningElement, wire, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import Id from '@salesforce/user/Id';
import { createRecord } from 'lightning/uiRecordApi';


import getOkrTree from '@salesforce/apex/OkrDashboardController.getOkrTree';
import createCustomActivityRecord from '@salesforce/apex/OkrDashboardController.createCustomActivityRecord';
import createQuickObjective from '@salesforce/apex/OkrDashboardController.createQuickObjective';
import getActiveUsers from '@salesforce/apex/OkrDashboardController.getActiveUsers';

export default class OkrDashboard extends LightningElement {
    currentUserId = Id;
    
    @track selectedYear = '2025';
    @track selectedUserId = Id; 
    @track okrData = [];
    @track userOptions = []; 
    @track error;
    
    
    @track isActivityModalOpen = false;
    @track isObjectiveModalOpen = false;
    @track isKeyResultModalOpen = false;
    
    
    activeKeyResultId;
    activeObjectiveId; 
    selectedActivityType = 'Survey__c';
    activityRecordName = '';
    newObjectiveName = '';
    
    
    newKeyResultName = '';
    newKeyResultTarget = 10;
    newKeyResultType = 'Calls';

    wiredOkrResult;

    get yearOptions() {
        return [
            { label: '2025', value: '2025' },
            { label: '2026', value: '2026' },
            { label: '2027', value: '2027' }
        ];
    }

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
                    progressPercentage: kr.Target__c > 0 ? Math.min(Math.round((kr.Current__c / kr.Target__c) * 100), 100) : 0
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
                this.activeObjectiveId = this.okrData[0].Id;
                this.isKeyResultModalOpen = true;
            } else {
                this.showToast('Error', 'Please initialize at least one Objective before mapping a Key Result.', 'warning');
            }
        } else if (selectedAction.startsWith('new_activity_')) {
            this.selectedActivityType = selectedAction.replace('new_activity_', '') + '__c';
            this.isActivityModalOpen = true;
        }
    }

    handleFormInputChange(event) {
        const field = event.target.dataset.id;
        if (field === 'activityName') this.activityRecordName = event.target.value;
        if (field === 'objectiveName') this.newObjectiveName = event.target.value;
        if (field === 'krName') this.newKeyResultName = event.target.value;
        if (field === 'krTarget') this.newKeyResultTarget = event.target.value;
        if (field === 'krType') this.newKeyResultType = event.target.value;
        if (field === 'krParentObj') this.activeObjectiveId = event.target.value;
    }

    openActivityModal(event) {
        this.activeKeyResultId = event.target.dataset.id;
        this.isActivityModalOpen = true;
    }

    closeModals() {
        this.isActivityModalOpen = false;
        this.isObjectiveModalOpen = false;
        this.isKeyResultModalOpen = false;
        this.activityRecordName = '';
        this.newObjectiveName = '';
        this.newKeyResultName = '';
        this.newKeyResultTarget = 10;
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
                this.showToast('Error Creating Key Result', error.body.message, 'error');
            });
    }

    handleSaveActivity() {
        if (!this.activityRecordName) return;

        createCustomActivityRecord({
            objectApiName: this.selectedActivityType,
            recordName: this.activityRecordName,
            keyResultId: this.activeKeyResultId
        })
        .then(() => {
            this.showToast('Success', 'Activity record created successfully.', 'success');
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