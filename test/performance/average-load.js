import { _setup, _main, commonOptions, thresholds, PREALLOACATED_VUS, STAGE_DURATION_WITH_UNIT, _checkRequiredEnvVars } from './common.js';


_checkRequiredEnvVars([
  'BASE_URL',
  'STAGE_DURATION',
  'AVERAGE_LOAD_ITER_PER_SEC',
  'AVERAGE_LOAD_ITER_VARIATION',
  'AVERAGE_LOAD_DURATION_95'
])

const AVERAGE_LOAD_ITER_PER_SEC = __ENV.AVERAGE_LOAD_ITER_PER_SEC
const AVERAGE_LOAD_ITER_VARIATION = __ENV.AVERAGE_LOAD_ITER_VARIATION
const AVERAGE_LOAD_DURATION_95 = __ENV.AVERAGE_LOAD_DURATION_95

const averageLoadStages = [
  // With this executor it will increase from 0 to `AVERAGE_LOAD_ITER_PER_SEC` iterations/s within the first `STAGE_DURATION_WITH_UNIT`
  // Then will go from AVERAGE_LOAD_ITER_VARIATION iter/s to AVERAGE_LOAD_ITER_VARIATION + AVERAGE_LOAD_ITER_PER_SEC iter/s within the next 30secs
  // then will stay at 100 iter/s for 30secs
  // finally will go from 100 iter/s to 50 iter/s within the next 30secs
  // it only reaches the target at the end of the duration
  { duration: STAGE_DURATION_WITH_UNIT, target: AVERAGE_LOAD_ITER_PER_SEC },
  { duration: STAGE_DURATION_WITH_UNIT, target: Number(AVERAGE_LOAD_ITER_VARIATION) + Number(AVERAGE_LOAD_ITER_PER_SEC) },
  { duration: STAGE_DURATION_WITH_UNIT, target: Number(AVERAGE_LOAD_ITER_PER_SEC) - Number(AVERAGE_LOAD_ITER_VARIATION) },
  { duration: STAGE_DURATION_WITH_UNIT, target: AVERAGE_LOAD_ITER_PER_SEC },
]

export const options = {
  ...commonOptions,
  scenarios: {
    averageLoad: {
      exec: 'main',
      executor: 'ramping-arrival-rate',
      preAllocatedVUs: PREALLOACATED_VUS,
      gracefulStop: "0s",
      stages: averageLoadStages,
      tags: { test_type: 'averageLoad' },
    },
  },
  thresholds: {
    ...thresholds,
    'http_req_duration{test_type:averageLoad}': [`p(95)< ${AVERAGE_LOAD_DURATION_95}`], // 95% of requests should be below 200ms
  }
}

export const setup = _setup

export const main = _main
