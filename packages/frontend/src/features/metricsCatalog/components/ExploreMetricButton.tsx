import { type CatalogField } from '@lightdash/common';
import { Button, Tooltip } from '@mantine/core';
import { type MRT_Row } from 'mantine-react-table';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import useTracking from '../../../providers/Tracking/useTracking';
import { EventName } from '../../../types/Events';
import { useAppDispatch, useAppSelector } from '../../sqlRunner/store/hooks';
import { toggleMetricExploreModal } from '../store/metricsCatalogSlice';

type Props = {
    row: MRT_Row<CatalogField>;
};

export const ExploreMetricButton = ({ row }: Props) => {
    const { t } = useTranslation();

    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const projectUuid = useAppSelector(
        (state) => state.metricsCatalog.projectUuid,
    );
    const organizationUuid = useAppSelector(
        (state) => state.metricsCatalog.organizationUuid,
    );

    const { track } = useTracking();

    const handleExploreClick = useCallback(() => {
        track({
            name: EventName.METRICS_CATALOG_EXPLORE_CLICKED,
            properties: {
                organizationId: organizationUuid,
                projectId: projectUuid,
                metricName: row.original.name,
                tableName: row.original.tableName,
            },
        });

        void navigate({
            pathname: `/projects/${projectUuid}/metrics/peek/${row.original.tableName}/${row.original.name}`,
            search: location.search,
        });

        dispatch(
            toggleMetricExploreModal({
                name: row.original.name,
                tableName: row.original.tableName,
            }),
        );
    }, [
        dispatch,
        location,
        navigate,
        organizationUuid,
        projectUuid,
        row.original.name,
        row.original.tableName,
        track,
    ]);

    return (
        <Tooltip
            withinPortal
            variant="xs"
            label={t('features_metrics_catalog.title')}
        >
            <Button
                compact
                bg="linear-gradient(180deg, #202B37 0%, #151C24 100%)"
                radius="md"
                onClick={handleExploreClick}
                py="xxs"
                px={10}
                h={32}
                fz="sm"
                fw={500}
                sx={{
                    border: `1px solid #414E62`,
                    boxShadow: '0px 0px 0px 1px #151C24',
                }}
            >
                {t('features_metrics_catalog.explore')}
            </Button>
        </Tooltip>
    );
};
