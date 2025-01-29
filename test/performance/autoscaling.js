import { _setup, _main, thresholds, PREALLOACATED_VUS, STAGE_DURATION_WITH_UNIT, commonOptions } from './common.js';

_checkRequiredEnvVars([
  'BASE_URL',
  'STAGE_DURATION',
  'AUTOSCALING_MAX_ITER_PER_SEC',
  'AUTOSCALING_DURATION_95'
])

const AUTOSCALING_MAX_ITER_PER_SEC = __ENV.AUTOSCALING_MAX_ITER_PER_SEC
const AUTOSCALING_DURATION_95 = __ENV.AUTOSCALING_DURATION_95

const minTarget = Math.round(AUTOSCALING_MAX_ITER_PER_SEC / 5)
const midTarget = Math.round(AUTOSCALING_MAX_ITER_PER_SEC / 2)

const autoscalingStages = [
  { duration: STAGE_DURATION_WITH_UNIT, target: minTarget },
  { duration: STAGE_DURATION_WITH_UNIT, target: midTarget },
  { duration: STAGE_DURATION_WITH_UNIT, target: AUTOSCALING_MAX_ITER_PER_SEC },
  { duration: STAGE_DURATION_WITH_UNIT, target: midTarget },
  { duration: STAGE_DURATION_WITH_UNIT, target: minTarget },

]

export const options = {
  ...commonOptions,
  scenarios: {
    autoscaling: {
      exec: 'main',
      executor: 'ramping-arrival-rate',
      preAllocatedVUs: PREALLOACATED_VUS,
      gracefulStop: "0s",
      stages: autoscalingStages,
      tags: { test_type: 'autoscaling' },
    },
  },
  thresholds: {
    ...thresholds,
    'http_req_duration{test_type:autoscaling}': [`p(95)< ${AUTOSCALING_DURATION_95}`], // 95% of requests should be below 200ms
  }
}

export const setup = _setup

export const main = _main
