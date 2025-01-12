import { Button } from '@repo/core/button';
import { Checkbox } from '@repo/core/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@repo/core/dialog';
import { Input } from '@repo/core/input';
import { Label } from '@repo/core/label';
import { RadioGroup, RadioGroupItem } from '@repo/core/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/core/select';
import { Skeleton } from '@repo/core/skeleton';
import { Switch } from '@repo/core/switch';
import { Tabs } from '@repo/core/tabs';
import { TabsContent, TabsList, TabsTrigger } from '@repo/core/tabs/tabs';
import { Textarea } from '@repo/core/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@repo/core/tooltip/tooltip';
import { Typography } from '@repo/core/typography';
import { CircleHelp } from 'lucide-react';

const gridItemClassName =
    'flex place-content-center items-center col-span-1 border border-dashed border-slate-200 p-4 rounded-2xl';

export default function UIPage() {
    return (
        <div className="flex size-full flex-col items-center justify-center gap-2 bg-white">
            <div className={'grid grid-cols-3 gap-8'}>
                <div className={gridItemClassName}>
                    <div className="flex flex-col gap-5">
                        <Typography variant="h1">Заголовок</Typography>
                        <Typography variant="p" color="secondary">
                            Простой текст
                        </Typography>
                    </div>
                </div>

                <div className={gridItemClassName}>
                    <div className="flex flex-col gap-4">
                        <Button>Кнопка</Button>
                        <Button variant="outline" size="sm">
                            Кнопка
                        </Button>
                        <Button loading>Загрузка...</Button>
                    </div>
                </div>

                <div className={gridItemClassName}>
                    <div className="flex flex-col gap-4">
                        <Input placeholder="Введите текст" />
                        <Textarea placeholder="Введите текст" />
                    </div>
                </div>

                <div className={gridItemClassName}>
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-[125px] w-[250px] rounded-2xl" />
                        <Skeleton className="h-[18px] w-[250px]" />
                        <Skeleton className="h-[18px] w-[200px]" />
                    </div>
                </div>

                <div className={gridItemClassName}>
                    <div className="flex flex-col place-content-center gap-4">
                        <div className="flex items-center gap-2">
                            <Checkbox id="check-1" />
                            <Label htmlFor="check-1">Вариант 1</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="check-2" />
                            <Label htmlFor="check-2">Вариант 2</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox disabled id="check-3" />
                            <Label htmlFor="check-3">Вариант 3</Label>
                        </div>
                    </div>
                </div>

                <div className={gridItemClassName}>
                    <div className="flex flex-col place-content-center">
                        <RadioGroup defaultValue="radio-1" className="gap-4">
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="radio-1" id="radio-1" />
                                <Label htmlFor="radio-1">Вариант 1</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="radio-2" id="radio-2" />
                                <Label htmlFor="radio-2">Вариант 2</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem disabled value="radio-3" id="radio-3" />
                                <Label htmlFor="radio-3">Вариант 3</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <div className={gridItemClassName}>
                    <div className="flex flex-col place-content-center gap-4">
                        <div className="flex place-content-center items-center gap-2">
                            <Switch id="switch-1" />
                            <Label htmlFor="switch-1">Вариант 1</Label>
                        </div>
                        <div className="flex place-content-center items-center gap-2">
                            <Switch id="switch-2" />
                            <Label htmlFor="switch-2">Вариант 2</Label>
                        </div>
                        <div className="flex place-content-center items-center gap-2">
                            <Switch disabled id="switch-3" />
                            <Label htmlFor="switch-3">Вариант 3</Label>
                        </div>
                    </div>
                </div>

                <div className={gridItemClassName}>
                    <Select>
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите опцию" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">Светлая</SelectItem>
                            <SelectItem value="dark">Темная</SelectItem>
                            <SelectItem disabled value="system">
                                Системная
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className={gridItemClassName}>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Диалог</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Вы точно хотите закрыть?</DialogTitle>
                                <DialogDescription>
                                    Это действие не может быть отменено. Это приведет к
                                    безвозвратному удалению вашей учетной записи и удалению ваших
                                    данных с наших серверов.
                                </DialogDescription>
                            </DialogHeader>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <div className="flex gap-2">
                                        <Button>Точно</Button>
                                        <Button variant="outline">Отменить</Button>
                                    </div>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className={gridItemClassName}>
                    <TooltipProvider>
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger>
                                <div className="flex place-content-center">
                                    <CircleHelp size={25} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Контент тултипа</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className={gridItemClassName}>
                    <Tabs defaultValue="tab-1">
                        <TabsList>
                            <TabsTrigger value="tab-1">Триггер 1</TabsTrigger>
                            <TabsTrigger value="tab-2">Триггер 2</TabsTrigger>
                        </TabsList>
                        <TabsContent value="tab-1">Контент первого таба.</TabsContent>
                        <TabsContent value="tab-2">Контент второго таба.</TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
