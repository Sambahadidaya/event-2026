export default function WaveDivider({ fillClass, flip = false }) {
    return (
        <div
            className={`w-full leading-[0] shrink-0 ${flip ? 'rotate-180' : ''}`}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 1440 100"
                preserveAspectRatio="none"
                className="w-full h-[72px] md:h-[100px] block"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M0,40 C240,90 480,10 720,50 C960,90 1200,20 1440,55 L1440,100 L0,100 Z"
                    className={fillClass}
                />
            </svg>
        </div>
    );
}
