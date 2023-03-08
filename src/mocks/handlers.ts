import { rest } from 'msw';

export const handlers = [
    rest.get(`/api/get-hello`, (_req, res, ctx) => res(ctx.json({ result: 'Mocks enabled 👍' }))),
];
