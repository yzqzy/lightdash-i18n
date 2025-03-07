import { subject } from '@casl/ability';
import {
    LightdashMode,
    ResourceViewItemType,
    spaceToResourceViewItem,
    wrapResourceView,
} from '@lightdash/common';
import { Button, Group, Stack } from '@mantine/core';
import { IconFolderPlus, IconFolders, IconPlus } from '@tabler/icons-react';
import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import LoadingState from '../components/common/LoadingState';
import Page from '../components/common/Page/Page';
import PageBreadcrumbs from '../components/common/PageBreadcrumbs';
import ResourceView from '../components/common/ResourceView';
import { ResourceViewType } from '../components/common/ResourceView/types';
import SpaceActionModal from '../components/common/SpaceActionModal';
import { ActionType } from '../components/common/SpaceActionModal/types';
import ForbiddenPanel from '../components/ForbiddenPanel';
import { useProject } from '../hooks/useProject';
import { useSpaceSummaries } from '../hooks/useSpaces';
import useApp from '../providers/App/useApp';
import { PinnedItemsProvider } from '../providers/PinnedItems/PinnedItemsProvider';

const Spaces: FC = () => {
    const { t } = useTranslation();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
    const { data: spaces = [], isInitialLoading: spaceIsLoading } =
        useSpaceSummaries(projectUuid, true);
    const project = useProject(projectUuid);
    const isLoading = spaceIsLoading || project.isInitialLoading;

    const { user, health } = useApp();

    const userCanManageProject = user.data?.ability?.can(
        'manage',
        subject('Project', {
            organizationUuid: user.data?.organizationUuid,
            projectUuid: projectUuid,
        }),
    );

    const hasSpaces = spaces.length > 0;
    const isDemo = health.data?.mode === LightdashMode.DEMO;
    const userCannotViewSpace = user.data?.ability?.cannot(
        'view',
        subject('Space', {
            organizationUuid: user.data?.organizationUuid,
            projectUuid,
            isPrivate: false,
        }),
    );
    const userCanManageSpace = user.data?.ability?.can(
        'create',
        subject('Space', {
            organizationUuid: user.data?.organizationUuid,
            projectUuid,
        }),
    );

    const handleCreateSpace = () => {
        setIsCreateModalOpen(true);
    };

    if (userCannotViewSpace) {
        return <ForbiddenPanel />;
    }

    if (isLoading && !userCannotViewSpace) {
        return <LoadingState title={t('pages_spaces.loading_spaces')} />;
    }

    return (
        <Page title="Spaces" withFixedContent withPaddedContent>
            <Stack spacing="xl">
                <Group position="apart">
                    <PageBreadcrumbs
                        items={[
                            {
                                to: '/home',
                                title: t('pages_spaces.groups.home'),
                            },
                            {
                                title: t('pages_spaces.groups.all_spaces'),
                                active: true,
                            },
                        ]}
                    />

                    {!isDemo && userCanManageSpace && hasSpaces && (
                        <Button
                            leftIcon={<IconPlus size={18} />}
                            onClick={handleCreateSpace}
                        >
                            {t('pages_spaces.groups.create_space')}
                        </Button>
                    )}
                </Group>

                <PinnedItemsProvider
                    projectUuid={projectUuid!}
                    organizationUuid={user.data?.organizationUuid ?? ''}
                    pinnedListUuid={project.data?.pinnedListUuid ?? ''}
                >
                    <ResourceView
                        view={ResourceViewType.GRID}
                        items={wrapResourceView(
                            spaces.map(spaceToResourceViewItem),
                            ResourceViewItemType.SPACE,
                        )}
                        tabs={
                            userCanManageProject
                                ? [
                                      {
                                          id: 'shared',
                                          name: t(
                                              'pages_spaces.tabs.shared_with_me',
                                          ),
                                          filter: (item) =>
                                              item.type ===
                                                  ResourceViewItemType.SPACE &&
                                              (!item.data.isPrivate ||
                                                  (!!user.data &&
                                                      item.data.access.includes(
                                                          user.data.userUuid,
                                                      ))),
                                      },
                                      {
                                          id: 'all',
                                          name: t(
                                              'pages_spaces.tabs.admin_content_view',
                                          ),
                                          infoTooltipText: t(
                                              'pages_spaces.tabs.view_all_spaces',
                                          ),
                                      },
                                  ]
                                : []
                        }
                        headerProps={
                            !userCanManageProject
                                ? {
                                      title: t('pages_spaces.tabs.spaces'),
                                  }
                                : undefined
                        }
                        emptyStateProps={{
                            icon: <IconFolders size={30} />,
                            title: t('pages_spaces.tabs.no_spaces'),
                            action:
                                !isDemo && userCanManageSpace ? (
                                    <Button onClick={handleCreateSpace}>
                                        {t('pages_spaces.tabs.create_space')}
                                    </Button>
                                ) : undefined,
                        }}
                    />
                </PinnedItemsProvider>
            </Stack>

            {isCreateModalOpen && (
                <SpaceActionModal
                    projectUuid={projectUuid!}
                    actionType={ActionType.CREATE}
                    title={t('pages_spaces.create_new_space')}
                    confirmButtonLabel={t('pages_spaces.create')}
                    icon={IconFolderPlus}
                    onClose={() => setIsCreateModalOpen(false)}
                />
            )}
        </Page>
    );
};

export default Spaces;
