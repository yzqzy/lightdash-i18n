import { Button } from '@mantine/core';
import { IconDeviceFloppy } from '@tabler/icons-react';
import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { useAddVersionMutation } from '../../../hooks/useSavedQuery';
import useSearchParams from '../../../hooks/useSearchParams';
import useExplorerContext from '../../../providers/Explorer/useExplorerContext';
import MantineIcon from '../../common/MantineIcon';
import ChartCreateModal from '../../common/modal/ChartCreateModal';

const SaveChartButton: FC<{ isExplorer?: boolean }> = ({ isExplorer }) => {
    const unsavedChartVersion = useExplorerContext(
        (context) => context.state.unsavedChartVersion,
    );
    const hasUnsavedChanges = useExplorerContext(
        (context) => context.state.hasUnsavedChanges,
    );
    const savedChart = useExplorerContext(
        (context) => context.state.savedChart,
    );
    const spaceUuid = useSearchParams('fromSpace');
    const { t } = useTranslation();

    const [isQueryModalOpen, setIsQueryModalOpen] = useState<boolean>(false);

    const update = useAddVersionMutation();
    const handleSavedQueryUpdate = () => {
        if (savedChart?.uuid && unsavedChartVersion) {
            update.mutate({
                uuid: savedChart.uuid,
                payload: unsavedChartVersion,
            });
        }
    };
    const isDisabled = !unsavedChartVersion.tableName || !hasUnsavedChanges;

    const handleSaveChart = () => {
        return savedChart
            ? handleSavedQueryUpdate()
            : setIsQueryModalOpen(true);
    };

    return (
        <>
            <Button
                disabled={isDisabled}
                variant={isExplorer ? 'default' : undefined}
                color={isExplorer ? 'blue' : 'green.7'}
                size="xs"
                loading={update.isLoading}
                leftIcon={
                    isExplorer ? (
                        <MantineIcon icon={IconDeviceFloppy} />
                    ) : undefined
                }
                onClick={handleSaveChart}
            >
                {savedChart
                    ? t('components_explorer_save_chart_button.save_changes')
                    : t('components_explorer_save_chart_button.save_chart')}
            </Button>

            {unsavedChartVersion && (
                <ChartCreateModal
                    isOpen={isQueryModalOpen}
                    savedData={unsavedChartVersion}
                    onClose={() => setIsQueryModalOpen(false)}
                    onConfirm={() => setIsQueryModalOpen(false)}
                    defaultSpaceUuid={spaceUuid ?? undefined}
                />
            )}
        </>
    );
};

export default SaveChartButton;
