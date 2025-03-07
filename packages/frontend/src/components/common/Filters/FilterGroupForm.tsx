import {
    FilterGroupOperator,
    createFilterRuleFromField,
    getFilterGroupItemsPropertyName,
    getFiltersFromGroup,
    getItemsFromFilterGroup,
    isAndFilterGroup,
    isCustomSqlDimension,
    isDimension,
    isFilterGroup,
    isMetric,
    isTableCalculation,
    type CustomSqlDimension,
    type FilterGroup,
    type FilterRule,
    type FilterableDimension,
    type FilterableField,
    type Metric,
    type TableCalculation,
} from '@lightdash/common';
import {
    Box,
    Button,
    Divider,
    Group,
    Select,
    Stack,
    Text,
} from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import React, { useCallback, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import MantineIcon from '../MantineIcon';
import FilterRuleForm from './FilterRuleForm';

type Props = {
    hideButtons?: boolean;
    hideLine?: boolean;
    groupDepth?: number;
    fields: FilterableField[];
    filterGroup: FilterGroup;
    isEditMode: boolean;
    onChange: (value: FilterGroup) => void;
    onDelete: () => void;
};

const ALLOW_CONVERT_TO_GROUP_UP_TO_DEPTH = 2;

const FilterGroupForm: FC<Props> = ({
    hideButtons,
    hideLine,
    groupDepth = 0,
    fields,
    filterGroup,
    isEditMode,
    onChange,
    onDelete,
}) => {
    const items = getItemsFromFilterGroup(filterGroup);
    const [conditionLabel, setConditionLabel] = useState('');
    const { t } = useTranslation();

    const [dimensions, metrics, tableCalculations] = useMemo<
        [
            Array<FilterableDimension | CustomSqlDimension>,
            Metric[],
            TableCalculation[],
        ]
    >(() => {
        return [
            [
                ...fields.filter(isDimension),
                ...fields.filter(isCustomSqlDimension),
            ],
            fields.filter(isMetric),
            fields.filter(isTableCalculation),
        ];
    }, [fields]);

    const availableFieldsForGroupRules = useMemo<FilterableField[]>(() => {
        // If the group is an AND group, we can use all fields
        if (isAndFilterGroup(filterGroup)) {
            return [...dimensions, ...metrics, ...tableCalculations];
        }

        // If the group is an OR group, we can only use fields that are of the same type
        const filters = getFiltersFromGroup(filterGroup, fields);
        if (filters.dimensions) {
            setConditionLabel('dimension');
            return dimensions;
        }

        if (filters.metrics) {
            setConditionLabel('metric');
            return metrics;
        }

        if (filters.tableCalculations) {
            setConditionLabel('table calculation');
            return tableCalculations;
        }

        return [];
    }, [dimensions, fields, filterGroup, metrics, tableCalculations]);

    const onDeleteItem = useCallback(
        (index: number) => {
            if (items.length <= 1) {
                onDelete();
            } else {
                onChange({
                    ...filterGroup,
                    [getFilterGroupItemsPropertyName(filterGroup)]: [
                        ...items.slice(0, index),
                        ...items.slice(index + 1),
                    ],
                });
            }
        },
        [filterGroup, items, onChange, onDelete],
    );

    const onChangeItem = useCallback(
        (index: number, item: FilterRule | FilterGroup) => {
            onChange({
                ...filterGroup,
                [getFilterGroupItemsPropertyName(filterGroup)]: [
                    ...items.slice(0, index),
                    item,
                    ...items.slice(index + 1),
                ],
            });
        },
        [filterGroup, items, onChange],
    );

    const onAddFilterRule = useCallback(() => {
        if (availableFieldsForGroupRules.length > 0) {
            onChange({
                ...filterGroup,
                [getFilterGroupItemsPropertyName(filterGroup)]: [
                    ...items,
                    createFilterRuleFromField(availableFieldsForGroupRules[0]),
                ],
            });
        }
    }, [availableFieldsForGroupRules, filterGroup, items, onChange]);

    const onChangeOperator = useCallback(
        (value: FilterGroupOperator) => {
            onChange({
                id: filterGroup.id,
                [value]: items,
            } as FilterGroup);
        },
        [filterGroup, items, onChange],
    );

    return (
        <Stack pos="relative" spacing="sm" mb="xxs">
            {!hideLine && (
                <Divider
                    orientation="vertical"
                    pos="absolute"
                    h="100%"
                    top={0}
                    left={18}
                    style={{ zIndex: 1 }}
                />
            )}

            <Group spacing="xs">
                <Box bg="white" pos="relative" style={{ zIndex: 3 }}>
                    <Select
                        size="xs"
                        w={70}
                        withinPortal
                        disabled={!isEditMode}
                        data={[
                            {
                                value: FilterGroupOperator.and,
                                label: 'All',
                            },
                            {
                                value: FilterGroupOperator.or,
                                label: 'Any',
                            },
                        ]}
                        value={
                            isAndFilterGroup(filterGroup)
                                ? FilterGroupOperator.and
                                : FilterGroupOperator.or
                        }
                        onChange={(operator: FilterGroupOperator) =>
                            onChangeOperator(operator)
                        }
                    />
                </Box>

                <Text color="dimmed" size="xs">
                    {t('components_common_filters.group_form.tip', {
                        conditionLabel,
                    })}
                </Text>
            </Group>

            <Stack
                spacing="xs"
                pl={36}
                style={{ flexGrow: 1, overflowY: 'auto' }}
            >
                {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                        {!isFilterGroup(item) ? (
                            <FilterRuleForm
                                filterRule={item}
                                fields={availableFieldsForGroupRules}
                                isEditMode={isEditMode}
                                onChange={(value) => onChangeItem(index, value)}
                                onDelete={() => onDeleteItem(index)}
                                onConvertToGroup={
                                    ALLOW_CONVERT_TO_GROUP_UP_TO_DEPTH >
                                    groupDepth
                                        ? () =>
                                              onChangeItem(
                                                  index,
                                                  // create new group with opposite operator
                                                  isAndFilterGroup(filterGroup)
                                                      ? {
                                                            id: uuidv4(),
                                                            or: [item],
                                                        }
                                                      : {
                                                            id: uuidv4(),
                                                            and: [item],
                                                        },
                                              )
                                        : undefined
                                }
                            />
                        ) : (
                            <FilterGroupForm
                                groupDepth={groupDepth + 1}
                                isEditMode={isEditMode}
                                filterGroup={item}
                                fields={availableFieldsForGroupRules}
                                onChange={(value) => onChangeItem(index, value)}
                                onDelete={() => onDeleteItem(index)}
                            />
                        )}
                    </React.Fragment>
                ))}
            </Stack>

            {isEditMode &&
                !hideButtons &&
                availableFieldsForGroupRules.length > 0 && (
                    <Box bg="white" pos="relative" style={{ zIndex: 2 }}>
                        <Button
                            variant="outline"
                            size="xs"
                            leftIcon={<MantineIcon icon={IconPlus} />}
                            onClick={onAddFilterRule}
                        >
                            {t(
                                'components_common_filters.group_form.add_group_rule',
                            )}
                        </Button>
                    </Box>
                )}
        </Stack>
    );
};

export default FilterGroupForm;
