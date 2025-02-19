import * as React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import debounce from 'lodash/debounce';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';

import Can from 'components/Can';
import FlowRow from 'components/FlowRow';
import NoResultFound from 'components/NoResultFound';
import ConditionalIconButton from 'components/ConditionalIconButton';
import Container from 'components/Container';
import PageTitle from 'components/PageTitle';
import SearchInput from 'components/SearchInput';
import useFormatMessage from 'hooks/useFormatMessage';
import useCurrentUserAbility from 'hooks/useCurrentUserAbility';
import * as URLS from 'config/urls';
import useLazyFlows from 'hooks/useLazyFlows';

export default function Flows() {
  const formatMessage = useFormatMessage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '', 10) || 1;
  const flowName = searchParams.get('flowName') || '';
  const [isLoading, setIsLoading] = React.useState(true);
  const currentUserAbility = useCurrentUserAbility();

  const {
    data,
    mutate: fetchFlows,
    isSuccess,
  } = useLazyFlows(
    { flowName, page },
    {
      onSettled: () => {
        setIsLoading(false);
      },
    },
  );

  const flows = data?.data || [];
  const pageInfo = data?.meta;
  const hasFlows = flows?.length;
  const navigateToLastPage = isSuccess && !hasFlows && page > 1;

  const onSearchChange = React.useCallback((event) => {
    setSearchParams({ flowName: event.target.value });
  }, []);

  const getPathWithSearchParams = (page, flowName) => {
    const searchParams = new URLSearchParams();

    if (page > 1) {
      searchParams.set('page', page);
    }
    if (flowName) {
      searchParams.set('flowName', flowName);
    }

    return { search: searchParams.toString() };
  };

  const onDuplicateFlow = () => {
    if (pageInfo?.currentPage > 1) {
      navigate(getPathWithSearchParams(1, flowName));
    } else {
      fetchFlows();
    }
  };

  const fetchData = React.useMemo(
    () => debounce(fetchFlows, 300),
    [fetchFlows],
  );

  React.useEffect(() => {
    setIsLoading(true);

    fetchData({ flowName, page });

    return () => {
      fetchData.cancel();
    };
  }, [fetchData, flowName, page]);

  React.useEffect(
    function redirectToLastPage() {
      if (navigateToLastPage) {
        navigate(getPathWithSearchParams(pageInfo.totalPages, flowName));
      }
    },
    [navigateToLastPage],
  );

  return (
    <Box sx={{ py: 3 }}>
      <Container>
        <Grid container sx={{ mb: [0, 3] }} columnSpacing={1.5} rowSpacing={3}>
          <Grid container item xs sm alignItems="center" order={{ xs: 0 }}>
            <PageTitle>{formatMessage('flows.title')}</PageTitle>
          </Grid>

          <Grid item xs={12} sm="auto" order={{ xs: 2, sm: 1 }}>
            <SearchInput onChange={onSearchChange} defaultValue={flowName} />
          </Grid>

          <Grid
            container
            item
            xs="auto"
            sm="auto"
            alignItems="center"
            order={{ xs: 1, sm: 2 }}
          >
            <Can I="create" a="Flow" passThrough>
              {(allowed) => (
                <ConditionalIconButton
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  component={Link}
                  fullWidth
                  disabled={!allowed}
                  icon={<AddIcon />}
                  to={URLS.CREATE_FLOW}
                  data-test="create-flow-button"
                >
                  {formatMessage('flows.create')}
                </ConditionalIconButton>
              )}
            </Can>
          </Grid>
        </Grid>

        <Divider sx={{ mt: [2, 0], mb: 2 }} />
        {(isLoading || navigateToLastPage) && (
          <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />
        )}
        {!isLoading &&
          flows?.map((flow) => (
            <FlowRow
              key={flow.id}
              flow={flow}
              onDuplicateFlow={onDuplicateFlow}
              onDeleteFlow={fetchFlows}
            />
          ))}
        {!isLoading && !navigateToLastPage && !hasFlows && (
          <NoResultFound
            text={formatMessage('flows.noFlows')}
            {...(currentUserAbility.can('create', 'Flow') && {
              to: URLS.CREATE_FLOW,
            })}
          />
        )}
        {!isLoading &&
          !navigateToLastPage &&
          pageInfo &&
          pageInfo.totalPages > 1 && (
            <Pagination
              sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
              page={pageInfo?.currentPage}
              count={pageInfo?.totalPages}
              renderItem={(item) => (
                <PaginationItem
                  component={Link}
                  to={getPathWithSearchParams(item.page, flowName)}
                  {...item}
                />
              )}
            />
          )}
      </Container>
    </Box>
  );
}
