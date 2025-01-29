
# Performance Metrics Documentation

## How to use it

The default to use it is by running the docker image `bouyguestelecom/a7-perf`
If no command is provided the average load test will be executed.

There 3 k6 scripts available in the image:

- `average-load.js`
- `stressload.js`
- `autoscaling.js`

to run another script you can use the following command (adjust the env variable for your needs):

```bash
docker run bouyguestelecom/a7-perf k6 run <script_name>
```

## Env variables

| Metric Name                          | Description                                                                 | Required | Default |
|--------------------------------------|-----------------------------------------------------------------------------|----------|---------|
| **BASE_URL**                         | The base URL for the application, used for API calls and resource fetching. | Yes      | N/A     |
| **STAGE_DURATION**                   | The total duration of each stage in the performance testing process, measured in seconds. | Yes      | N/A     |
| **STRESS_LOAD_MIN_ITER_PER_SEC**    | The minimum number of iterations per second during stress load testing.    | Yes      | N/A     |
| **STRESS_LOAD_MAX_ITER_PER_SEC**    | The maximum number of iterations per second during stress load testing.    | Yes      | N/A     |
| **STRESS_LOAD_DURATION_95**         | The 95th percentile duration of stress load tests, indicating the time taken for 95% of the requests. | Yes      | N/A     |
| **AUTOSCALING_MAX_ITER_PER_SEC**    | The maximum iterations per second allowed during autoscaling operations.    | Yes      | N/A     |
| **AUTOSCALING_DURATION_95**         | The 95th percentile duration for autoscaling events, reflecting the time taken for 95% of autoscaling actions. | Yes      | N/A     |
| **AVERAGE_LOAD_ITER_PER_SEC**       | The average number of iterations per second during normal load conditions.  | Yes      | N/A     |
| **AVERAGE_LOAD_ITER_VARIATION**     | The variation in iterations per second during average load conditions, indicating stability or fluctuations. | Yes      | N/A     |
| **AVERAGE_LOAD_DURATION_95**        | The 95th percentile duration for average load conditions, showing the time taken for 95% of requests under normal load. | Yes      | N/A     |
| **PREALLOACATED_VUS**                | The number of virtual users preallocated for performance testing, used to simulate load conditions. | No      | 150     |
| **SKIP_TLS_VERIFY**                  | A flag to skip TLS verification during API calls, useful for testing in development environments. | No       | False   |
