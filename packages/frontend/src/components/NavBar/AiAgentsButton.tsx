import { CommercialFeatureFlags } from '@lightdash/common';
import { Button } from '@mantine/core';
import { IconMessageCircleStar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useActiveProject } from '../../hooks/useActiveProject';
import { useFeatureFlag } from '../../hooks/useFeatureFlagEnabled';
import useApp from '../../providers/App/useApp';
import MantineIcon from '../common/MantineIcon';

export const AiAgentsButton = () => {
    const { t } = useTranslation();

    // Using `navigate` instead of the `Link` component to ensure round corners within a button group
    const navigate = useNavigate();

    const { data: project } = useActiveProject();
    const appQuery = useApp();
    const aiCopilotFlagQuery = useFeatureFlag(CommercialFeatureFlags.AiCopilot);
    const aiAgentFlagQuery = useFeatureFlag(CommercialFeatureFlags.AiAgent);

    if (
        !appQuery.user.isSuccess ||
        !aiCopilotFlagQuery.isSuccess ||
        !aiAgentFlagQuery.isSuccess
    ) {
        return null;
    }

    const canViewAiAgents = appQuery.user.data.ability.can('view', 'AiAgent');
    const isAiCopilotEnabled = aiCopilotFlagQuery.data.enabled;
    const isAiAgentEnabled = aiAgentFlagQuery.data.enabled;

    if (
        !canViewAiAgents ||
        !isAiCopilotEnabled ||
        !isAiAgentEnabled ||
        !project
    ) {
        return null;
    }

    return (
        <Button
            size="xs"
            variant="default"
            fz="sm"
            leftIcon={
                <MantineIcon icon={IconMessageCircleStar} color="#adb5bd" />
            }
            onClick={() => navigate(`/projects/${project}/ai-agents`)}
        >
            {t('components_navbar_ai_agents_button.ask_ai')}
        </Button>
    );
};
