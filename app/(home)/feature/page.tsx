import Feature from '@/(home)/_components/feature';
import { FeatureFlagProvider } from '~/packages/core/feature/provider';

export default function FeaturePage() {
    return (
        <FeatureFlagProvider>
            <Feature flag="epgu" />
        </FeatureFlagProvider>
    );
}
