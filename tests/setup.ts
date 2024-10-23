import '@testing-library/jest-dom';

import failOnConsole from 'vitest-fail-on-console';

failOnConsole({
    shouldFailOnDebug: true,
    shouldFailOnError: true,
    shouldFailOnInfo: false,
    shouldFailOnLog: false,
    shouldFailOnWarn: true,
});
