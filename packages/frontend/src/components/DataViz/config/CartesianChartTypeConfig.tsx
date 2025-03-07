import {
    CartesianSeriesType,
    ChartKind,
    type CartesianChartDisplay,
} from '@lightdash/common';
import { Box, Group, Select, Text } from '@mantine/core';
import { forwardRef, type ComponentPropsWithoutRef, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import MantineIcon from '../../common/MantineIcon';
import { getChartIcon } from '../../common/ResourceIcon/utils';

type Props = {
    type: CartesianSeriesType | undefined;
    onChangeType: (
        value: NonNullable<CartesianChartDisplay['series']>[number]['type'],
    ) => void;
    canSelectDifferentTypeFromBaseChart: boolean;
};

const ChartTypeIcon: FC<{ type: CartesianSeriesType }> = ({ type }) => {
    const chartKind =
        type === CartesianSeriesType.BAR
            ? ChartKind.VERTICAL_BAR
            : ChartKind.LINE;

    return <MantineIcon icon={getChartIcon(chartKind)} color="dark.0" />;
};

const ChartTypeItem = forwardRef<
    HTMLDivElement,
    ComponentPropsWithoutRef<'div'> & {
        value: CartesianSeriesType;
        label: string;
    }
>(({ value, label, ...others }, ref) => (
    <Box ref={ref} {...others}>
        <Group noWrap spacing="xs">
            <ChartTypeIcon type={value} />
            <Text>{label}</Text>
        </Group>
    </Box>
));

export const CartesianChartTypeConfig: FC<Props> = ({ onChangeType, type }) => {
    const { t } = useTranslation();

    const options = [
        {
            value: CartesianSeriesType.BAR,
            label: t('components_dataviz_cartesian_chart.bar'),
        },
        {
            value: CartesianSeriesType.LINE,
            label: t('components_dataviz_cartesian_chart.line'),
        },
    ];

    return (
        <Select
            radius="md"
            data={options.map((option) => ({
                value: option.value,
                label: option.label,
            }))}
            itemComponent={ChartTypeItem}
            icon={type && <ChartTypeIcon type={type} />}
            value={type}
            onChange={(
                value: Extract<
                    CartesianSeriesType,
                    CartesianSeriesType.LINE | CartesianSeriesType.BAR
                >,
            ) => value && onChangeType(value)}
            styles={(theme) => ({
                root: {
                    flex: 1,
                },
                input: {
                    fontWeight: 500,
                    border: `1px solid ${theme.colors.gray[2]}`,
                },
                item: {
                    '&[data-selected="true"]': {
                        color: theme.colors.gray[7],
                        fontWeight: 500,
                        backgroundColor: theme.colors.gray[2],
                    },
                    '&[data-selected="true"]:hover': {
                        backgroundColor: theme.colors.gray[3],
                    },
                    '&:hover': {
                        backgroundColor: theme.colors.gray[1],
                    },
                },
            })}
        />
    );
};
