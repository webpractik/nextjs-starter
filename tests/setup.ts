import '@testing-library/jest-dom/vitest';

import failOnConsole from 'vitest-fail-on-console';

failOnConsole({
    shouldFailOnDebug: true,
    shouldFailOnError: true,
    shouldFailOnInfo: false,
    shouldFailOnLog: false,
    shouldFailOnWarn: true,
});
