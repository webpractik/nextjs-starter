// eslint-disable-next-line import/no-extraneous-dependencies
import { setupWorker } from 'msw';

import { handlers } from '@/mocks/handlers';

export const worker = setupWorker(...handlers);
