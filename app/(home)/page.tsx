import { Button } from 'core/Button';
import { Flex } from 'core/Flex';
import { Input } from 'core/Input';
import { Logo } from 'core/Logo';
import { Typography } from 'core/Typography';
import React from 'react';
import StoreInitializer from 'shared/utilities/StoreInitializer';

import Counter from '@/(home)/_components/Counter';
import CounterButtons from '@/(home)/_components/CounterButtons';
import CounterRSC from '@/(home)/_components/CounterRSC';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '~/components/ui/select';
import { useGlobalStore } from '~/lib/stores/Global';

const DEFAULT_STATE = { count: 7 };

export default function HomePage() {
    // server-side store initialization
    useGlobalStore.setState(DEFAULT_STATE);

    return (
        <Flex flexDirection="column" justifyContent="center" alignItems="center" gap="2.5rem">
            <Logo />

            <Typography variant="h1">Next Starter</Typography>

            <Flex width="50%">
                <Typography center variant="p" color="secondary">
                    Этот стартовый комплект нацелен на предоставление разработчикам надежной основы
                    для создания приложений на Next.js, обеспечивая соблюдение лучших практик по
                    качеству кода, стилю и эффективности рабочих процессов.
                </Typography>
            </Flex>

            <Button variant="primary">
                <a href="#">
                    <span>💼</span> Документация
                </a>
            </Button>

            <Flex flexDirection="column" alignItems="center" gap="1rem">
                <Flex gap=".5rem">
                    <Checkbox id="theme" />
                    <Label htmlFor="theme">Theme</Label>
                </Flex>

                <Input placeholder="text" />

                <Select>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                </Select>
            </Flex>

            <Flex flexDirection="column" gap="1rem" alignItems="center">
                {/* client-side store initialization */}
                <StoreInitializer initialState={DEFAULT_STATE} />

                <Counter />

                <CounterRSC />

                <CounterButtons />
            </Flex>
        </Flex>
    );
}
