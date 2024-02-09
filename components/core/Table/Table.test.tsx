import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from './Table';

describe('<Table />', () => {
    describe('Table Component', () => {
        it('renders the table component', () => {
            render(<Table />);
            const table = screen.getByRole('table');
            expect(table).toBeInTheDocument();
        });

        it('renders table with all subcomponents', () => {
            render(
                <Table>
                    <TableCaption>Caption</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Header</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>Cell</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell>Footer Cell</TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            );
            expect(screen.getByText('Caption')).toBeInTheDocument();
            expect(screen.getByText('Header')).toBeInTheDocument();
            expect(screen.getByText('Cell')).toBeInTheDocument();
            expect(screen.getByText('Footer Cell')).toBeInTheDocument();
        });

        it('forwards ref correctly to the table', () => {
            const ref = { current: null };
            render(<Table ref={ref} />);
            // eslint-disable-next-line xss/no-mixed-html
            expect(ref.current).toBeInstanceOf(HTMLTableElement);
        });
    });
});
