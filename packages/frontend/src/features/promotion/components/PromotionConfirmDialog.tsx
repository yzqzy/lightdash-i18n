import {
    PromotionAction,
    type PromotedChart,
    type PromotionChanges,
} from '@lightdash/common';
import {
    Accordion,
    Button,
    Flex,
    Group,
    Loader,
    Modal,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';

import {
    IconChartAreaLine,
    IconFolder,
    IconLayoutDashboard,
} from '@tabler/icons-react';

import MantineIcon from '../../../components/common/MantineIcon';

type Props = {
    type: 'chart' | 'dashboard';
    resourceName: string;
    promotionChanges: PromotionChanges | undefined;
    onConfirm: () => void;
    onClose: () => void;
};

type PromotionChange = {
    action: PromotionAction;
    data: Pick<PromotedChart, 'name' | 'uuid'>;
};
const PromotionChangesAccordion: FC<{
    type: 'spaces' | 'charts' | 'dashboards';
    items: {
        created: PromotionChange[];
        updated: PromotionChange[];
        deleted: PromotionChange[];
    };
}> = ({ type, items }) => {
    const { t } = useTranslation();

    return (
        <Accordion variant="contained">
            {items.created.length > 0 && (
                <Accordion.Item key={`${type}-created`} value={'created'}>
                    <Accordion.Control>
                        <Text size="sm">
                            {t('feature_promotion.to_be_created')} (
                            {items.created.length})
                        </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <ul>
                            {items.created.map((item) => {
                                return (
                                    <li key={item.data.uuid}>
                                        {item.data.name}
                                    </li>
                                );
                            })}
                        </ul>
                    </Accordion.Panel>
                </Accordion.Item>
            )}
            {items.updated.length > 0 && (
                <Accordion.Item key={`${type}-updated`} value={'updated'}>
                    <Accordion.Control>
                        <Text size="sm">
                            {t('feature_promotion.to_be_updated')} (
                            {items.updated.length})
                        </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <ul>
                            {items.updated.map((item) => {
                                return (
                                    <li key={item.data.uuid}>
                                        {item.data.name}
                                    </li>
                                );
                            })}
                        </ul>
                    </Accordion.Panel>
                </Accordion.Item>
            )}
            {items.deleted.length > 0 && (
                <Accordion.Item key={`${type}-deleted`} value={'deleted'}>
                    <Accordion.Control>
                        <Text size="sm">
                            {t('feature_promotion.deleted')}{' '}
                            {items.deleted.length}
                        </Text>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <ul>
                            {items.deleted.map((item) => {
                                return (
                                    <li key={item.data.uuid}>
                                        {item.data.name}
                                    </li>
                                );
                            })}
                        </ul>
                    </Accordion.Panel>
                </Accordion.Item>
            )}
        </Accordion>
    );
};
export const PromotionConfirmDialog: FC<Props> = ({
    type,
    resourceName,
    promotionChanges,
    onConfirm,
    onClose,
}) => {
    const { t } = useTranslation();

    const { groupedChanges, totalChanges, withoutChanges } = useMemo(() => {
        if (promotionChanges === undefined) return {};
        const changes = {
            spaces: {
                total: promotionChanges.spaces.filter(
                    (item) => item.action !== PromotionAction.NO_CHANGES,
                ).length,
                created: promotionChanges.spaces.filter(
                    (item) => item.action === PromotionAction.CREATE,
                ),
                updated: promotionChanges.spaces.filter(
                    (item) => item.action === PromotionAction.UPDATE,
                ),
                deleted: promotionChanges.spaces.filter(
                    (item) => item.action === PromotionAction.DELETE,
                ),
            },
            charts: {
                total: promotionChanges.charts.filter(
                    (item) => item.action !== PromotionAction.NO_CHANGES,
                ).length,
                created: promotionChanges.charts.filter(
                    (item) => item.action === PromotionAction.CREATE,
                ),
                updated: promotionChanges.charts.filter(
                    (item) => item.action === PromotionAction.UPDATE,
                ),
                deleted: promotionChanges.charts.filter(
                    (item) => item.action === PromotionAction.DELETE,
                ),
            },
            dashboards: {
                total: promotionChanges.dashboards.filter(
                    (item) => item.action !== PromotionAction.NO_CHANGES,
                ).length,

                created: promotionChanges.dashboards.filter(
                    (item) => item.action === PromotionAction.CREATE,
                ),
                updated: promotionChanges.dashboards.filter(
                    (item) => item.action === PromotionAction.UPDATE,
                ),
                deleted: promotionChanges.dashboards.filter(
                    (item) => item.action === PromotionAction.DELETE,
                ),
            },
        };
        const totalChangesNum =
            changes.spaces.total +
            changes.charts.total +
            changes.dashboards.total;
        const withoutChangesNum =
            promotionChanges.spaces.filter(
                (item) => item.action === PromotionAction.NO_CHANGES,
            ).length +
            promotionChanges.dashboards.filter(
                (item) => item.action === PromotionAction.NO_CHANGES,
            ).length +
            promotionChanges.charts.filter(
                (item) => item.action === PromotionAction.NO_CHANGES,
            ).length;

        return {
            groupedChanges: changes,
            totalChanges: totalChangesNum,
            withoutChanges: withoutChangesNum,
        };
    }, [promotionChanges]);

    return (
        <Modal
            size="lg"
            title={
                <Title order={4}>
                    {t('feature_promotion.modal.title')} {type}
                </Title>
            }
            opened={true}
            onClose={onClose}
        >
            <Stack spacing="lg" pt="sm">
                <Text>
                    {t('feature_promotion.modal.content.part_1')} {type}{' '}
                    <Text span fw={600}>
                        {resourceName}
                    </Text>
                    ?
                </Text>
                {t('feature_promotion.modal.content.part_2')}:
                {groupedChanges === undefined ? (
                    <Flex gap="sm" align="center">
                        <Loader color="gray" size={'sm'} speed={1} />
                        <Text>
                            {t('feature_promotion.modal.content.part_3')}
                        </Text>
                    </Flex>
                ) : (
                    <Stack>
                        {groupedChanges.spaces.total > 0 && (
                            <>
                                <Flex gap="sm">
                                    <MantineIcon
                                        icon={IconFolder}
                                        color="violet.8"
                                    />{' '}
                                    <Text fw={600}>
                                        {t(
                                            'feature_promotion.modal.groups.spaces',
                                        )}
                                        :{' '}
                                    </Text>{' '}
                                </Flex>
                                <PromotionChangesAccordion
                                    type="spaces"
                                    items={groupedChanges.spaces}
                                />
                            </>
                        )}

                        {groupedChanges.dashboards.total > 0 && (
                            <>
                                <Flex>
                                    <MantineIcon
                                        icon={IconLayoutDashboard}
                                        color="green.8"
                                    />{' '}
                                    <Text ml={10} fw={600}>
                                        {t(
                                            'feature_promotion.modal.groups.dashboards',
                                        )}
                                        :{' '}
                                    </Text>{' '}
                                </Flex>
                                <PromotionChangesAccordion
                                    type="dashboards"
                                    items={groupedChanges.dashboards}
                                />
                            </>
                        )}
                        {groupedChanges.charts.total > 0 && (
                            <>
                                <Flex>
                                    <MantineIcon
                                        icon={IconChartAreaLine}
                                        color="blue.7"
                                    />{' '}
                                    <Text ml={10} fw={600}>
                                        {t(
                                            'feature_promotion.modal.groups.charts',
                                        )}
                                        :{' '}
                                    </Text>{' '}
                                </Flex>
                                <PromotionChangesAccordion
                                    type="charts"
                                    items={groupedChanges.charts}
                                />
                            </>
                        )}

                        {totalChanges === 0 && (
                            <Text color="yellow.9" fw={600}>
                                {t('feature_promotion.modal.no_changes')}
                            </Text>
                        )}
                        {totalChanges !== 0 && withoutChanges > 0 && (
                            <Text color="yellow.9" fw={600}>
                                {t('feature_promotion.modal.without_changes')}
                            </Text>
                        )}
                    </Stack>
                )}
                <Group position="right" mt="sm">
                    <Button color="dark" variant="outline" onClick={onClose}>
                        {t('feature_promotion.modal.cancel')}
                    </Button>

                    <Button
                        color="green"
                        disabled={totalChanges === 0}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {t('feature_promotion.modal.promote')}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};
