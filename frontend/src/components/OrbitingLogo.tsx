import React from 'react';
import { clsx } from 'clsx';

export default function OrbitingLogo() {
    return (
        /* 
           Outer Wrapper 
           - inline-flex: constrain width to the H1 text (hugs content)
           - relative: for absolute children
           - perspective: enabled for 3D
        */
        <div className="relative inline-flex justify-center items-center py-10 perspective-1000">

            {/* 1. Text (Base) */}
            {/* Added px-12 to prevent clipping of the 'o' */}
            <h1 className="relative z-10 text-[6rem] sm:text-[8rem] md:text-[11rem] font-black tracking-tighter font-outfit cursor-default select-none px-12 leading-none">
                <span className="inline-block p-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/10 filter drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    orbitio
                </span>
            </h1>

            {/* 2. 3D Scene Container */}
            {/* Absolute inset-0 matches the H1 size + padding. */}

        </div>
    );
}
