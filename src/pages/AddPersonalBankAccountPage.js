import _ from 'underscore';
import React, {useCallback, useEffect, useState} from 'react';
import {withOnyx} from 'react-native-onyx';
import lodashGet from 'lodash/get';
import PropTypes from 'prop-types';
import HeaderWithBackButton from '../components/HeaderWithBackButton';
import ScreenWrapper from '../components/ScreenWrapper';
import Navigation from '../libs/Navigation/Navigation';
import * as BankAccounts from '../libs/actions/BankAccounts';
import AddPlaidBankAccount from '../components/AddPlaidBankAccount';
import getPlaidOAuthReceivedRedirectURI from '../libs/getPlaidOAuthReceivedRedirectURI';
import ONYXKEYS from '../ONYXKEYS';
import styles from '../styles/styles';
import Form from '../components/Form';
import ROUTES from '../ROUTES';
import * as PlaidDataProps from './ReimbursementAccount/plaidDataPropTypes';
import ConfirmationPage from '../components/ConfirmationPage';
import * as PaymentMethods from '../libs/actions/PaymentMethods';
import useLocalize from '../hooks/useLocalize';

const propTypes = {
    /** Contains plaid data */
    plaidData: PlaidDataProps.plaidDataPropTypes,

    /** The details about the Personal bank account we are adding saved in Onyx */
    personalBankAccount: PropTypes.shape({
        /** An error message to display to the user */
        error: PropTypes.string,

        /** Whether we should show the view that the bank account was successfully added */
        shouldShowSuccess: PropTypes.bool,

        /** Any reportID we should redirect to at the end of the flow */
        exitReportID: PropTypes.string,

        /** Whether we should continue with KYC at the end of the flow  */
        shouldContinueKYCOnSuccess: PropTypes.bool,

        /** Whether the form is loading */
        isLoading: PropTypes.bool,

        /** The account ID of the selected bank account from Plaid */
        plaidAccountID: PropTypes.string,
    }),
};

const defaultProps = {
    plaidData: PlaidDataProps.plaidDataDefaultProps,
    personalBankAccount: {
        error: '',
        shouldShowSuccess: false,
        isLoading: false,
        plaidAccountID: '',
        exitReportID: '',
        shouldContinueKYCOnSuccess: false,
    },
};

function AddPersonalBankAccountPage({personalBankAccount, plaidData}) {
    const {translate} = useLocalize();
    const [selectedPlaidAccountId, setSelectedPlaidAccountId] = useState('');
    const shouldShowSuccess = lodashGet(personalBankAccount, 'shouldShowSuccess', false);

    /**
     * @returns {Object}
     */
    const validateBankAccountForm = () => ({});

    const submitBankAccountForm = useCallback(() => {
        const selectedPlaidBankAccount = _.findWhere(lodashGet(plaidData, 'bankAccounts', []), {
            plaidAccountID: selectedPlaidAccountId,
        });

        BankAccounts.addPersonalBankAccount(selectedPlaidBankAccount);
    }, [plaidData, selectedPlaidAccountId]);

    const exitFlow = useCallback(
        (shouldContinue = false) => {
            const exitReportID = lodashGet(personalBankAccount, 'exitReportID');
            const onSuccessFallbackRoute = lodashGet(personalBankAccount, 'onSuccessFallbackRoute', '');

            if (exitReportID) {
                Navigation.dismissModal(exitReportID);
            } else if (shouldContinue && onSuccessFallbackRoute) {
                PaymentMethods.continueSetup(onSuccessFallbackRoute);
            } else {
                Navigation.goBack(ROUTES.SETTINGS_WALLET);
            }
        },
        [personalBankAccount],
    );

    useEffect(() => BankAccounts.clearPersonalBankAccount, []);

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={shouldShowSuccess}
            shouldEnablePickerAvoiding={false}
            shouldShowOfflineIndicator={false}
            testID={AddPersonalBankAccountPage.displayName}
        >
            <HeaderWithBackButton
                title={translate('bankAccount.addBankAccount')}
                onBackButtonPress={exitFlow}
            />
            {shouldShowSuccess ? (
                <ConfirmationPage
                    heading={translate('addPersonalBankAccountPage.successTitle')}
                    description={translate('addPersonalBankAccountPage.successMessage')}
                    shouldShowButton
                    buttonText={translate('common.continue')}
                    onButtonPress={() => exitFlow(true)}
                />
            ) : (
                <Form
                    formID={ONYXKEYS.PERSONAL_BANK_ACCOUNT}
                    isSubmitButtonVisible={Boolean(selectedPlaidAccountId)}
                    submitButtonText={translate('common.saveAndContinue')}
                    scrollContextEnabled
                    onSubmit={submitBankAccountForm}
                    validate={validateBankAccountForm}
                    style={[styles.mh5, styles.flex1]}
                >
                    <AddPlaidBankAccount
                        onSelect={setSelectedPlaidAccountId}
                        plaidData={plaidData}
                        onExitPlaid={() => Navigation.goBack(ROUTES.HOME)}
                        receivedRedirectURI={getPlaidOAuthReceivedRedirectURI()}
                        selectedPlaidAccountID={selectedPlaidAccountId}
                    />
                </Form>
            )}
        </ScreenWrapper>
    );
}
AddPersonalBankAccountPage.displayName = 'AddPersonalBankAccountPage';
AddPersonalBankAccountPage.propTypes = propTypes;
AddPersonalBankAccountPage.defaultProps = defaultProps;

export default withOnyx({
    personalBankAccount: {
        key: ONYXKEYS.PERSONAL_BANK_ACCOUNT,
    },
    plaidData: {
        key: ONYXKEYS.PLAID_DATA,
    },
})(AddPersonalBankAccountPage);
