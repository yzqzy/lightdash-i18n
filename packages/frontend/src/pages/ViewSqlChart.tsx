import { isVizTableConfig } from '@lightdash/common';
import {
    Box,
    Group,
    Paper,
    SegmentedControl,
    Stack,
    Text,
} from '@mantine/core';
import { IconChartHistogram, IconTable } from '@tabler/icons-react';
import type { EChartsInstance } from 'echarts-for-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Provider } from 'react-redux';
import { useParams } from 'react-router';
import { ChartDataTable } from '../components/DataViz/visualizations/ChartDataTable';
import ChartView from '../components/DataViz/visualizations/ChartView';
import { Table } from '../components/DataViz/visualizations/Table';
import { ConditionalVisibility } from '../components/common/ConditionalVisibility';
import ErrorState from '../components/common/ErrorState';
import MantineIcon from '../components/common/MantineIcon';
import Page from '../components/common/Page/Page';
import { ChartDownload } from '../features/sqlRunner/components/Download/ChartDownload';
import ResultsDownloadButton from '../features/sqlRunner/components/Download/ResultsDownloadButton';
import { Header } from '../features/sqlRunner/components/Header';
import { useSavedSqlChartResults } from '../features/sqlRunner/hooks/useSavedSqlChartResults';
import { store } from '../features/sqlRunner/store';
import { useAppDispatch } from '../features/sqlRunner/store/hooks';
import {
    setProjectUuid,
    setSavedChartData,
} from '../features/sqlRunner/store/sqlRunnerSlice';

enum TabOption {
    CHART = 'chart',
    RESULTS = 'results',
    SQL = 'sql',
}

const ViewSqlChart = () => {
    const { t } = useTranslation();
    const params = useParams<{ projectUuid: string; slug?: string }>();
    const dispatch = useAppDispatch();
    const [activeTab, setActiveTab] = useState<TabOption>(TabOption.CHART);

    const [echartsInstance, setEchartsInstance] = useState<EChartsInstance>();

    const {
        chartQuery: {
            data: chartData,
            isLoading: isChartLoading,
            error: chartError,
        },
        chartResultsQuery: {
            data: chartResultsData,
            isLoading: isChartResultsLoading,
            error: chartResultsError,
            isFetching: isChartResultsFetching,
        },
        getDownloadQueryUuid,
    } = useSavedSqlChartResults({
        projectUuid: params.projectUuid,
        slug: params.slug,
    });

    // TODO: remove state sync - this is because the <Header /> component depends on the Redux state
    useEffect(() => {
        if (chartData) {
            dispatch(setSavedChartData(chartData));
        }
        if (params.projectUuid) {
            dispatch(setProjectUuid(params.projectUuid));
        }
    }, [dispatch, chartData, params.projectUuid]);

    return (
        <Page
            title={t('pages_view_sql_chart.title')}
            noContentPadding
            withFullHeight
            header={<Header mode="view" />}
        >
            <Paper
                shadow="none"
                radius={0}
                px="md"
                pb={0}
                pt="sm"
                sx={{
                    flex: 1,
                }}
            >
                <Stack h="100%">
                    <Group position="apart">
                        <Group position="apart">
                            <SegmentedControl
                                styles={(theme) => ({
                                    root: {
                                        backgroundColor: theme.colors.gray[2],
                                    },
                                })}
                                size="sm"
                                radius="md"
                                disabled={isChartResultsLoading}
                                data={[
                                    {
                                        value: TabOption.CHART,
                                        label: (
                                            <Group spacing="xs" noWrap>
                                                <MantineIcon
                                                    icon={IconChartHistogram}
                                                />
                                                <Text>
                                                    {t(
                                                        'pages_view_sql_chart.tabs.chart',
                                                    )}
                                                </Text>
                                            </Group>
                                        ),
                                    },
                                    {
                                        value: TabOption.RESULTS,
                                        label: (
                                            <Group spacing="xs" noWrap>
                                                <MantineIcon icon={IconTable} />
                                                <Text>
                                                    {t(
                                                        'pages_view_sql_chart.tabs.results',
                                                    )}
                                                </Text>
                                            </Group>
                                        ),
                                    },
                                ]}
                                value={activeTab}
                                onChange={(val: TabOption) => setActiveTab(val)}
                            />
                        </Group>
                        {(activeTab === TabOption.RESULTS ||
                            (activeTab === TabOption.CHART &&
                                isVizTableConfig(chartData?.config))) &&
                            params.projectUuid && (
                                <ResultsDownloadButton
                                    projectUuid={params.projectUuid}
                                    disabled={!chartResultsData}
                                    vizTableConfig={
                                        isVizTableConfig(chartData?.config)
                                            ? chartData.config
                                            : undefined
                                    }
                                    chartName={chartData?.name}
                                    totalResults={
                                        chartResultsData?.chartUnderlyingData
                                            ?.rows.length ?? 0
                                    }
                                    columnOrder={
                                        chartResultsData?.chartUnderlyingData
                                            ?.columns ?? []
                                    }
                                    getDownloadQueryUuid={getDownloadQueryUuid}
                                />
                            )}
                        {activeTab === TabOption.CHART && echartsInstance && (
                            <ChartDownload
                                echartsInstance={echartsInstance}
                                fileUrl={chartResultsData?.fileUrl}
                                columnNames={
                                    chartResultsData?.chartUnderlyingData
                                        ?.columns ?? []
                                }
                                chartName={chartData?.name}
                            />
                        )}
                    </Group>

                    {chartError && <ErrorState error={chartError.error} />}
                    {chartResultsError && (
                        <ErrorState error={chartResultsError.error} />
                    )}

                    {chartData && !isChartLoading && (
                        <Box
                            h="100%"
                            sx={{
                                position: 'relative',
                                flex: 1,
                            }}
                        >
                            <ConditionalVisibility
                                isVisible={activeTab === TabOption.CHART}
                            >
                                {
                                    <>
                                        {isVizTableConfig(chartData.config) &&
                                            chartResultsData && (
                                                <Table
                                                    resultsRunner={
                                                        chartResultsData.resultsRunner
                                                    }
                                                    columnsConfig={
                                                        chartData.config.columns
                                                    }
                                                    flexProps={{
                                                        mah: 'calc(100vh - 250px)',
                                                    }}
                                                />
                                            )}
                                        {!isVizTableConfig(chartData.config) &&
                                            params.slug &&
                                            chartData.sql && (
                                                <ChartView
                                                    config={chartData.config}
                                                    spec={
                                                        chartResultsData?.chartSpec
                                                    }
                                                    isLoading={
                                                        isChartLoading ||
                                                        isChartResultsFetching
                                                    }
                                                    error={
                                                        chartResultsError?.error
                                                    }
                                                    style={{ height: '100%' }}
                                                    onChartReady={
                                                        setEchartsInstance
                                                    }
                                                />
                                            )}
                                    </>
                                }
                            </ConditionalVisibility>
                            <ConditionalVisibility
                                isVisible={activeTab === TabOption.RESULTS}
                            >
                                {!isVizTableConfig(chartData.config) &&
                                    chartResultsData && (
                                        <ChartDataTable
                                            columnNames={
                                                chartResultsData
                                                    .chartUnderlyingData
                                                    ?.columns ?? []
                                            }
                                            rows={
                                                chartResultsData
                                                    .chartUnderlyingData
                                                    ?.rows ?? []
                                            }
                                            flexProps={{
                                                mah: '100%',
                                            }}
                                        />
                                    )}

                                {isVizTableConfig(chartData.config) &&
                                    chartResultsData && (
                                        <Table
                                            resultsRunner={
                                                chartResultsData.resultsRunner
                                            }
                                            columnsConfig={
                                                chartData.config.columns
                                            }
                                            flexProps={{
                                                mah: 'calc(100vh - 250px)',
                                            }}
                                        />
                                    )}
                            </ConditionalVisibility>
                        </Box>
                    )}
                </Stack>
            </Paper>
        </Page>
    );
};

const ViewSqlChartPage = () => {
    return (
        <Provider store={store}>
            <ViewSqlChart />
        </Provider>
    );
};
export default ViewSqlChartPage;
