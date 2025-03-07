import { subject } from '@casl/ability';
import {
    ProjectType,
    assertUnreachable,
    type OrganizationProject,
} from '@lightdash/common';
import { Badge, Box, Button, Group, Menu, Text, Tooltip } from '@mantine/core';
import { IconArrowRight, IconPlus } from '@tabler/icons-react';
import { useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { matchRoutes, useLocation, useMatch, useNavigate } from 'react-router';

import useToaster from '../../hooks/toaster/useToaster';
import {
    useActiveProjectUuid,
    useUpdateActiveProjectMutation,
} from '../../hooks/useActiveProject';
import { useIsTruncated } from '../../hooks/useIsTruncated';
import { useProjects } from '../../hooks/useProjects';
import useApp from '../../providers/App/useApp';
import MantineIcon from '../common/MantineIcon';
import { CreatePreviewModal } from './CreatePreviewProjectModal';

const MENU_TEXT_PROPS = {
    c: 'gray.2',
    fz: 'xs',
    fw: 500,
};

const InactiveProjectItem: FC<{
    item: OrganizationProject;
    handleProjectChange: (newUuid: string) => void;
}> = ({ item, handleProjectChange }) => {
    const { t } = useTranslation();
    const { ref: truncatedRef, isTruncated } = useIsTruncated<HTMLDivElement>();

    return (
        <Menu.Item
            key={item.projectUuid}
            onClick={() => handleProjectChange(item.projectUuid)}
        >
            <Group spacing="sm" position="apart" noWrap>
                <Tooltip
                    withinPortal
                    variant="xs"
                    label={item.name}
                    maw={300}
                    disabled={!isTruncated}
                    color="dark"
                    multiline
                >
                    <Text
                        ref={truncatedRef}
                        {...MENU_TEXT_PROPS}
                        truncate
                        maw={350}
                    >
                        {item.name}
                    </Text>
                </Tooltip>

                {item.type === ProjectType.PREVIEW && (
                    <Badge
                        color="yellow.1"
                        variant="light"
                        size="xs"
                        radius="sm"
                        fw={400}
                        sx={{
                            textTransform: 'none',
                        }}
                    >
                        {t('components_navbar_project_switcher.preview')}
                    </Badge>
                )}
            </Group>
        </Menu.Item>
    );
};

const swappableProjectRoutes = (activeProjectUuid: string) => [
    `/projects/${activeProjectUuid}/home`,
    `/projects/${activeProjectUuid}/saved`,
    `/projects/${activeProjectUuid}/dashboards`,
    `/projects/${activeProjectUuid}/spaces`,
    `/projects/${activeProjectUuid}/sqlRunner`,
    `/projects/${activeProjectUuid}/tables`,
    `/projects/${activeProjectUuid}/user-activity`,
    `/projects/${activeProjectUuid}`,
    `/generalSettings`,
    `/generalSettings/password`,
    `/generalSettings/myWarehouseConnections`,
    `/generalSettings/personalAccessTokens`,
    `/generalSettings/scimAccessTokens`,
    `/generalSettings/organization`,
    `/generalSettings/userManagement`,
    `/generalSettings/appearance`,
    `/generalSettings/projectManagement`,
    `/generalSettings/projectManagement/${activeProjectUuid}/settings`,
    `/generalSettings/projectManagement/${activeProjectUuid}/tablesConfiguration`,
    `/generalSettings/projectManagement/${activeProjectUuid}/projectAccess`,
    `/generalSettings/projectManagement/${activeProjectUuid}/integrations/dbtCloud`,
    `/generalSettings/projectManagement/${activeProjectUuid}/usageAnalytics`,
    `/generalSettings/projectManagement/${activeProjectUuid}/scheduledDeliveries`,
    `/generalSettings/projectManagement/${activeProjectUuid}/validator`,
    `/generalSettings/projectManagement/${activeProjectUuid}`,
];

const ProjectSwitcher = () => {
    const { t } = useTranslation();

    const { showToastSuccess } = useToaster();
    const navigate = useNavigate();

    const { user } = useApp();

    const { isInitialLoading: isLoadingProjects, data: projects } =
        useProjects();
    const { isLoading: isLoadingActiveProjectUuid, activeProjectUuid } =
        useActiveProjectUuid();
    const { mutate: setLastProjectMutation } = useUpdateActiveProjectMutation();
    const location = useLocation();
    const isHomePage = !!useMatch(`/projects/${activeProjectUuid}/home`);

    const routeMatches =
        matchRoutes(
            activeProjectUuid
                ? swappableProjectRoutes(activeProjectUuid).map((path) => ({
                      path,
                  }))
                : [],
            location,
        ) || [];
    const swappableRouteMatch = routeMatches ? routeMatches[0]?.route : null;

    const shouldSwapProjectRoute = !!swappableRouteMatch && activeProjectUuid;

    const handleProjectChange = useCallback(
        (newUuid: string) => {
            if (!newUuid) return;

            const project = projects?.find((p) => p.projectUuid === newUuid);
            if (!project) return;

            setLastProjectMutation(project.projectUuid);

            showToastSuccess({
                title: `${t(
                    'components_navbar_project_switcher.toast_viewing.title',
                )} ${project.name}`,
                action:
                    !isHomePage && shouldSwapProjectRoute
                        ? {
                              children: t(
                                  'components_navbar_project_switcher.toast_viewing.content',
                              ),
                              icon: IconArrowRight,
                              onClick: () => {
                                  void navigate(
                                      `/projects/${project.projectUuid}/home`,
                                  );
                              },
                          }
                        : undefined,
            });

            if (shouldSwapProjectRoute) {
                void navigate(
                    swappableRouteMatch.path.replace(
                        activeProjectUuid,
                        project.projectUuid,
                    ),
                );
            } else {
                void navigate(`/projects/${project.projectUuid}/home`);
            }
        },
        [
            activeProjectUuid,
            navigate,
            isHomePage,
            projects,
            setLastProjectMutation,
            shouldSwapProjectRoute,
            showToastSuccess,
            swappableRouteMatch,
            t,
        ],
    );

    const activeProject = useMemo(() => {
        if (!activeProjectUuid || !projects) return null;
        return projects.find((p) => p.projectUuid === activeProjectUuid);
    }, [activeProjectUuid, projects]);

    // user has permission to create preview project on an organization level
    const orgRoleCanCreatePreviews = useMemo(() => {
        return user.data?.ability.can(
            'create',
            subject('Project', {
                organizationUuid: user.data.organizationUuid,
                type: ProjectType.PREVIEW,
            }),
        );
    }, [user.data]);

    const inactiveProjects = useMemo(() => {
        if (!activeProjectUuid || !projects) return [];
        return projects
            .filter((p) => p.projectUuid !== activeProjectUuid)
            .filter((project) => {
                switch (project.type) {
                    case ProjectType.DEFAULT:
                        return true;
                    case ProjectType.PREVIEW:
                        // check if user has permission to create preview project on an organization level (developer, admin)
                        // or check if user has permission to create preview project on a project level
                        // - they should have permission (developer, admin) to the upstream project
                        return (
                            orgRoleCanCreatePreviews ||
                            user.data?.ability.can(
                                'create',
                                subject('Project', {
                                    upstreamProjectUuid: project.projectUuid,
                                    type: ProjectType.PREVIEW,
                                }),
                            )
                        );
                    default:
                        return assertUnreachable(
                            project.type,
                            `Unknown project type: ${project.type}`,
                        );
                }
            });
    }, [activeProjectUuid, projects, orgRoleCanCreatePreviews, user.data]);

    const userCanCreatePreview = useMemo(() => {
        if (isLoadingProjects || !projects || !user.data) return false;

        return projects
            .filter((p) => p.type === ProjectType.DEFAULT)
            .some((project) =>
                user.data.ability.can(
                    'create',
                    subject('Project', {
                        organizationUuid: user.data.organizationUuid,
                        upstreamProjectUuid: project.projectUuid,
                        type: ProjectType.PREVIEW,
                    }),
                ),
            );
    }, [isLoadingProjects, projects, user.data]);

    const [isCreatePreviewOpen, setIsCreatePreview] = useState(false);

    if (
        isLoadingProjects ||
        isLoadingActiveProjectUuid ||
        !projects ||
        projects.length === 0
    ) {
        return null;
    }

    return (
        <>
            <Menu
                position="bottom-end"
                withArrow
                shadow="lg"
                arrowOffset={16}
                offset={-2}
                styles={{
                    dropdown: {
                        maxHeight: 450,
                        overflow: 'auto',
                    },
                }}
            >
                <Menu.Target>
                    <Button
                        maw={200}
                        variant="default"
                        size="xs"
                        disabled={
                            isLoadingProjects || isLoadingActiveProjectUuid
                        }
                        sx={(theme) => ({
                            '&:disabled': {
                                color: theme.white,
                                backgroundColor: theme.colors.dark[6],
                                borderColor: theme.colors.dark[4],
                            },
                        })}
                    >
                        <Text truncate>
                            {activeProject?.name ??
                                t(
                                    'components_navbar_project_switcher.select_a_project',
                                )}
                        </Text>
                    </Button>
                </Menu.Target>

                <Menu.Dropdown maw={400}>
                    {inactiveProjects.length > 0 && (
                        <Box
                            pos="sticky"
                            top={0}
                            bg="gray.9"
                            sx={(theme) => ({
                                boxShadow: `0 -4px ${theme.colors.gray[9]}`,
                            })}
                        >
                            <Menu.Label py={0}>
                                {t(
                                    'components_navbar_project_switcher.all_projects',
                                )}
                            </Menu.Label>
                            <Menu.Divider />
                        </Box>
                    )}

                    {inactiveProjects.map((item) => (
                        <InactiveProjectItem
                            key={item.projectUuid}
                            item={item}
                            handleProjectChange={handleProjectChange}
                        />
                    ))}

                    {userCanCreatePreview && (
                        <Box
                            pos="sticky"
                            bottom={0}
                            bg="gray.9"
                            sx={(theme) => ({
                                // fixes scroll overlap
                                boxShadow: `0 4px ${theme.colors.gray[9]}`,
                            })}
                        >
                            {inactiveProjects.length > 0 && <Menu.Divider />}

                            <Menu.Item
                                onClick={(
                                    e: React.MouseEvent<HTMLButtonElement>,
                                ) => {
                                    setIsCreatePreview(!isCreatePreviewOpen);
                                    e.stopPropagation();
                                }}
                                icon={<MantineIcon icon={IconPlus} size="md" />}
                            >
                                <Text {...MENU_TEXT_PROPS}>
                                    {t(
                                        'components_navbar_project_switcher.create_preview',
                                    )}
                                </Text>
                            </Menu.Item>
                        </Box>
                    )}
                </Menu.Dropdown>
            </Menu>

            {isCreatePreviewOpen && (
                <CreatePreviewModal
                    isOpened={isCreatePreviewOpen}
                    onClose={() => setIsCreatePreview(false)}
                />
            )}
        </>
    );
};

export default ProjectSwitcher;
