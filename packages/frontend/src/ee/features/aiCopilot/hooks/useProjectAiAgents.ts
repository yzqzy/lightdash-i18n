import type {
    ApiAiAgentResponse,
    ApiAiAgentSummaryResponse,
    ApiError,
} from '@lightdash/common';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { lightdashApi } from '../../../../api';
import useToaster from '../../../../hooks/toaster/useToaster';

const PROJECT_AI_AGENTS_KEY = 'projectAiAgents';

const listProjectAgents = (projectUuid: string) =>
    lightdashApi<ApiAiAgentSummaryResponse['results']>({
        version: 'v1',
        url: `/projects/${projectUuid}/aiAgents`,
        method: 'GET',
        body: undefined,
    });

const getProjectAgent = async (
    projectUuid: string,
    agentUuid: string,
): Promise<ApiAiAgentResponse['results']> =>
    lightdashApi<ApiAiAgentResponse['results']>({
        version: 'v1',
        url: `/projects/${projectUuid}/aiAgents/${agentUuid}`,
        method: 'GET',
        body: undefined,
    });

export const useProjectAiAgents = (projectUuid: string | undefined) => {
    const { showToastApiError } = useToaster();
    const { t } = useTranslation();

    return useQuery<ApiAiAgentSummaryResponse['results'], ApiError>({
        queryKey: [PROJECT_AI_AGENTS_KEY, projectUuid],
        queryFn: () => listProjectAgents(projectUuid!),
        onError: (error) => {
            showToastApiError({
                title: t(
                    'features_ai_copilot_project_hooks.failed_to_fetch_agents',
                ),
                apiError: error.error,
            });
        },
        enabled: !!projectUuid,
    });
};

export const useProjectAiAgent = (
    projectUuid: string | undefined,
    agentUuid: string | undefined,
) => {
    const { showToastApiError } = useToaster();
    const { t } = useTranslation();

    return useQuery<ApiAiAgentResponse['results'], ApiError>({
        queryKey: [PROJECT_AI_AGENTS_KEY, projectUuid, agentUuid],
        queryFn: () => getProjectAgent(projectUuid!, agentUuid!),
        onError: (error) => {
            showToastApiError({
                title: t(
                    'features_ai_copilot_project_hooks.failed_to_fetch_project_agent',
                ),
                apiError: error.error,
            });
        },
        enabled: !!projectUuid && !!agentUuid,
    });
};
