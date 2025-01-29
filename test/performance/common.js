import http from 'k6/http';
import { check } from 'k6';

export const STAGE_DURATION_WITH_UNIT = __ENV.STAGE_DURATION + 's';
export const PREALLOACATED_VUS = __ENV.PREALLOACATED_VUS ?? 150;
let URL = `${__ENV.BASE_URL}/ACO/accueil@4.0.0-rc3/build/micro-front-main.js`;
const URL_CATALOG = `${__ENV.BASE_URL}/?catalog`

// console.log("--------------------")
// console.log({ __ENV })
// console.log("--------------------")



export const commonOptions = {
  insecureSkipTLSVerify: __ENV.SKIP_TLS_VERIFY ?? false,
}

export const thresholds = {
  http_req_failed: ['rate<0.0001'], // http errors should be less than 1%
}

export const _checkRequiredEnvVars = (requiredEnvVars) => {
  for (const envVar of requiredEnvVars) {
    if (!__ENV[envVar]) {
      throw new Error(`Environment variable ${envVar} is missing`);
    }
  }
}

export const _setup = () => {
  const res = http.get(URL_CATALOG);
  check(res, { 'status was 200': (r) => r.status == 200 });
  // make sure catalog fetch takes less than 10s
  check(res, { 'status was 200': (r) => r.timings.duration < 10000 });

}

export const _main = () => {
  const res = http.get(URL);
  check(res, { 'status was 200': (r) => r.status == 200 });
}
