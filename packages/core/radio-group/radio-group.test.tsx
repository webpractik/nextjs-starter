import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { RadioGroup, RadioGroupItem } from './radio-group';

describe('<RadioGroup />', () => {
    const stateAttribute = 'data-state';

    it('renders RadioGroup with RadioGroupItems', () => {
        render(
            <RadioGroup>
                <RadioGroupItem data-testid="option1" value="option1" />
                <RadioGroupItem data-testid="option2" value="option2" />
            </RadioGroup>
        );

        expect(screen.getByTestId('option1')).toBeInTheDocument();
        expect(screen.getByTestId('option1')).toBeInTheDocument();
    });

    it('allows selecting different RadioGroupItems', async () => {
        const user = userEvent.setup();

        render(
            <RadioGroup>
                <RadioGroupItem data-testid="option1" value="option1" />
                <RadioGroupItem data-testid="option2" value="option2" />
            </RadioGroup>
        );

        const option1 = screen.getByTestId('option1');
        const option2 = screen.getByTestId('option2');

        await user.click(option1);
        expect(option1).toHaveAttribute(stateAttribute, 'checked');
        expect(option2).not.toHaveAttribute(stateAttribute, 'checked');

        await user.click(option2);
        expect(option2).toHaveAttribute(stateAttribute, 'checked');
        expect(option1).not.toHaveAttribute(stateAttribute, 'checked');
    });

    it('does not allow selecting a disabled RadioGroupItem', async () => {
        const user = userEvent.setup();

        render(
            <RadioGroup>
                <RadioGroupItem data-testid="option1" value="option1">
                    Option 1
                </RadioGroupItem>
                <RadioGroupItem data-testid="option2" disabled value="option2">
                    Option 2
                </RadioGroupItem>
            </RadioGroup>
        );

        const option2 = screen.getByTestId('option2');

        await user.click(option2);

        expect(option2).not.toHaveAttribute(stateAttribute, 'checked');
    });

    it('selects the RadioGroupItem based on controlled value', async () => {
        const user = userEvent.setup();

        function ControlledRadioGroup() {
            const [value, setValue] = useState('option1');

            return (
                <RadioGroup onValueChange={setValue} value={value}>
                    <RadioGroupItem data-testid="option1" value="option1">
                        Option 1
                    </RadioGroupItem>
                    <RadioGroupItem data-testid="option2" value="option2">
                        Option 2
                    </RadioGroupItem>
                </RadioGroup>
            );
        }

        render(<ControlledRadioGroup />);

        const option1 = screen.getByTestId('option1');
        const option2 = screen.getByTestId('option2');

        expect(option1).toHaveAttribute(stateAttribute, 'checked');

        await user.click(option2);

        expect(option2).toHaveAttribute(stateAttribute, 'checked');
    });
});
