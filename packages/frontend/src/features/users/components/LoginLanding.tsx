import { useCallback, useEffect, useMemo, useState, type FC } from 'react';

import {
    getEmailSchema,
    isOpenIdIdentityIssuerType,
    LightdashMode,
    LocalIssuerTypes,
    SEED_ORG_1_ADMIN_EMAIL,
    SEED_ORG_1_ADMIN_PASSWORD,
} from '@lightdash/common';

import {
    ActionIcon,
    Anchor,
    Button,
    Card,
    Divider,
    Image,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { z } from 'zod';

import MantineIcon from '../../../components/common/MantineIcon';
import { ThirdPartySignInButton } from '../../../components/common/ThirdPartySignInButton';
import PageSpinner from '../../../components/PageSpinner';
import useToaster from '../../../hooks/toaster/useToaster';
import { useFlashMessages } from '../../../hooks/useFlashMessages';
import useApp from '../../../providers/App/useApp';
import useTracking from '../../../providers/Tracking/useTracking';
import LightdashLogo from '../../../svgs/lightdash-black.svg';
import {
    useFetchLoginOptions,
    useLoginWithEmailMutation,
    type LoginParams,
} from '../hooks/useLogin';

const Login: FC<{}> = () => {
    const { health } = useApp();

    const { identify } = useTracking();
    const location = useLocation();
    const { t } = useTranslation();

    const { showToastError, showToastApiError } = useToaster();
    const flashMessages = useFlashMessages();
    useEffect(() => {
        if (flashMessages.data?.error) {
            showToastError({
                title: t('features_users.user_no_auth_tip'),
                subtitle: flashMessages.data.error.join('\n'),
            });
        }
    }, [flashMessages.data, showToastError, t]);

    const [preCheckEmail, setPreCheckEmail] = useState<string>();

    const oidcOptions = health.data?.auth.oidc;

    if (
        oidcOptions &&
        oidcOptions.enabled &&
        oidcOptions.forceRedirect &&
        !health.data?.isAuthenticated
    ) {
        window.location.href = `/api/v1${oidcOptions.loginPath}`;
    }

    const redirectUrl = location.state?.from
        ? `${location.state.from.pathname}${location.state.from.search}`
        : '/';

    const form = useForm<LoginParams>({
        initialValues: {
            email: '',
            password: '',
        },
        validate: zodResolver(
            z.object({
                email: getEmailSchema(),
            }),
        ),
    });

    const {
        data: loginOptions,
        isInitialLoading: isInitialLoadingLoginOptions,
        isLoading: loginOptionsLoading,
        isSuccess: loginOptionsSuccess,
    } = useFetchLoginOptions({
        email: preCheckEmail,
    });

    // Disable fetch once it has succeeded
    useEffect(() => {
        if (loginOptions && loginOptionsSuccess) {
            if (loginOptions.forceRedirect && loginOptions.redirectUri) {
                window.location.href = loginOptions.redirectUri;
            }
        }
    }, [loginOptionsSuccess, loginOptions]);

    const { mutate, isLoading, isSuccess, isIdle } = useLoginWithEmailMutation({
        onSuccess: (data) => {
            identify({ id: data.userUuid });
            window.location.href = redirectUrl;
        },
        onError: ({ error }) => {
            showToastApiError({
                title: t('features_users.user_no_login_tip'),
                apiError: error,
            });
        },
    });

    // Skip login for demo app
    const isDemo = health.data?.mode === LightdashMode.DEMO;
    useEffect(() => {
        if (isDemo && isIdle) {
            mutate({
                email: SEED_ORG_1_ADMIN_EMAIL.email,
                password: SEED_ORG_1_ADMIN_PASSWORD.password,
            });
        }
    }, [isDemo, mutate, isIdle]);

    const formStage = preCheckEmail ? 'login' : 'precheck';

    const isEmailLoginAvailable =
        loginOptions?.showOptions &&
        loginOptions?.showOptions.includes(LocalIssuerTypes.EMAIL);

    const handleFormSubmit = useCallback(() => {
        if (formStage === 'precheck' && form.values.email !== '') {
            setPreCheckEmail(form.values.email);
        } else if (
            formStage === 'login' &&
            isEmailLoginAvailable &&
            form.values.email !== '' &&
            form.values.password !== ''
        ) {
            mutate(form.values);
        }
    }, [form.values, formStage, isEmailLoginAvailable, mutate]);

    const disableControls =
        loginOptionsLoading ||
        (loginOptionsSuccess && loginOptions.forceRedirect === true) ||
        isLoading ||
        isSuccess;

    const ssoOptions = useMemo(() => {
        if (!loginOptions) {
            return [];
        }
        return loginOptions.showOptions.filter(isOpenIdIdentityIssuerType);
    }, [loginOptions]);

    if (health.isInitialLoading || isDemo || isInitialLoadingLoginOptions) {
        return <PageSpinner />;
    }
    if (health.status === 'success' && health.data?.requiresOrgRegistration) {
        return (
            <Navigate
                to={{
                    pathname: '/register',
                }}
                state={{ from: location.state?.from }}
            />
        );
    }
    if (health.status === 'success' && health.data?.isAuthenticated) {
        return <Navigate to={redirectUrl} />;
    }

    return (
        <>
            <Image
                src={LightdashLogo}
                alt="lightdash logo"
                width={130}
                mx="auto"
                my="lg"
            />
            <Card p="xl" radius="xs" withBorder shadow="xs">
                <Title order={3} ta="center" mb="md">
                    {t('features_users.title')}
                </Title>
                <form
                    name="login"
                    onSubmit={form.onSubmit(() => handleFormSubmit())}
                >
                    <Stack spacing="lg">
                        <TextInput
                            label={t('features_users.form.email.label')}
                            name="email"
                            placeholder={t(
                                'features_users.form.email.placeholder',
                            )}
                            required
                            {...form.getInputProps('email')}
                            disabled={disableControls}
                            rightSection={
                                preCheckEmail ? (
                                    <ActionIcon
                                        onClick={() => {
                                            setPreCheckEmail(undefined);
                                            form.setValues({
                                                email: '',
                                                password: '',
                                            });
                                        }}
                                    >
                                        <MantineIcon icon={IconX} />
                                    </ActionIcon>
                                ) : null
                            }
                        />
                        {isEmailLoginAvailable && formStage === 'login' && (
                            <>
                                <PasswordInput
                                    label={t(
                                        'features_users.form.password.placeholder',
                                    )}
                                    name="password"
                                    placeholder={t(
                                        'features_users.form.password.placeholder',
                                    )}
                                    required
                                    autoFocus
                                    {...form.getInputProps('password')}
                                    disabled={disableControls}
                                />
                                <Anchor href="/recover-password" mx="auto">
                                    {t('features_users.form.password.recover')}
                                </Anchor>
                                <Button
                                    type="submit"
                                    loading={disableControls}
                                    data-cy="signin-button"
                                >
                                    {t('features_users.form.btn.sign_in')}
                                </Button>
                            </>
                        )}
                        {formStage === 'precheck' && (
                            <Button
                                type="submit"
                                loading={disableControls}
                                data-cy="signin-button"
                            >
                                {t('features_users.form.btn.continue')}
                            </Button>
                        )}
                        {ssoOptions.length > 0 && (
                            <>
                                {(isEmailLoginAvailable ||
                                    formStage === 'precheck') && (
                                    <Divider
                                        my="sm"
                                        labelPosition="center"
                                        label={
                                            <Text
                                                color="gray.5"
                                                size="sm"
                                                fw={500}
                                            >
                                                {t(
                                                    'features_users.form.btn.or',
                                                )}
                                            </Text>
                                        }
                                    />
                                )}
                                <Stack>
                                    {ssoOptions.map((providerName) => (
                                        <ThirdPartySignInButton
                                            key={providerName}
                                            providerName={providerName}
                                            redirect={redirectUrl}
                                            disabled={disableControls}
                                        />
                                    ))}
                                </Stack>
                            </>
                        )}
                        <Text mx="auto" mt="md">
                            {t('features_users.form.btn.no_account')}{' '}
                            <Anchor href="/register">
                                {t('features_users.form.btn.sign_up')}
                            </Anchor>
                        </Text>
                    </Stack>
                </form>
            </Card>
        </>
    );
};

export default Login;
