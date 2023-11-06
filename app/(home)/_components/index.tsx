import Logo from 'core/Logo';
import StoreInitializer from 'shared/utilities/StoreInitializer';

import Counter from '@/(home)/_components/Counter';
import CounterButtons from '@/(home)/_components/CounterButtons';
import CounterRSC from '@/(home)/_components/CounterRSC';
import SvgTitle from '@/(home)/_components/SvgTitle';
import { useGlobalStore } from '@/lib/stores/Global';

const DEFAULT_STATE = { count: 7 };
function HomeComponent() {
    // server-side store initialization
    useGlobalStore.setState(DEFAULT_STATE);

    return (
        <>
            {/* client-side store initialization */}
            <StoreInitializer initialState={DEFAULT_STATE} />
            <Logo />
            <SvgTitle />
            <Counter />
            <CounterRSC />
            <CounterButtons />
        </>
    );
}

export default HomeComponent;
