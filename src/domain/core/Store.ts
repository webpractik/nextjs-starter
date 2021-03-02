import { makeAutoObservable } from 'mobx';
import { enableStaticRendering } from 'mobx-react';

enableStaticRendering(typeof window === 'undefined');

export default class Store {
    constructor() {
        makeAutoObservable(this);
    }

    public hydrate: (data) => void;
}
