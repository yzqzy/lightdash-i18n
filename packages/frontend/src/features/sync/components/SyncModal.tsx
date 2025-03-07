import { Flex, Modal, Title, type ModalProps } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { GSheetsIcon } from '../../../components/common/GSheetsIcon';
import MantineIcon from '../../../components/common/MantineIcon';
import { getSchedulerUuidFromUrlParams } from '../../../features/scheduler/utils';
import { SyncModalProvider } from '../providers/SyncModalProvider';
import { SyncModalAction } from '../providers/types';
import { useSyncModal } from '../providers/useSyncModal';
import { SyncModalDelete } from './SyncModalDelete';
import { SyncModalForm } from './SyncModalForm';
import { SyncModalView } from './SyncModalView';

type Props = { chartUuid: string } & Pick<ModalProps, 'opened' | 'onClose'>;

const SyncModalBaseAndManager: FC<Props> = ({ chartUuid, opened, onClose }) => {
    const { t } = useTranslation();
    const { search, pathname } = useLocation();
    const navigate = useNavigate();
    const { action, setAction, setCurrentSchedulerUuid } = useSyncModal();

    useEffect(() => {
        const schedulerUuidFromParams = getSchedulerUuidFromUrlParams(search);

        if (schedulerUuidFromParams) {
            setAction(SyncModalAction.EDIT);
            setCurrentSchedulerUuid(schedulerUuidFromParams);
            void navigate({ pathname }, { replace: true });
        }
    }, [navigate, pathname, search, setAction, setCurrentSchedulerUuid]);

    let modalTitle = t('features_sync.modal.title.sync_with_google_sheets');
    let headerIcon: typeof GSheetsIcon | typeof IconTrash = GSheetsIcon;
    let headerIconColor = 'black';

    if (action === SyncModalAction.CREATE) {
        modalTitle = t('features_sync.modal.title.create_new_sync');
    } else if (action === SyncModalAction.EDIT) {
        modalTitle = t('features_sync.modal.title.edit_sync');
    } else if (action === SyncModalAction.DELETE) {
        headerIcon = IconTrash;
        modalTitle = t('features_sync.modal.title.delete_sync');
        headerIconColor = 'red';
    }

    return (
        <Modal
            size="xl"
            opened={opened}
            title={
                <Flex align="center" gap="xs">
                    <MantineIcon icon={headerIcon} color={headerIconColor} />
                    <Title order={5}>{modalTitle}</Title>
                </Flex>
            }
            onClose={onClose}
        >
            {action === SyncModalAction.VIEW && (
                <SyncModalView chartUuid={chartUuid} />
            )}
            {(action === SyncModalAction.CREATE ||
                action === SyncModalAction.EDIT) && (
                <SyncModalForm chartUuid={chartUuid} />
            )}
            {action === SyncModalAction.DELETE && <SyncModalDelete />}
        </Modal>
    );
};

export const SyncModal: FC<Props> = ({ chartUuid, opened, onClose }) => (
    <SyncModalProvider>
        <SyncModalBaseAndManager
            chartUuid={chartUuid}
            opened={opened}
            onClose={onClose}
        />
    </SyncModalProvider>
);
