import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

describe('<TooltipContent />', () => {
    const setup = () => {
        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip text</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
        const trigger = screen.getByText('Hover me');
        return { trigger };
    };

    it('renders without crashing', () => {
        const { trigger } = setup();
        expect(trigger).toBeInTheDocument();
    });

    it('shows tooltip content on hover', async () => {
        const { trigger } = setup();
        await userEvent.hover(trigger);
        expect(await screen.findByRole('tooltip', { name: 'Tooltip text' })).toBeVisible();
    });

    it('shows tooltip content on focus', async () => {
        const { trigger } = setup();
        trigger.tabIndex = 0;
        fireEvent.focus(trigger);
        expect(await screen.findByRole('tooltip', { name: 'Tooltip text' })).toBeVisible();
    });
});
