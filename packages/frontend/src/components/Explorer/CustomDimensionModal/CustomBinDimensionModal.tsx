import {
    BinType,
    CustomDimensionType,
    getItemId,
    isCustomDimension,
    isDimension,
    snakeCaseName,
    type BinRange,
    type CustomBinDimension,
    type Dimension,
} from '@lightdash/common';
import {
    ActionIcon,
    Button,
    Flex,
    Group,
    Modal,
    NumberInput,
    Radio,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { IconX } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';
import { useEffect, useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import useToaster from '../../../hooks/toaster/useToaster';
import useExplorerContext from '../../../providers/Explorer/useExplorerContext';
import MantineIcon from '../../common/MantineIcon';

// TODO: preview custom dimension results

const sanitizeId = (label: string, dimensionName: string) =>
    `${dimensionName}_${snakeCaseName(label)}`;

const MIN_OF_FIXED_NUMBER_BINS = 1;
const DEFAULT_CUSTOM_RANGE: BinRange[] = [
    { to: 0, from: undefined },
    { from: 1, to: undefined },
];

export const CustomBinDimensionModal: FC<{
    isEditing: boolean;
    item: Dimension | CustomBinDimension;
}> = ({ isEditing, item }) => {
    const { showToastSuccess } = useToaster();
    const toggleModal = useExplorerContext(
        (context) => context.actions.toggleCustomDimensionModal,
    );
    const customDimensions = useExplorerContext(
        (context) =>
            context.state.unsavedChartVersion.metricQuery.customDimensions,
    );
    const addCustomDimension = useExplorerContext(
        (context) => context.actions.addCustomDimension,
    );
    const editCustomDimension = useExplorerContext(
        (context) => context.actions.editCustomDimension,
    );
    const { t } = useTranslation();

    const formSchema = z.object({
        customDimensionLabel: z.string().refine(
            (label) => {
                if (!label) return true;
                if (!item) return true;
                if (isEditing && label === item.name) return true;

                const dimensionName = sanitizeId(
                    label,
                    isEditing && isCustomDimension(item)
                        ? item.dimensionId
                        : item.name,
                );

                if (
                    isEditing &&
                    isCustomDimension(item) &&
                    dimensionName === item.id
                ) {
                    return true;
                }

                return !customDimensions?.some(
                    (customDimension) => customDimension.id === dimensionName,
                );
            },
            {
                message: t(
                    'components_explorer_custom_dimension_modal.tips.dimension_is_exists',
                ),
            },
        ),
        binType: z.nativeEnum(BinType),
        binConfig: z.object({
            fixedNumber: z.object({
                binNumber: z.number().positive(),
            }),
            fixedWidth: z.object({
                binWidth: z.number().positive(),
            }),
            customRange: z.array(
                z
                    .object({
                        from: z.number({ coerce: true }).optional(),
                        to: z.number({ coerce: true }).optional(),
                    })
                    .transform((o) => ({ from: o.from, to: o.to })),
            ),
        }),
    });

    type FormValues = z.infer<typeof formSchema>;

    const form = useForm<FormValues>({
        initialValues: {
            customDimensionLabel: '',
            binType: BinType.FIXED_NUMBER,
            binConfig: {
                fixedNumber: {
                    binNumber: MIN_OF_FIXED_NUMBER_BINS,
                },
                fixedWidth: {
                    binWidth: MIN_OF_FIXED_NUMBER_BINS,
                },
                customRange: DEFAULT_CUSTOM_RANGE,
            },
        },
        validate: zodResolver(formSchema),
    });

    const { setFieldValue } = form;

    useEffect(() => {
        if (isEditing && isCustomDimension(item)) {
            setFieldValue('customDimensionLabel', item.name);
            setFieldValue('binType', item.binType);
            setFieldValue(
                'binConfig.fixedNumber.binNumber',
                item.binNumber ? item.binNumber : MIN_OF_FIXED_NUMBER_BINS,
            );

            setFieldValue(
                'binConfig.fixedWidth.binWidth',
                item.binWidth ? item.binWidth : MIN_OF_FIXED_NUMBER_BINS,
            );

            setFieldValue(
                'binConfig.customRange',
                item.customRange
                    ? cloneDeep(item.customRange)
                    : DEFAULT_CUSTOM_RANGE,
            );
        }
    }, [setFieldValue, item, isEditing]);

    const handleOnSubmit = form.onSubmit((unparsedValues) => {
        // mantine form does not produce zod parsed values
        // so, number({ coerce: true }) does not work
        // that's why we need to parse the values manually
        const values = formSchema.parse(unparsedValues);

        if (item) {
            const sanitizedId = sanitizeId(
                values.customDimensionLabel,
                isEditing && isCustomDimension(item)
                    ? item.dimensionId
                    : item.name,
            );

            if (isEditing && isCustomDimension(item)) {
                editCustomDimension(
                    {
                        id: item.id,
                        name: values.customDimensionLabel,
                        type: CustomDimensionType.BIN,
                        dimensionId: item.dimensionId,
                        binType: values.binType,
                        binNumber: values.binConfig.fixedNumber.binNumber,
                        binWidth: values.binConfig.fixedWidth.binWidth,
                        table: item.table,
                        customRange: values.binConfig.customRange,
                    },
                    item.id,
                );

                showToastSuccess({
                    title: t(
                        'components_explorer_custom_dimension_modal.tips.edit_success',
                    ),
                });
            } else {
                addCustomDimension({
                    id: sanitizedId,
                    name: values.customDimensionLabel,
                    type: CustomDimensionType.BIN,
                    dimensionId: getItemId(item),
                    binType: values.binType,
                    binNumber: values.binConfig.fixedNumber.binNumber,
                    binWidth: values.binConfig.fixedWidth.binWidth,
                    table: item.table,
                    customRange: values.binConfig.customRange,
                });

                showToastSuccess({
                    title: t(
                        'components_explorer_custom_dimension_modal.tips.add_success',
                    ),
                });
            }
        }

        form.reset();
        toggleModal();
    });

    const baseDimensionLabel = useMemo(() => {
        if (item) {
            if (isEditing && isCustomDimension(item)) {
                // TODO: Store base dimension label in Custom Dimension
                return item.dimensionId;
            } else if (isDimension(item)) {
                return item.label;
            }
            return item.name;
        }
    }, [isEditing, item]);

    return (
        <Modal
            size="lg"
            onClick={(e) => e.stopPropagation()}
            opened={true}
            onClose={() => {
                toggleModal(undefined);
                form.reset();
            }}
            title={
                <>
                    <Title order={4}>
                        {t(
                            'components_explorer_custom_dimension_modal.modal.title',
                            {
                                title: isEditing
                                    ? t(
                                          'components_explorer_custom_dimension_modal.modal.edit',
                                      )
                                    : t(
                                          'components_explorer_custom_dimension_modal.modal.create',
                                      ),
                            },
                        )}
                        <Text span fw={400}>
                            {' '}
                            - {baseDimensionLabel}{' '}
                        </Text>
                    </Title>
                </>
            }
        >
            <form onSubmit={handleOnSubmit}>
                <Stack>
                    <TextInput
                        label={t(
                            'components_explorer_custom_dimension_modal.form.label.label',
                        )}
                        required
                        placeholder={t(
                            'components_explorer_custom_dimension_modal.form.label.placeholder',
                        )}
                        {...form.getInputProps('customDimensionLabel')}
                    />

                    <Radio.Group
                        label={t(
                            'components_explorer_custom_dimension_modal.form.bin_type.label',
                        )}
                        withAsterisk
                        required
                        {...form.getInputProps('binType')}
                    >
                        <Group mt="md">
                            <Radio
                                value={BinType.FIXED_NUMBER}
                                label={t(
                                    'components_explorer_custom_dimension_modal.form.bin_type.radio_groups.radio_01',
                                )}
                            />
                            <Radio
                                value={BinType.FIXED_WIDTH}
                                label={t(
                                    'components_explorer_custom_dimension_modal.form.bin_type.radio_groups.radio_02',
                                )}
                            />
                            <Radio
                                value={BinType.CUSTOM_RANGE}
                                label={t(
                                    'components_explorer_custom_dimension_modal.form.bin_type.radio_groups.radio_03',
                                )}
                            />
                        </Group>
                    </Radio.Group>

                    {form.values.binType === BinType.FIXED_NUMBER && (
                        <NumberInput
                            w={100}
                            label={t(
                                'components_explorer_custom_dimension_modal.form.bin_number.label',
                            )}
                            required
                            min={MIN_OF_FIXED_NUMBER_BINS}
                            type="number"
                            {...form.getInputProps(
                                'binConfig.fixedNumber.binNumber',
                            )}
                        />
                    )}

                    {form.values.binType === BinType.FIXED_WIDTH && (
                        <NumberInput
                            w={100}
                            label={t(
                                'components_explorer_custom_dimension_modal.form.bin_width.label',
                            )}
                            required
                            min={MIN_OF_FIXED_NUMBER_BINS}
                            type="number"
                            {...form.getInputProps(
                                'binConfig.fixedWidth.binWidth',
                            )}
                        />
                    )}

                    {form.values.binType === BinType.CUSTOM_RANGE && (
                        <>
                            <Text fw={500}>
                                {t(
                                    'components_explorer_custom_dimension_modal.form.range.title',
                                )}
                            </Text>
                            {form.values.binConfig.customRange.map(
                                (range, index) => {
                                    const toProps = form.getInputProps(
                                        `binConfig.customRange.${index}.to`,
                                    );
                                    const fromProps = form.getInputProps(
                                        `binConfig.customRange.${index}.from`,
                                    );

                                    if (index === 0) {
                                        return (
                                            <Flex
                                                key={`custom-range.${index}`}
                                                gap="md"
                                                align="center"
                                            >
                                                <Text
                                                    w={100}
                                                    color="gray.6"
                                                    fw="400"
                                                >
                                                    &lt;{toProps.value}{' '}
                                                </Text>

                                                <TextInput
                                                    w={100}
                                                    required
                                                    type="number"
                                                    {...toProps}
                                                />
                                            </Flex>
                                        );
                                    } else if (
                                        index ===
                                        form.values.binConfig.customRange
                                            .length -
                                            1
                                    ) {
                                        return (
                                            <Flex
                                                gap="md"
                                                align="center"
                                                key={`custom-range.${index}`}
                                            >
                                                <Text
                                                    w={100}
                                                    color="gray.6"
                                                    fw="400"
                                                >
                                                    ≥{fromProps.value}{' '}
                                                </Text>

                                                <TextInput
                                                    w={100}
                                                    required
                                                    type="number"
                                                    {...fromProps}
                                                />
                                                <Text color="gray.6" fw="400">
                                                    {t(
                                                        'components_explorer_custom_dimension_modal.form.range.and_above',
                                                    )}{' '}
                                                </Text>
                                            </Flex>
                                        );
                                    } else {
                                        return (
                                            <Flex
                                                gap="md"
                                                align="center"
                                                key={`custom-range.${index}`}
                                            >
                                                <Text
                                                    w={100}
                                                    color="gray.6"
                                                    fw="400"
                                                >
                                                    ≥{fromProps.value}{' '}
                                                    {t(
                                                        'components_explorer_custom_dimension_modal.form.range.and',
                                                    )}{' '}
                                                    &lt;
                                                    {toProps.value}
                                                </Text>

                                                <TextInput
                                                    w={100}
                                                    required
                                                    type="number"
                                                    {...fromProps}
                                                />
                                                <Text color="gray.6" fw="400">
                                                    to{' '}
                                                </Text>

                                                <TextInput
                                                    w={100}
                                                    required
                                                    type="number"
                                                    {...toProps}
                                                />

                                                <ActionIcon
                                                    onClick={() => {
                                                        const newRange = [
                                                            ...form.values
                                                                .binConfig
                                                                .customRange,
                                                        ];
                                                        newRange.splice(
                                                            index,
                                                            1,
                                                        );
                                                        form.setFieldValue(
                                                            'binConfig.customRange',
                                                            newRange,
                                                        );
                                                    }}
                                                >
                                                    <MantineIcon icon={IconX} />
                                                </ActionIcon>
                                            </Flex>
                                        );
                                    }
                                },
                            )}

                            <Text
                                color="blue.6"
                                fw="400"
                                maw={100}
                                sx={{ cursor: 'pointer' }}
                                onClick={() => {
                                    // Insert new custom range item before the last one
                                    const newRange = [
                                        ...form.values.binConfig.customRange,
                                    ];
                                    newRange.splice(newRange.length - 1, 0, {
                                        from: 0,
                                        to: 0,
                                    });

                                    form.setFieldValue(
                                        'binConfig.customRange',
                                        newRange,
                                    );
                                }}
                            >
                                {' '}
                                +{' '}
                                {t(
                                    'components_explorer_custom_dimension_modal.form.range.add',
                                )}{' '}
                            </Text>
                        </>
                    )}

                    {/* Add results preview */}

                    <Button ml="auto" type="submit">
                        {isEditing
                            ? t(
                                  'components_explorer_custom_dimension_modal.form.range.save',
                              )
                            : t(
                                  'components_explorer_custom_dimension_modal.form.range.create',
                              )}
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
};
