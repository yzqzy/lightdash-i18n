import {
    formatDate,
    formatTimestamp,
    type PersonalAccessToken,
} from '@lightdash/common';
import {
    ActionIcon,
    Button,
    CopyButton,
    Flex,
    Group,
    Modal,
    Paper,
    Stack,
    Table,
    Text,
    Title,
    Tooltip,
} from '@mantine/core';
import {
    IconCheck,
    IconCopy,
    IconInfoCircle,
    IconTrash,
} from '@tabler/icons-react';
import React, {
    useEffect,
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from 'react';
import { useTranslation } from 'react-i18next';

import { useTableStyles } from '../../../hooks/styles/useTableStyles';
import {
    useAccessToken,
    useDeleteAccessToken,
} from '../../../hooks/useAccessToken';
import MantineIcon from '../../common/MantineIcon';

const TokenItem: FC<{
    token: PersonalAccessToken;
    setTokenToDelete: Dispatch<SetStateAction<PersonalAccessToken | undefined>>;
}> = ({ token, setTokenToDelete }) => {
    const { t } = useTranslation();
    const { description, expiresAt, rotatedAt, lastUsedAt, uuid } = token;

    return (
        <>
            <tr>
                <Text component="td" fw={500}>
                    {description}
                </Text>
                <td>
                    <Group align="center" position="left" spacing="xs">
                        <span>
                            {expiresAt
                                ? formatDate(expiresAt)
                                : t(
                                      'components_user_settings_access_tokens_panel_tokens_table.no_expiration_date',
                                  )}
                        </span>
                        {rotatedAt && (
                            <Tooltip
                                withinPortal
                                position="top"
                                maw={350}
                                label={`${t(
                                    'components_user_settings_access_tokens_panel_tokens_table.last_rotated_at',
                                )} ${formatTimestamp(rotatedAt)}`}
                            >
                                <MantineIcon
                                    icon={IconInfoCircle}
                                    color="gray.6"
                                    size="md"
                                />
                            </Tooltip>
                        )}
                    </Group>
                </td>
                <td>
                    {lastUsedAt && (
                        <Tooltip
                            withinPortal
                            position="top"
                            maw={350}
                            label={formatTimestamp(lastUsedAt)}
                        >
                            <Text>{formatDate(lastUsedAt)}</Text>
                        </Tooltip>
                    )}
                </td>
                <td>
                    <Group align="center" position="left" spacing="xs">
                        <Tooltip
                            withinPortal
                            position="top"
                            maw={350}
                            label={uuid}
                        >
                            <span>{uuid.substring(0, 4)}...</span>
                        </Tooltip>
                        <CopyButton value={uuid}>
                            {({ copied, copy }) => (
                                <Tooltip
                                    label={
                                        copied
                                            ? t(
                                                  'components_user_settings_access_tokens_panel_tokens_table.copied',
                                              )
                                            : t(
                                                  'components_user_settings_access_tokens_panel_tokens_table.copy',
                                              )
                                    }
                                    withArrow
                                    position="right"
                                >
                                    <ActionIcon
                                        size="xs"
                                        onClick={copy}
                                        variant={'transparent'}
                                    >
                                        <MantineIcon
                                            color={'gray.6'}
                                            icon={copied ? IconCheck : IconCopy}
                                        />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                        </CopyButton>
                    </Group>
                </td>
                <td width="1%">
                    <Button
                        px="xs"
                        variant="outline"
                        size="xs"
                        color="red"
                        onClick={() => setTokenToDelete(token)}
                    >
                        <MantineIcon icon={IconTrash} />
                    </Button>
                </td>
            </tr>
        </>
    );
};

export const TokensTable = () => {
    const { data } = useAccessToken();
    const { t } = useTranslation();

    const { cx, classes } = useTableStyles();

    const [tokenToDelete, setTokenToDelete] = useState<
        PersonalAccessToken | undefined
    >();
    const { mutate, isLoading: isDeleting, isSuccess } = useDeleteAccessToken();

    useEffect(() => {
        if (isSuccess) {
            setTokenToDelete(undefined);
        }
    }, [isSuccess]);

    return (
        <>
            <Paper withBorder sx={{ overflow: 'hidden' }}>
                <Table className={cx(classes.root, classes.alignLastTdRight)}>
                    <thead>
                        <tr>
                            <th>
                                {t(
                                    'components_user_settings_access_tokens_panel_tokens_table.table_columns.description',
                                )}
                            </th>
                            <th>
                                {t(
                                    'components_user_settings_access_tokens_panel_tokens_table.table_columns.expiration_date',
                                )}
                            </th>
                            <th>
                                {t(
                                    'components_user_settings_access_tokens_panel_tokens_table.table_columns.last_used_at',
                                )}
                            </th>
                            <th>
                                {t(
                                    'components_user_settings_access_tokens_panel_tokens_table.table_columns.uuid',
                                )}
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.map((token) => (
                            <TokenItem
                                key={token.uuid}
                                token={token}
                                setTokenToDelete={setTokenToDelete}
                            />
                        ))}
                    </tbody>
                </Table>
            </Paper>

            <Modal
                opened={!!tokenToDelete}
                onClose={() => !isDeleting && setTokenToDelete(undefined)}
                title={
                    <Title order={4}>
                        {t(
                            'components_user_settings_access_tokens_panel_tokens_table.modal.delete_token',
                        )}{' '}
                        {tokenToDelete?.description}
                    </Title>
                }
            >
                <Stack spacing="xl">
                    <Text>
                        {t(
                            'components_user_settings_access_tokens_panel_tokens_table.modal.content.part_1',
                        )}
                        <Text fw={600} component="span">
                            {' '}
                            {tokenToDelete?.description}{' '}
                        </Text>
                        {t(
                            'components_user_settings_access_tokens_panel_tokens_table.modal.content.part_2',
                        )}
                    </Text>

                    <Flex gap="sm" justify="flex-end">
                        <Button
                            color="dark"
                            variant="outline"
                            disabled={isDeleting}
                            onClick={() => setTokenToDelete(undefined)}
                        >
                            {t(
                                'components_user_settings_access_tokens_panel_tokens_table.modal.cancel',
                            )}
                        </Button>
                        <Button
                            color="red"
                            disabled={isDeleting}
                            onClick={() => {
                                mutate(tokenToDelete?.uuid ?? '');
                            }}
                        >
                            {t(
                                'components_user_settings_access_tokens_panel_tokens_table.modal.delete',
                            )}
                        </Button>
                    </Flex>
                </Stack>
            </Modal>
        </>
    );
};
