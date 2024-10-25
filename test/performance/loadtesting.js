// Discover how the system functions with sudden and massive increases in traffic.

import http from 'k6/http';
import { check } from 'k6';

/********************
 * Environment variables
 *
 * @env BASE_URL
 * @env STAGE_DURATION
 * @env AVERAGE_LOAD_ITER_PER_SEC
 * @env AVERAGE_LOAD_ITER_VARIATION
 * @env AUTOSCALING_ITER_PER_SEC
 * @env STRESS_LOAD_MIN_ITER_PER_SEC
 * @env STRESS_LOAD_MAX_ITER_PER_SEC
 */


// const URL_CATALOG = "https://swap-dev.int.nbyt.fr/?catalog"

// const BASE_URL = __ENV.BASE_URL
// const STAGE_DURATION = __ENV.STAGE_DURATION
// const AVERAGE_LOAD_ITER_PER_SEC = __ENV.AVERAGE_LOAD_ITER_PER_SEC
// const AVERAGE_LOAD_ITER_VARIATION = __ENV.AVERAGE_LOAD_ITER_VARIATION
// const AUTOSCALING_ITER_PER_SEC = __ENV.AUTOSCALING_ITER_PER_SEC
// const STRESS_LOAD_MIN_ITER_PER_SEC = __ENV.STRESS_LOAD_MIN_ITER_PER_SEC
// const STRESS_LOAD_MAX_ITER_PER_SEC = __ENV.STRESS_LOAD_MAX_ITER_PER_SEC


/** TO SKIP SETTING ALL ENV VARIABLES */
const BASE_URL = __ENV.BASE_URL ?? 'http://localhost:45537'
const STAGE_DURATION = __ENV.STAGE_DURATION ?? 30;
const AVERAGE_LOAD_ITER_PER_SEC = __ENV.AVERAGE_LOAD_ITER_PER_SEC ?? 10;
const AVERAGE_LOAD_ITER_VARIATION = __ENV.AVERAGE_LOAD_ITER_VARIATION ?? 10;
const AUTOSCALING_ITER_PER_SEC = __ENV.AUTOSCALING_ITER_PER_SEC ?? 10;
const STRESS_LOAD_MIN_ITER_PER_SEC = __ENV.STRESS_LOAD_MIN_ITER_PER_SEC ?? 10;
const STRESS_LOAD_MAX_ITER_PER_SEC = __ENV.STRESS_LOAD_MAX_ITER_PER_SEC ?? 20;
/** END TO SKIP SETTING ALL ENV VARIABLES */

if (!__ENV.BASE_URL || !__ENV.STAGE_DURATION || !__ENV.AVERAGE_LOAD_ITER_PER_SEC || !__ENV.AVERAGE_LOAD_ITER_VARIATION || !__ENV.AUTOSCALING_ITER_PER_SEC || !__ENV.STRESS_LOAD_MIN_ITER_PER_SEC || !__ENV.STRESS_LOAD_MAX_ITER_PER_SEC) {
  throw new Error('One or more environment variables are not specified');
}

const STAGE_DURATION_WITH_UNIT = STAGE_DURATION + 's';



const averageLoadStages = [
  // With this executor it will increase from 0 to `AVERAGE_LOAD_ITER_PER_SEC` iterations/s within the first `STAGE_DURATION_WITH_UNIT`
  // Then will go from AVERAGE_LOAD_ITER_VARIATION iter/s to AVERAGE_LOAD_ITER_VARIATION + AVERAGE_LOAD_ITER_PER_SEC iter/s within the next 30secs
  // then will stay at 100 iter/s for 30secs
  // finally will go from 100 iter/s to 50 iter/s within the next 30secs
  // it only reaches the target at the end of the duration
  { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: __ENV.AVERAGE_LOAD_ITER_PER_SEC },
  { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: __ENV.AVERAGE_LOAD_ITER_VARIATION + AVERAGE_LOAD_ITER_PER_SEC },
  { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: __ENV.AVERAGE_LOAD_ITER_PER_SEC - AVERAGE_LOAD_ITER_VARIATION },
  { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: __ENV.AVERAGE_LOAD_ITER_PER_SEC },
]

const autoscalingStages = [
  { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: 20 },
  { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: 50 },
  { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: 100 },
  { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: 50 },
  { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: 20 },

]

const stressLoadStages = new Array(Math.round((STRESS_LOAD_MAX_ITER_PER_SEC - STRESS_LOAD_MIN_ITER_PER_SEC)) / 10).fill(0).map((_, i) => {
  return { duration: STAGE_DURATION_WITH_UNIT, target: STRESS_LOAD_MIN_ITER_PER_SEC + i * 10 }
})

console.log({ stressLoadStages })

// const stressLoadStages = [
//   { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: 20 },
//   { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: 30 },
//   { duration: __ENV.STAGE_DURATION_WITH_UNIT, target: 40 },
// ]

export const options = {
  scenarios: {
    // averageLoad: {
    //   exec: 'main',
    //   executor: 'ramping-arrival-rate',
    //   preAllocatedVUs: 100,
    //   startTime: '0s',
    //   gracefulStop: "0s",
    //   stages: averageLoadStages,
    //   tags: { test_type: 'averageLoad' },
    // },
    // autoscaling: {
    //   exec: 'main',
    //   executor: 'ramping-arrival-rate',
    //   preAllocatedVUs: 150,
    //   // only way to run scenarios sequentially
    //   startTime: STAGE_DURATION * averageLoadStages.length + 's',
    //   gracefulStop: "0s",
    //   stages: autoscalingStages,
    //   tags: { test_type: 'autoscaling' },
    // },
    stressLoad: {
      executor: 'ramping-arrival-rate',
      exec: 'main',
      // startTime: STAGE_DURATION * (averageLoadStages.length + autoscalingStages.length) + 's',
      preAllocatedVUs: 150,
      gracefulStop: "0s",
      stages: stressLoadStages,
      tags: { test_type: 'stressLoad' },
    },

  },
  thresholds: {
    http_req_failed: ['rate<0.0001'], // http errors should be less than 1%
    http_req_duration: ['p(95)<200'], // 95% of requests should be below 200ms
    'http_req_duration{test_type:stressLoad}': ['p(95)<1000'], // 95% of requests should be below 200ms
  },
};

export function _setup() {
  const res = http.get(URL_CATALOG);
  check(res, { 'status was 200': (r) => r.status == 200 });
  // make sure catalog fetch takes less than 10s
  check(res, { 'status was 200': (r) => r.timings.duration < 10000 });

}

export function _main() {
  const res = http.get(URL);
  check(res, { 'status was 200': (r) => r.status == 200 });
}
