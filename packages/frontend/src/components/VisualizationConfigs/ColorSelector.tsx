import {
    ColorPicker as MantineColorPicker,
    ColorSwatch,
    Popover,
    Stack,
    TextInput,
} from '@mantine/core';
import { IconHash } from '@tabler/icons-react';
import { type FC } from 'react';
import { useTranslation } from 'react-i18next';

import { isHexCodeColor } from '../../utils/colorUtils';
import MantineIcon from '../common/MantineIcon';

interface Props {
    color?: string;
    defaultColor?: string;
    swatches: string[];
    onColorChange?: (newColor: string) => void;
}

const ColorSelector: FC<Props> = ({
    color,
    defaultColor = 'rgba(0,0,0,.1)',
    swatches,
    onColorChange,
}) => {
    const { t } = useTranslation();
    const isValidHexColor = color && isHexCodeColor(color);

    return (
        <Popover shadow="md" withArrow disabled={!onColorChange}>
            <Popover.Target>
                <ColorSwatch
                    size={20}
                    color={isValidHexColor ? color : defaultColor}
                    sx={{
                        cursor: onColorChange ? 'pointer' : 'default',
                        transition: 'opacity 100ms ease',
                        '&:hover': { opacity: 0.8 },
                    }}
                />
            </Popover.Target>

            <Popover.Dropdown p="xs">
                <Stack spacing="xs">
                    <MantineColorPicker
                        size="sm"
                        format="hex"
                        swatches={swatches}
                        swatchesPerRow={8}
                        value={color ?? defaultColor}
                        onChange={(newColor) => {
                            if (onColorChange) {
                                onColorChange(newColor);
                            }
                        }}
                    />

                    <TextInput
                        size="xs"
                        icon={<MantineIcon icon={IconHash} />}
                        placeholder={t(
                            'components_visualization_configs_common.errors.custom_hex',
                        )}
                        error={
                            color && !isValidHexColor
                                ? t(
                                      'components_visualization_configs_common.errors.invalid_hex',
                                  )
                                : undefined
                        }
                        value={(color ?? '').replace('#', '')}
                        onChange={(event) => {
                            const newColor = event.currentTarget.value;
                            if (onColorChange) {
                                onColorChange(
                                    newColor === '' ? newColor : `#${newColor}`,
                                );
                            }
                        }}
                    />
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};

export default ColorSelector;
