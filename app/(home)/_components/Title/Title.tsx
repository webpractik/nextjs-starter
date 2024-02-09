import { Typography } from 'core/Typography';
import React from 'react';

import cn from './Title.module.sass';

export function Title() {
    return (
        <Typography variant="h1" className={cn.title} data-testid="title">
            <span>N</span>
            <span>e</span>
            <span>x</span>
            <span>t</span>
            &nbsp;
            <span>S</span>
            <span>t</span>
            <span>a</span>
            <span>r</span>
            <span>t</span>
            <span>e</span>
            <span>r</span>
        </Typography>
    );
}
