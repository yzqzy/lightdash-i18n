import { ActionIcon, MantineProvider, Menu, Text, Title } from '@mantine/core';
import { IconCheck, IconDatabaseCog, IconPlus } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { matchRoutes, useLocation } from 'react-router';

import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import { useProjects } from '../../hooks/useProjects';
import {
    useProjectUserWarehouseCredentialsPreference,
    useProjectUserWarehouseCredentialsPreferenceMutation,
} from '../../hooks/userWarehouseCredentials/useProjectUserWarehouseCredentialsPreference';
import { useUserWarehouseCredentials } from '../../hooks/userWarehouseCredentials/useUserWarehouseCredentials';
import useApp from '../../providers/App/useApp';
import { getWarehouseLabel } from '../ProjectConnection/ProjectConnectFlow/utils';
import { CreateCredentialsModal } from '../UserSettings/MyWarehouseConnectionsPanel/CreateCredentialsModal';
import MantineIcon from '../common/MantineIcon';

const routesThatNeedWarehouseCredentials = [
    '/projects/:projectUuid/tables/:tableId',
    '/projects/:projectUuid/saved/:savedQueryUuid/:mode?',
    '/projects/:projectUuid/dashboards/:dashboardUuid/:mode?',
    '/projects/:projectUuid/sqlRunner',
];

const UserCredentialsSwitcher = () => {
    const { t } = useTranslation();

    const { user } = useApp();
    const location = useLocation();
    const [showCreateModalOnPageLoad, setShowCreateModalOnPageLoad] =
        useState(false);
    const isRouteThatNeedsWarehouseCredentials = !!matchRoutes(
        routesThatNeedWarehouseCredentials.map((path) => ({ path })),
        location,
    );
    const [isCreatingCredentials, setIsCreatingCredentials] = useState(false);
    const {
        isInitialLoading: isLoadingCredentials,
        data: userWarehouseCredentials,
    } = useUserWarehouseCredentials();
    const { isInitialLoading: isLoadingProjects, data: projects } =
        useProjects();
    const { isLoading: isLoadingActiveProjectUuid, activeProjectUuid } =
        useActiveProjectUuid();
    const { data: preferredCredentials } =
        useProjectUserWarehouseCredentialsPreference(activeProjectUuid);
    const { mutate } = useProjectUserWarehouseCredentialsPreferenceMutation({
        onSuccess: () => {
            if (isRouteThatNeedsWarehouseCredentials) {
                // reload page because we can't invalidate the results mutation
                window.location.reload();
            }
        },
    });

    const activeProject = useMemo(() => {
        return projects?.find((p) => p.projectUuid === activeProjectUuid);
    }, [projects, activeProjectUuid]);

    const compatibleCredentials = useMemo(() => {
        return userWarehouseCredentials?.filter(
            ({ credentials }) =>
                credentials.type === activeProject?.warehouseType,
        );
    }, [userWarehouseCredentials, activeProject]);

    useEffect(() => {
        // reset state when page changes
        setShowCreateModalOnPageLoad(false);
    }, [location.pathname]);

    useEffect(() => {
        // open create modal on page load if there are no compatible credentials
        if (
            isRouteThatNeedsWarehouseCredentials &&
            !showCreateModalOnPageLoad &&
            activeProject?.requireUserCredentials &&
            !!compatibleCredentials &&
            compatibleCredentials.length === 0
        ) {
            setShowCreateModalOnPageLoad(true);
            setIsCreatingCredentials(true);
        }
    }, [
        isRouteThatNeedsWarehouseCredentials,
        showCreateModalOnPageLoad,
        activeProject,
        compatibleCredentials,
    ]);

    if (
        isLoadingCredentials ||
        isLoadingProjects ||
        isLoadingActiveProjectUuid ||
        !activeProjectUuid ||
        !activeProject?.requireUserCredentials
    ) {
        return null;
    }

    return (
        <>
            <Menu
                withArrow
                shadow="lg"
                position="bottom-end"
                arrowOffset={16}
                offset={-2}
            >
                <Menu.Target>
                    <ActionIcon
                        size="sm"
                        style={{
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        <MantineIcon
                            data-testid="tile-icon-more"
                            icon={IconDatabaseCog}
                        />
                    </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                    {(compatibleCredentials || []).map((item) => (
                        <Menu.Item
                            key={item.uuid}
                            icon={<MantineIcon icon={IconDatabaseCog} />}
                            rightSection={
                                preferredCredentials?.uuid === item.uuid ? (
                                    <MantineIcon icon={IconCheck} />
                                ) : undefined
                            }
                            onClick={() => {
                                mutate({
                                    projectUuid: activeProjectUuid,
                                    userWarehouseCredentialsUuid: item.uuid,
                                });
                            }}
                        >
                            {item.name}
                        </Menu.Item>
                    ))}
                    <Menu.Divider />
                    <Menu.Item
                        icon={<MantineIcon icon={IconPlus} />}
                        onClick={() => {
                            setIsCreatingCredentials(true);
                        }}
                    >
                        {t(
                            'components_navbar_user_credentials_switcher.create_new',
                        )}
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
            {isCreatingCredentials && (
                <MantineProvider inherit theme={{ colorScheme: 'light' }}>
                    <CreateCredentialsModal
                        opened={isCreatingCredentials}
                        title={
                            showCreateModalOnPageLoad ? (
                                <Title order={4}>
                                    {t(
                                        'components_navbar_user_credentials_switcher.create.title',
                                    )}{' '}
                                    {getWarehouseLabel(
                                        activeProject.warehouseType,
                                    )}
                                </Title>
                            ) : undefined
                        }
                        description={
                            showCreateModalOnPageLoad ? (
                                <Text>
                                    {t(
                                        'components_navbar_user_credentials_switcher.create.description.part_1',
                                    )}{' '}
                                    “{user.data?.organizationName}”{' '}
                                    {t(
                                        'components_navbar_user_credentials_switcher.create.description.part_2',
                                    )}{' '}
                                    {getWarehouseLabel(
                                        activeProject.warehouseType,
                                    )}{' '}
                                    {t(
                                        'components_navbar_user_credentials_switcher.create.description.part_3',
                                    )}
                                </Text>
                            ) : undefined
                        }
                        nameValue={
                            showCreateModalOnPageLoad ? 'Default' : undefined
                        }
                        warehouseType={activeProject.warehouseType}
                        onSuccess={(data) => {
                            mutate({
                                projectUuid: activeProjectUuid,
                                userWarehouseCredentialsUuid: data.uuid,
                            });
                        }}
                        onClose={() => setIsCreatingCredentials(false)}
                    />
                </MantineProvider>
            )}
        </>
    );
};

export default UserCredentialsSwitcher;
