import React from 'react';

import cn from './style.module.sass';

function SvgTitle() {
    return (
        <svg viewBox="0 0 1920 300" className={cn.svg}>
            <defs>
                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="15 15" result="glow" />
                    <feMerge>
                        <feMergeNode in="glow" />
                        <feMergeNode in="glow" />
                        <feMergeNode in="glow" />
                    </feMerge>
                </filter>
            </defs>

            <symbol id="symbol">
                <text style={{ filter: 'url(#glow)' }} textAnchor="middle" x="50%" y="80%">
                    NEXT STARTER
                </text>
                <text textAnchor="middle" x="50%" y="80%">
                    NEXT STARTER
                </text>
            </symbol>

            <g className="g-ants">
                <use xlinkHref="#symbol" className={cn.symbol} />
                <use xlinkHref="#symbol" className={cn.symbol} />
                <use xlinkHref="#symbol" className={cn.symbol} />
                <use xlinkHref="#symbol" className={cn.symbol} />
                <use xlinkHref="#symbol" className={cn.symbol} />
            </g>
        </svg>
    );
}

export default SvgTitle;
