import { type AiAgent, type AiAgentThreadSummary } from '@lightdash/common';
import {
    Box,
    Button,
    Center,
    Divider,
    Group,
    List,
    Loader,
    NavLink,
    Paper,
    Pill,
    Stack,
    Text,
    Title,
    Tooltip,
} from '@mantine-8/core';
import {
    IconArrowLeft,
    IconBrandSlack,
    IconChevronDown,
    IconClockEdit,
    IconDatabase,
    IconMessages,
    IconPlus,
} from '@tabler/icons-react';
import { type FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Outlet, useParams } from 'react-router';

import { LightdashUserAvatar } from '../../../components/Avatar';
import MantineIcon from '../../../components/common/MantineIcon';
import Page from '../../../components/common/Page/Page';
import { useProject } from '../../../hooks/useProject';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import useApp from '../../../providers/App/useApp';
import ClampedTextWithPopover from '../../features/aiCopilot/components/ClampedTextWithPopover';
import {
    useAiAgent,
    useAiAgentThreads,
} from '../../features/aiCopilot/hooks/useOrganizationAiAgents';

const INITIAL_MAX_THREADS = 10;
const MAX_THREADS_INCREMENT = 10;

type ThreadNavLinkProps = {
    thread: AiAgentThreadSummary;
    isActive: boolean;
    projectUuid: string;
};

const ThreadNavLink: FC<ThreadNavLinkProps> = ({
    thread,
    isActive,
    projectUuid,
}) => {
    const { t } = useTranslation();

    return (
        <NavLink
            color="gray"
            component={Link}
            key={thread.uuid}
            to={`/projects/${projectUuid}/ai-agents/${thread.agentUuid}/threads/${thread.uuid}`}
            px="xs"
            py={4}
            mx={-8}
            style={(theme) => ({
                borderRadius: theme.radius.sm,
            })}
            label={
                <Text truncate="end" size="sm" c="gray.7">
                    {thread.firstMessage}
                </Text>
            }
            active={isActive}
            rightSection={
                thread.createdFrom === 'slack' && (
                    <Tooltip
                        label={t(
                            'ai_agents_page.threads_created_in_slack_are_read_only',
                        )}
                    >
                        <IconBrandSlack size={18} stroke={1} />
                    </Tooltip>
                )
            }
            viewTransition
        />
    );
};

const AgentPage = () => {
    const { t } = useTranslation();

    const { user } = useApp();
    const { agentUuid, threadUuid, projectUuid } = useParams();
    const { data: threads } = useAiAgentThreads(agentUuid);

    const { data: agent, isLoading: isLoadingAgent } = useAiAgent(agentUuid);
    const { data: project } = useProject(agent?.projectUuid);

    const updatedAt = agent?.updatedAt ? new Date(agent.updatedAt) : new Date();
    const updatedTimeAgo = useTimeAgo(updatedAt);

    const [showMaxItems, setShowMaxItems] = useState(INITIAL_MAX_THREADS);

    if (isLoadingAgent) {
        return (
            <Page withFullHeight>
                <Center h="100%">
                    <Loader color="gray" />
                </Center>
            </Page>
        );
    }

    if (!agent) {
        return <Navigate to={`/projects/${projectUuid}/ai-agents`} />;
    }

    return (
        <Page
            sidebar={
                <Stack gap="xl" align="stretch">
                    <Stack align="flex-start" gap="xs">
                        <Button
                            size="compact-xs"
                            variant="subtle"
                            component={Link}
                            to={`/projects/${projectUuid}/ai-agents`}
                            leftSection={<MantineIcon icon={IconArrowLeft} />}
                            style={{
                                root: {
                                    border: 'none',
                                },
                            }}
                        >
                            {t('ai_agents_page.all_agents')}
                        </Button>
                        <Group>
                            <LightdashUserAvatar
                                size="md"
                                variant="filled"
                                name={agent.name || 'AI'}
                                src={agent.imageUrl}
                            />
                            <Title order={3}>{agent.name}</Title>
                        </Group>
                        <List spacing="xxs" size="sm" c="dimmed" center>
                            <List.Item icon={<IconClockEdit size={16} />}>
                                {t('ai_agents_page.last_updated')}{' '}
                                <Tooltip
                                    label={updatedAt.toLocaleString()}
                                    withinPortal
                                >
                                    <span>{updatedTimeAgo}</span>
                                </Tooltip>
                            </List.Item>
                            <List.Item icon={<IconMessages size={16} />}>
                                {threads?.length || 0}{' '}
                                {t('ai_agents_page.threads')}
                            </List.Item>
                        </List>
                    </Stack>
                    <Group gap="sm">
                        <Button
                            variant="dark"
                            leftSection={<IconPlus size={16} />}
                            component={Link}
                            size="xs"
                            to={`/projects/${projectUuid}/ai-agents/${agent.uuid}/threads`}
                        >
                            {t('ai_agents_page.new_thread')}
                        </Button>
                        {user?.data?.ability.can('manage', 'AiAgent') && (
                            <Button
                                variant="default"
                                size="xs"
                                component={Link}
                                to={`/generalSettings/aiAgents/${agent.uuid}`}
                            >
                                {t('ai_agents_page.settings')}
                            </Button>
                        )}
                    </Group>
                    <Divider variant="dashed" />
                    {agent.instruction && (
                        <Stack gap="xs">
                            <Title order={6}>
                                {t('ai_agents_page.instructions')}
                            </Title>
                            <Paper p="xs" bg="gray.0" c="gray.7">
                                <ClampedTextWithPopover>
                                    {agent.instruction}
                                </ClampedTextWithPopover>
                            </Paper>
                        </Stack>
                    )}

                    {project && (
                        <Stack gap="xs">
                            <Title order={6}>
                                {t('ai_agents_page.lightdash_data_sources')}
                            </Title>
                            <Paper p="xs" c="gray.7">
                                <Group gap="xs">
                                    <IconDatabase size={16} />
                                    {project.name}
                                </Group>
                            </Paper>
                            {agent.tags && (
                                <Group gap="xxs">
                                    {agent.tags.map((tag, i) => (
                                        <Pill key={i} size="sm">
                                            {tag}
                                        </Pill>
                                    ))}
                                </Group>
                            )}
                        </Stack>
                    )}

                    {projectUuid && threads && threads.length > 0 && (
                        <Stack gap="xs">
                            <Title order={6}>
                                {t('ai_agents_page.threads')}
                            </Title>
                            <Stack gap={2}>
                                {threads
                                    .slice(0, showMaxItems)
                                    .map((thread) => (
                                        <ThreadNavLink
                                            key={thread.uuid}
                                            thread={thread}
                                            isActive={
                                                thread.uuid === threadUuid
                                            }
                                            projectUuid={projectUuid}
                                        />
                                    ))}
                            </Stack>
                            <Box>
                                {threads.length >= showMaxItems && (
                                    <Button
                                        mx={-8}
                                        size="compact-xs"
                                        variant="subtle"
                                        onClick={() =>
                                            setShowMaxItems(
                                                (s) =>
                                                    s + MAX_THREADS_INCREMENT,
                                            )
                                        }
                                        leftSection={
                                            <MantineIcon
                                                icon={IconChevronDown}
                                            />
                                        }
                                        style={{
                                            root: {
                                                border: 'none',
                                            },
                                        }}
                                    >
                                        {t('ai_agents_page.view_more')}
                                    </Button>
                                )}
                            </Box>
                        </Stack>
                    )}
                </Stack>
            }
        >
            <Outlet context={{ agent }} />
        </Page>
    );
};

export interface AgentContext {
    agent: AiAgent;
}

export default AgentPage;
