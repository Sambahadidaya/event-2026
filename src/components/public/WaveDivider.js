export default function WaveDivider({ fillClass, flip = false }) {
    return (
        <div
            className={`w-full leading-[0] shrink-0 -mt-[1px] -mb-[1px] ${flip ? 'rotate-180' : ''}`}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 1440 100"
                preserveAspectRatio="none"
                className="w-full h-[60px] md:h-[90px] block transform scale-x-[1.02]"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M0,30 C280,100 420,-10 720,30 C1020,70 1160,10 1440,30 L1440,105 L-5,105 Z"
                    className={`${fillClass} opacity-30`}
                />
                <path
                    d="M0,50 C240,90 480,10 720,50 C960,90 1200,20 1440,55 L1440,105 L-5,105 Z"
                    className={fillClass}
                />
            </svg>
        </div>
    );
}
