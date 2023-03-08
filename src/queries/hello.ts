import { createQuery } from 'react-query-kit';

import HelloService from '@/api/services/HelloService';

export const useHello = createQuery({
    primaryKey: '/get-hello',
    queryFn: () => HelloService.getHello(),
});
