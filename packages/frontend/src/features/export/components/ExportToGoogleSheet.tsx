import { type ApiScheduledDownloadCsv } from '@lightdash/common';
import { Button, Loader, Menu } from '@mantine/core';
import { IconShare2 } from '@tabler/icons-react';
import { memo, useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { GSheetsIcon } from '../../../components/common/GSheetsIcon';
import MantineIcon from '../../../components/common/MantineIcon';
import { useGdriveAccessToken } from '../../../hooks/gdrive/useGdrive';
import useHealth from '../../../hooks/health/useHealth';
import { useExportToGoogleSheet } from '../hooks/useExportToGoogleSheet';

export type ExportToGoogleSheetProps = {
    getGsheetLink: () => Promise<ApiScheduledDownloadCsv>;
    asMenuItem?: boolean;
    disabled?: boolean;
};

export const ExportToGoogleSheet: FC<ExportToGoogleSheetProps> = memo(
    ({ getGsheetLink, asMenuItem, disabled }) => {
        const health = useHealth();
        const { t } = useTranslation();

        const hasGoogleDrive =
            health.data?.auth.google.oauth2ClientId !== undefined &&
            health.data?.auth.google.googleDriveApiKey !== undefined;

        const { startExporting, isExporting } = useExportToGoogleSheet({
            getGsheetLink,
        });

        const { mutate, token } = useGdriveAccessToken();

        useEffect(() => {
            if (token) {
                startExporting();
            }
        }, [token, startExporting]);

        if (!hasGoogleDrive) {
            // We should not load this component on `ExporSelector` if google keys are not available
            console.warn(t('features_export.no_google_drive'));
            return null;
        }

        if (asMenuItem) {
            return (
                <Menu.Item
                    icon={
                        isExporting ? (
                            <Loader />
                        ) : (
                            <MantineIcon icon={IconShare2} />
                        )
                    }
                    disabled={isExporting || disabled}
                    onClick={() => mutate()}
                    closeMenuOnClick={false}
                >
                    {t('features_export.export_google_sheets')}
                </Menu.Item>
            );
        }

        return (
            <Button
                size="xs"
                variant="default"
                loading={isExporting}
                leftIcon={<MantineIcon icon={GSheetsIcon} />}
                onClick={() => mutate()}
                disabled={disabled}
            >
                {t('features_export.google_sheets')}
            </Button>
        );
    },
);
