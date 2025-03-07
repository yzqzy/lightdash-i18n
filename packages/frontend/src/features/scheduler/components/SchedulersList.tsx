import {
    SchedulerFormat,
    type ApiError,
    type SchedulerAndTargets,
} from '@lightdash/common';
import { Loader, Stack, Text, Title } from '@mantine/core';
import { type UseQueryResult } from '@tanstack/react-query';
import React, { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import ErrorState from '../../../components/common/ErrorState';
import { SchedulerDeleteModal } from './SchedulerDeleteModal';
import SchedulersListItem from './SchedulersListItem';

type Props = {
    schedulersQuery: UseQueryResult<SchedulerAndTargets[], ApiError>;
    isThresholdAlertList?: boolean;
    onEdit: (schedulerUuid: string) => void;
};

const SchedulersList: FC<Props> = ({
    schedulersQuery,
    onEdit,
    isThresholdAlertList,
}) => {
    const { t } = useTranslation();
    const { data: schedulers, isInitialLoading, error } = schedulersQuery;
    const [schedulerUuid, setSchedulerUuid] = useState<string>();

    const { deliverySchedulers, alertSchedulers } = (schedulers || []).reduce<{
        deliverySchedulers: SchedulerAndTargets[];
        alertSchedulers: SchedulerAndTargets[];
    }>(
        (acc, scheduler) => {
            if (scheduler.thresholds && scheduler.thresholds.length > 0) {
                acc.alertSchedulers.push(scheduler);
            } else {
                acc.deliverySchedulers.push(scheduler);
            }
            return acc;
        },
        { deliverySchedulers: [], alertSchedulers: [] },
    );

    if (isInitialLoading) {
        return (
            <Stack h={300} w="100%" align="center">
                <Text fw={600}>
                    {t('features_scheduler_list.loading_schedulers')}
                </Text>
                <Loader size="lg" />
            </Stack>
        );
    }
    if (error) {
        return <ErrorState error={error.error} />;
    }
    if (
        (!isThresholdAlertList && deliverySchedulers.length <= 0) ||
        (isThresholdAlertList && alertSchedulers.length <= 0)
    ) {
        return (
            <Stack color="gray" align="center" mt="xxl">
                <Title order={4} color="gray.6">
                    {`${t('features_scheduler_list.no_schedulers.part_1')} ${
                        isThresholdAlertList
                            ? t('features_scheduler_list.no_schedulers.part_2')
                            : t('features_scheduler_list.no_schedulers.part_3')
                    }`}
                </Title>
                <Text color="gray.6">
                    {t('features_scheduler_list.no_schedulers.part_4')}
                </Text>
            </Stack>
        );
    }
    return (
        <div>
            {isThresholdAlertList
                ? alertSchedulers?.map((alertScheduler) => (
                      <SchedulersListItem
                          key={alertScheduler.schedulerUuid}
                          scheduler={alertScheduler}
                          onEdit={onEdit}
                          onDelete={setSchedulerUuid}
                      />
                  ))
                : deliverySchedulers.map(
                      (scheduler) =>
                          scheduler.format !== SchedulerFormat.GSHEETS && (
                              <SchedulersListItem
                                  key={scheduler.schedulerUuid}
                                  scheduler={scheduler}
                                  onEdit={onEdit}
                                  onDelete={setSchedulerUuid}
                              />
                          ),
                  )}

            {schedulerUuid && (
                <SchedulerDeleteModal
                    opened={true}
                    schedulerUuid={schedulerUuid}
                    onConfirm={() => setSchedulerUuid(undefined)}
                    onClose={() => setSchedulerUuid(undefined)}
                />
            )}
        </div>
    );
};

export default SchedulersList;
