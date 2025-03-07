import {
    assertUnreachable,
    getErrorMessage,
    isApiError,
    SemanticLayerType,
} from '@lightdash/common';
import {
    Anchor,
    Avatar,
    Group,
    Select,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { forwardRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import useToaster from '../../hooks/toaster/useToaster';
import {
    useProject,
    useProjectSemanticLayerDeleteMutation,
    useProjectSemanticLayerUpdateMutation,
} from '../../hooks/useProject';
import { SettingsGridCard } from '../common/Settings/SettingsCard';
import CubeLogo from './Assets/cube.svg';
import DbtLogo from './Assets/dbt.svg';
import CubeSemanticLayerForm from './CubeSemanticLayerForm';
import DbtSemanticLayerForm from './DbtSemanticLayerForm';
import {
    cubeSemanticLayerFormSchema,
    dbtSemanticLayerFormSchema,
} from './types';

interface Props {
    projectUuid: string;
}

interface SemanticLayerItem extends React.ComponentPropsWithoutRef<'div'> {
    label: string;
    value: string;
    logo: string;
}

const SelectItemComponent = forwardRef<HTMLDivElement, SemanticLayerItem>(
    ({ logo, label, ...others }: SemanticLayerItem, ref) => (
        <div ref={ref} {...others}>
            <Group noWrap>
                <Avatar src={logo} size="xs" h="100%" />
                <Text>{label}</Text>
            </Group>
        </div>
    ),
);

const SemanticLayerLabels: Record<SemanticLayerType, string> = {
    [SemanticLayerType.CUBE]: 'Cube',
    [SemanticLayerType.DBT]: 'dbt',
};

const formSchemas = z.union([
    dbtSemanticLayerFormSchema,
    cubeSemanticLayerFormSchema,
]);

const SettingsSemanticLayer: FC<Props> = ({ projectUuid }) => {
    const { t } = useTranslation();
    const { data } = useProject(projectUuid);
    const { showToastSuccess, showToastError } = useToaster();

    const SemanticLayerOptions: SemanticLayerItem[] = [
        {
            label: t('components_settings_semantic_layer.semantic_layer.dbt'),
            value: SemanticLayerType.DBT,
            logo: DbtLogo,
        },
        {
            label: t('components_settings_semantic_layer.semantic_layer.cube'),
            value: SemanticLayerType.CUBE,
            logo: CubeLogo,
        },
    ];

    const [semanticLayerType, setSemanticLayerType] =
        useState<SemanticLayerType>(
            data?.semanticLayerConnection?.type ?? SemanticLayerType.DBT,
        );

    const projectMutation = useProjectSemanticLayerUpdateMutation(projectUuid);
    const deleteSemanticLayerMutation =
        useProjectSemanticLayerDeleteMutation(projectUuid);

    const handleSubmit = async (
        connectionData: z.infer<typeof formSchemas>,
    ) => {
        const { token, ...rest } = connectionData;
        try {
            await projectMutation.mutateAsync({
                ...rest,
                ...(token?.trim().length > 0 ? { token } : {}),
            });

            showToastSuccess({
                title: t(
                    'components_settings_semantic_layer.tips_submit.success',
                    {
                        title: SemanticLayerLabels[semanticLayerType],
                    },
                ),
            });
        } catch (e) {
            const errorMessage = isApiError(e)
                ? e.error.message
                : getErrorMessage(e);
            showToastError({
                title: t(
                    'components_settings_semantic_layer.tips_submit.failed',
                ),
                subtitle: errorMessage,
            });
        }

        return false;
    };

    const handleDelete = async () => {
        await deleteSemanticLayerMutation.mutateAsync();

        showToastSuccess({
            title: t('components_settings_semantic_layer.tips_delete.success'),
        });
    };

    return (
        <SettingsGridCard>
            <Stack spacing="sm">
                <Title order={4}>
                    {t('components_settings_semantic_layer.content.part_1')}
                </Title>

                <Text color="dimmed">
                    {t('components_settings_semantic_layer.content.part_2')}
                </Text>

                <Anchor
                    href="https://docs.lightdash.com/references/dbt-semantic-layer"
                    target="_blank"
                >
                    {t('components_settings_semantic_layer.content.part_3')}
                </Anchor>
            </Stack>

            <Stack>
                <Select
                    label="Type"
                    data={SemanticLayerOptions}
                    value={semanticLayerType}
                    itemComponent={SelectItemComponent}
                    onChange={(value: SemanticLayerType) =>
                        setSemanticLayerType(value)
                    }
                />

                {semanticLayerType === SemanticLayerType.DBT ? (
                    <DbtSemanticLayerForm
                        isLoading={projectMutation.isLoading}
                        onSubmit={handleSubmit}
                        onDelete={handleDelete}
                        semanticLayerConnection={
                            semanticLayerType ===
                            data?.semanticLayerConnection?.type
                                ? data.semanticLayerConnection
                                : undefined
                        }
                    />
                ) : semanticLayerType === SemanticLayerType.CUBE ? (
                    <CubeSemanticLayerForm
                        isLoading={false}
                        onSubmit={handleSubmit}
                        onDelete={handleDelete}
                        semanticLayerConnection={
                            semanticLayerType ===
                            data?.semanticLayerConnection?.type
                                ? data.semanticLayerConnection
                                : undefined
                        }
                    />
                ) : (
                    assertUnreachable(
                        semanticLayerType,
                        `Unknown semantic layer type: ${semanticLayerType}`,
                    )
                )}
            </Stack>
        </SettingsGridCard>
    );
};

export default SettingsSemanticLayer;
