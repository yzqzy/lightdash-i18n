import {
    type ApiError,
    type PinnedItems,
    type UpdatePinnedItemOrder,
} from '@lightdash/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { lightdashApi } from '../../api';
import useToaster from '../toaster/useToaster';

const getPinnedItems = async (projectUuid: string, pinnedlistUuid: string) =>
    lightdashApi<PinnedItems>({
        url: `/projects/${projectUuid}/pinned-lists/${pinnedlistUuid}/items`,
        method: 'GET',
        body: undefined,
    });

const updatePinnedItemsOrder = async (
    projectUuid: string,
    pinnedListUuid: string,
    pinnedItemsOrder: UpdatePinnedItemOrder[],
) => {
    return lightdashApi<PinnedItems>({
        url: `/projects/${projectUuid}/pinned-lists/${pinnedListUuid}/items/order`,
        method: 'PATCH',
        body: JSON.stringify(pinnedItemsOrder),
    });
};

export const usePinnedItems = (
    projectUuid: string | undefined,
    pinnedlistUuid: string | undefined,
) =>
    useQuery<PinnedItems, ApiError>({
        queryKey: ['pinned_items', projectUuid, pinnedlistUuid],
        queryFn: () => getPinnedItems(projectUuid!, pinnedlistUuid || ''),
        enabled: !!pinnedlistUuid && !!projectUuid,
    });

export const useReorder = (
    projectUuid: string | undefined,
    pinnedlistUuid: string,
) => {
    const queryClient = useQueryClient();
    const { showToastApiError } = useToaster();
    const { t } = useTranslation();

    return useMutation<PinnedItems, ApiError, PinnedItems>(
        (pinnedItems) => {
            queryClient.setQueryData(
                ['pinned_items', projectUuid, pinnedlistUuid],
                pinnedItems,
            );
            if (!projectUuid) {
                return Promise.reject();
            }
            return updatePinnedItemsOrder(
                projectUuid,
                pinnedlistUuid,
                pinnedItems.map((pinnedItem) => ({
                    type: pinnedItem.type,
                    data: {
                        uuid: pinnedItem.data.uuid,
                        pinnedListOrder: pinnedItem.data.pinnedListOrder,
                    },
                })),
            );
        },
        {
            onSuccess: async () => {
                await queryClient.invalidateQueries([
                    'pinned_items',
                    projectUuid,
                    pinnedlistUuid,
                ]);
            },
            onError: ({ error }) => {
                showToastApiError({
                    title: t('hooks_pinning.toast_pinned_items.error'),
                    apiError: error,
                });
            },
        },
    );
};
