import { _setup, _main, commonOptions, thresholds, PREALLOACATED_VUS, STAGE_DURATION_WITH_UNIT, _checkRequiredEnvVars, commonOptions } from './common.js';

_checkRequiredEnvVars([
  "BASE_URL",
  "STAGE_DURATION",
  "STRESS_LOAD_MIN_ITER_PER_SEC",
  "STRESS_LOAD_MAX_ITER_PER_SEC",
  "STRESS_LOAD_DURATION_95"
])

const STRESS_LOAD_MIN_ITER_PER_SEC = __ENV.STRESS_LOAD_MIN_ITER_PER_SEC
const STRESS_LOAD_MAX_ITER_PER_SEC = __ENV.STRESS_LOAD_MAX_ITER_PER_SEC
const STRESS_LOAD_DURATION_95 = __ENV.STRESS_LOAD_DURATION_95

const stressLoadStages = new Array(Math.round((STRESS_LOAD_MAX_ITER_PER_SEC - STRESS_LOAD_MIN_ITER_PER_SEC)) / 10).fill(0).map((_, i) => {
  return { duration: STAGE_DURATION_WITH_UNIT, target: STRESS_LOAD_MIN_ITER_PER_SEC + i * 10 }
})

export const options = {
  ...commonOptions,
  scenarios: {
    stressLoad: {
      executor: 'ramping-arrival-rate',
      exec: 'main',
      preAllocatedVUs: PREALLOACATED_VUS,
      gracefulStop: "0s",
      stages: stressLoadStages,
      tags: { test_type: 'stressLoad' },
    },
  },
  thresholds: {
    ...thresholds,
    'http_req_duration{test_type:stressLoad}': [`p(95)< ${STRESS_LOAD_DURATION_95}`], // 95% of requests should be below 200ms
  }
}

export const setup = _setup

export const main = _main
