import { QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { Box } from 'core/Box';
import { Button } from 'core/Button';
import { Checkbox } from 'core/Checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from 'core/Dialog';
import { Grid } from 'core/Grid';
import { Input } from 'core/Input';
import { Label } from 'core/Label';
import { RadioGroup, RadioGroupItem } from 'core/RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'core/Select';
import { Skeleton } from 'core/Skeleton';
import { Switch } from 'core/Switch';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from 'core/Table';
import { Tabs } from 'core/Tabs';
import { TabsContent, TabsList, TabsTrigger } from 'core/Tabs/Tabs';
import { Textarea } from 'core/Textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'core/Tooltip/Tooltip';
import { Typography } from 'core/Typography';
import React from 'react';

export default function HomePage() {
    return (
        <Box center direction="column">
            <Typography variant="h2">Zero-dependencies UI:</Typography>

            <Grid gap="2rem" columns={3}>
                <Box direction="column" gap="1rem" width="100%">
                    <Typography variant="h1">Heading</Typography>
                    <Typography variant="p" color="secondary">
                        Simple Text
                    </Typography>
                </Box>

                <Box direction="column" gap="1rem" width="100%">
                    <Button>Button</Button>
                    <Button variant="outline" size="sm">
                        Small outline
                    </Button>
                    <Button loading>Loading...</Button>
                </Box>

                <Input placeholder="text" />

                <Textarea placeholder="textarea" />

                <Box direction="column" gap="0.75rem">
                    <Skeleton style={{ width: '250px', height: '125px', borderRadius: '25px' }} />
                    <Skeleton style={{ width: '250px', height: '18px' }} />
                    <Skeleton style={{ width: '200px', height: '18px' }} />
                </Box>

                <Table>
                    <TableCaption>Responsive table component</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Invoice</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>INV001</TableCell>
                            <TableCell>Paid</TableCell>
                            <TableCell>Credit Card</TableCell>
                            <TableCell>$250.00</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>INV001</TableCell>
                            <TableCell>Paid</TableCell>
                            <TableCell>Credit Card</TableCell>
                            <TableCell>$250.00</TableCell>
                        </TableRow>
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableHead className="w-[100px]">Invoice</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Amount</TableHead>
                        </TableRow>
                    </TableFooter>
                </Table>
            </Grid>

            <Typography variant="h2">Radix UI:</Typography>

            <Grid gap="2rem" columns={3}>
                <Box center gap="1rem" direction="column">
                    <Typography>Checkbox:</Typography>
                    <Box alignItems="center" gap="0.5rem">
                        <Checkbox id="check-1" />
                        <Label htmlFor="check-1">Option 1</Label>
                    </Box>
                    <Box alignItems="center" gap="0.5rem">
                        <Checkbox id="check-2" />
                        <Label htmlFor="check-2">Option 2</Label>
                    </Box>
                    <Box alignItems="center" gap="0.5rem">
                        <Checkbox disabled id="check-3" />
                        <Label htmlFor="check-3">Option 3</Label>
                    </Box>
                </Box>

                <Box asChild center direction="column" gap="1rem">
                    <RadioGroup defaultValue="radio-1">
                        <Typography>Radio:</Typography>
                        <Box alignItems="center" gap="0.5rem">
                            <RadioGroupItem value="radio-1" id="radio-1" />
                            <Label htmlFor="radio-1">Option 1</Label>
                        </Box>
                        <Box alignItems="center" gap="0.5rem">
                            <RadioGroupItem value="radio-2" id="radio-2" />
                            <Label htmlFor="radio-2">Option 2</Label>
                        </Box>
                        <Box alignItems="center" gap="0.5rem">
                            <RadioGroupItem disabled value="radio-3" id="radio-3" />
                            <Label htmlFor="radio-3">Option 3</Label>
                        </Box>
                    </RadioGroup>
                </Box>

                <Box center direction="column" gap="1rem">
                    <Typography>Switch:</Typography>
                    <Box center gap="0.5rem">
                        <Switch id="switch-1" />
                        <Label htmlFor="switch-1">Option 1</Label>
                    </Box>
                    <Box center gap="0.5rem">
                        <Switch id="switch-2" />
                        <Label htmlFor="switch-2">Option 2</Label>
                    </Box>
                    <Box center gap="0.5rem">
                        <Switch disabled id="switch-3" />
                        <Label htmlFor="switch-3">Option 3</Label>
                    </Box>
                </Box>

                <Select>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Pick an option" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem disabled value="system">
                            System
                        </SelectItem>
                    </SelectContent>
                </Select>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Dialog</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Вы точно хотите закрыть?</DialogTitle>
                            <DialogDescription>
                                Это действие не может быть отменено. Это приведет к безвозвратному
                                удалению вашей учетной записи и удалению ваших данных с наших
                                серверов.
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>

                <TooltipProvider>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger>
                            <Box center>
                                <QuestionMarkCircledIcon
                                    style={{ width: '2rem', height: '2rem' }}
                                />
                            </Box>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Tooltip content</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <Tabs defaultValue="account" className="w-[400px]">
                    <TabsList>
                        <TabsTrigger value="account">Account</TabsTrigger>
                        <TabsTrigger value="password">Password</TabsTrigger>
                    </TabsList>
                    <TabsContent value="account">Make changes to your account here.</TabsContent>
                    <TabsContent value="password">Change your password here.</TabsContent>
                </Tabs>
            </Grid>

            {/* <Counter /> */}
        </Box>
    );
}
