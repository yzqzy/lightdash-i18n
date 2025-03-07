import { ExploreType, type SummaryExplore } from '@lightdash/common';
import {
    ActionIcon,
    Divider,
    Skeleton,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconAlertTriangle,
    IconSearch,
    IconX,
} from '@tabler/icons-react';
import Fuse from 'fuse.js';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { useExplores } from '../../../hooks/useExplores';
import useExplorerContext from '../../../providers/Explorer/useExplorerContext';
import { TrackSection } from '../../../providers/Tracking/TrackingProvider';
import { SectionName } from '../../../types/Events';
import MantineIcon from '../../common/MantineIcon';
import PageBreadcrumbs from '../../common/PageBreadcrumbs';
import SuboptimalState from '../../common/SuboptimalState/SuboptimalState';
import ExplorePanel from '../ExplorePanel';
import { ItemDetailProvider } from '../ExploreTree/TableTree/ItemDetailProvider';
import ExploreGroup from './ExploreGroup';
import ExploreNavLink from './ExploreNavLink';

const LoadingSkeleton = () => (
    <Stack>
        <Skeleton h="md" />

        <Skeleton h="xxl" />

        <Stack spacing="xxs">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                <Skeleton key={index} h="xxl" />
            ))}
        </Stack>
    </Stack>
);

const BasePanel = () => {
    const navigate = useNavigate();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const [search, setSearch] = useState<string>('');
    const exploresResult = useExplores(projectUuid, true);
    const { t } = useTranslation();

    const [exploreGroupMap, defaultUngroupedExplores, customUngroupedExplores] =
        useMemo(() => {
            const validSearch = search ? search.toLowerCase() : '';
            if (exploresResult.data) {
                let explores = Object.values(exploresResult.data);
                if (validSearch !== '') {
                    explores = new Fuse(Object.values(exploresResult.data), {
                        keys: ['label'],
                        ignoreLocation: true,
                        threshold: 0.3,
                    })
                        .search(validSearch)
                        .map((res) => res.item);
                }

                return explores.reduce<
                    [
                        Record<string, SummaryExplore[]>,
                        SummaryExplore[],
                        SummaryExplore[],
                    ]
                >(
                    (acc, explore) => {
                        if (explore.groupLabel) {
                            return [
                                {
                                    ...acc[0],
                                    [explore.groupLabel]: acc[0][
                                        explore.groupLabel
                                    ]
                                        ? [
                                              ...acc[0][explore.groupLabel],
                                              explore,
                                          ]
                                        : [explore],
                                },
                                acc[1],
                                acc[2],
                            ];
                        }
                        if (explore.type === ExploreType.VIRTUAL) {
                            return [acc[0], acc[1], [...acc[2], explore]];
                        }
                        return [acc[0], [...acc[1], explore], acc[2]];
                    },
                    [{}, [], []],
                );
            }
            return [{}, [], []];
        }, [exploresResult.data, search]);

    if (exploresResult.status === 'loading') {
        return <LoadingSkeleton />;
    }

    if (exploresResult.status === 'error') {
        return (
            <SuboptimalState
                icon={IconAlertCircle}
                title={t('components_explorer_sider_bar.error')}
            />
        );
    }

    if (exploresResult.data) {
        return (
            <>
                <ItemDetailProvider>
                    <Stack h="100%" sx={{ flexGrow: 1 }}>
                        <PageBreadcrumbs
                            size="md"
                            items={[
                                {
                                    title: t(
                                        'components_explorer_sider_bar.title',
                                    ),
                                    active: true,
                                },
                            ]}
                        />

                        <TextInput
                            icon={<MantineIcon icon={IconSearch} />}
                            rightSection={
                                search ? (
                                    <ActionIcon onClick={() => setSearch('')}>
                                        <MantineIcon icon={IconX} />
                                    </ActionIcon>
                                ) : null
                            }
                            placeholder={t(
                                'components_explorer_sider_bar.search_tables',
                            )}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <Stack
                            spacing="xxs"
                            sx={{ flexGrow: 1, overflowY: 'auto' }}
                        >
                            {Object.keys(exploreGroupMap)
                                .sort((a, b) => a.localeCompare(b))
                                .map((groupLabel) => (
                                    <ExploreGroup
                                        label={groupLabel}
                                        key={groupLabel}
                                    >
                                        {exploreGroupMap[groupLabel]
                                            .sort((a, b) =>
                                                a.label.localeCompare(b.label),
                                            )
                                            .map((explore) => (
                                                <ExploreNavLink
                                                    key={explore.name}
                                                    explore={explore}
                                                    query={search}
                                                    onClick={() => {
                                                        void navigate(
                                                            `/projects/${projectUuid}/tables/${explore.name}`,
                                                        );
                                                    }}
                                                />
                                            ))}
                                    </ExploreGroup>
                                ))}
                            {defaultUngroupedExplores
                                .sort((a, b) => a.label.localeCompare(b.label))
                                .map((explore) => (
                                    <ExploreNavLink
                                        key={explore.name}
                                        explore={explore}
                                        query={search}
                                        onClick={() => {
                                            void navigate(
                                                `/projects/${projectUuid}/tables/${explore.name}`,
                                            );
                                        }}
                                    />
                                ))}

                            {customUngroupedExplores.length ? (
                                <>
                                    <Divider size={0.5} c="gray.5" my="xs" />

                                    <Text fw={500} fz="xs" c="gray.6" mb="xs">
                                        {t(
                                            'components_explorer_sider_bar.virtual_views',
                                        )}
                                    </Text>
                                </>
                            ) : null}

                            {customUngroupedExplores
                                .sort((a, b) => a.label.localeCompare(b.label))
                                .map((explore) => (
                                    <ExploreNavLink
                                        key={explore.name}
                                        explore={explore}
                                        query={search}
                                        onClick={() => {
                                            void navigate(
                                                `/projects/${projectUuid}/tables/${explore.name}`,
                                            );
                                        }}
                                    />
                                ))}
                        </Stack>
                    </Stack>
                </ItemDetailProvider>
            </>
        );
    }

    return (
        <SuboptimalState
            icon={IconAlertTriangle}
            title={t('components_explorer_sider_bar.error')}
        />
    );
};

const ExploreSideBar = memo(() => {
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const tableName = useExplorerContext(
        (context) => context.state.unsavedChartVersion.tableName,
    );

    const clearExplore = useExplorerContext(
        (context) => context.actions.clearExplore,
    );
    const navigate = useNavigate();

    const handleBack = useCallback(() => {
        clearExplore();
        void navigate(`/projects/${projectUuid}/tables`);
    }, [clearExplore, navigate, projectUuid]);

    return (
        <TrackSection name={SectionName.SIDEBAR}>
            {!tableName ? <BasePanel /> : <ExplorePanel onBack={handleBack} />}
        </TrackSection>
    );
});

export default ExploreSideBar;
