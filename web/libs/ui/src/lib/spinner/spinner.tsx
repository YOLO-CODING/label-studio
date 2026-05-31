import type { CSSProperties } from "react";
import styles from "./spinner.module.scss";
import { cn } from "@humansignal/shad/utils";

export type SpinnerProps = {
  className?: string;
  style?: CSSProperties;
  size?: number;
  stopped?: boolean;
};

export const Spinner = ({ className, style, size = 32, stopped = false }: SpinnerProps) => {
  const fullClassName = cn(styles.spinner, className);
  const sizeWithUnit = typeof size === "number" ? `${size}px` : size;

  return (
    <div className={fullClassName} style={{ ...(style ?? {}), width: sizeWithUnit, height: sizeWithUnit }}>
      <svg 
        viewBox="0 0 128 128" 
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          opacity: stopped ? 0.5 : 1,
          animation: stopped ? 'none' : undefined
        }}
      >
        <style>
          {`
            svg {
              animation: ${stopped ? 'none' : 'fadeIn 1s ease-out 1.5s forwards'};
              opacity: ${stopped ? 0.5 : 0};
            }
            
            @keyframes fadeIn {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            
            .wave {
              opacity: 0;
              fill: currentColor;
            }
            
            .wave:nth-child(1) {
              animation: ${stopped ? 'none' : 'scaleOut 1.9s ease-in-out 1.6s infinite'};
              transform-origin: center;
              transform-box: fill-box;
            }
            
            .wave:nth-child(2) {
              animation: ${stopped ? 'none' : 'scaleOut 2s ease-in-out 0.8s infinite'};
              transform-origin: center;
              transform-box: fill-box;
            }
            
            .wave:nth-child(3) {
              animation: ${stopped ? 'none' : 'scaleOut 2s ease-in-out 0.4s infinite'};
              transform-origin: center;
              transform-box: fill-box;
            }
            
            .wave:nth-child(4) {
              animation: ${stopped ? 'none' : 'scaleOut 2s ease-in-out 0.2s infinite'};
              transform-origin: center;
              transform-box: fill-box;
            }
            
            .wave:nth-child(5) {
              animation: ${stopped ? 'none' : 'scaleOut 2s ease-in-out 0.1s infinite'};
              transform-origin: center;
              transform-box: fill-box;
            }
            
            @keyframes scaleOut {
              0% {
                transform: scale(0.7) rotate(0deg);
                opacity: 0;
              }
              30% {
                transform: scale(0.8) rotate(0deg);
                opacity: 0.1;
              }
              100% {
                transform: scale(0.9) rotate(0deg);
                opacity: 0;
              }
            }
            
            @keyframes breath {
              0%, 100% { 
                opacity: 0.15; 
                filter: saturate(2) brightness(1) drop-shadow(0 0 5px rgba(255,255,255,0.2));
              }
              50% { 
                opacity: 1; 
                filter: saturate(1.2) brightness(1.1) drop-shadow(0 0 15px rgba(255,255,255,0.6));
              }
            }
            
            #XMLID_2_  { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0s'}; }
            #XMLID_18_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0.1s'}; }
            #XMLID_21_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0.2s'}; }
            #XMLID_27_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0.3s'}; }
            #XMLID_23_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0.4s'}; }
            #XMLID_22_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0.5s'}; }
            #XMLID_34_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0.6s'}; }
            #XMLID_30_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0.7s'}; }
            #XMLID_29_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0.8s'}; }
            #XMLID_41_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 0.9s'}; }
            #XMLID_37_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 1.0s'}; }
            #XMLID_36_ { animation: ${stopped ? 'none' : 'breath 2s ease-in-out infinite 1.1s'}; }
            
            circle { animation: ${stopped ? 'none' : 'breath 6s ease-in-out infinite'}; }
            .st0{fill:#898989;}
            .st1{fill:#3C579A;}
            .st2{fill:#A83335;}
            .st3{fill:#E7BD32;}
            .st4{fill:#283350;}
          `}
        </style>
        <path className="wave" d="M63.871 80.6451C54.5161 80.6451 46.7742 72.9032 46.7742 63.5484C46.7742 54.1935 54.5161 46.4516 63.871 46.4516C73.2258 46.4516 80.9677 54.1935 80.9677 63.5484C80.9677 72.9032 73.2258 80.6451 63.871 80.6451ZM63.871 49.6774C56.129 49.6774 50 55.8064 50 63.5484C50 71.2903 56.129 77.4193 63.871 77.4193C71.6129 77.4193 77.7419 71.2903 77.7419 63.5484C77.7419 55.8064 71.6129 49.6774 63.871 49.6774Z" />
        <path className="wave" d="M23.871 89.0323C23.2258 89.0323 22.9032 88.7097 22.5806 88.3871C18.0645 80.9677 15.8064 72.2581 15.8064 63.5484C15.8064 36.7742 37.4194 15.1613 64.1936 15.1613C75.1613 15.1613 86.129 19.0323 94.5161 25.8064C95.1613 26.4516 95.1613 27.4194 94.8387 28.0645C94.1935 28.7097 93.2258 28.7097 92.5806 28.3871C84.5161 21.9355 74.8387 18.3871 64.1936 18.3871C39.3548 18.3871 19.0323 38.7097 19.0323 63.5484C19.0323 71.6129 21.2903 79.6774 25.4839 86.7742C25.8065 87.4194 25.8065 88.3871 24.8387 89.0323H23.871ZM63.871 111.935C52.5806 111.935 41.6129 108.065 33.2258 100.968C32.5806 100.323 32.5806 99.3548 32.9032 98.7097C33.2258 98.0645 34.5161 98.0645 35.1613 98.3871C43.2258 105.161 53.5484 108.71 63.871 108.71C88.7097 108.71 109.032 88.3871 109.032 63.5484C109.032 55.1613 106.774 47.0968 102.258 40C101.613 39.3548 101.935 38.3871 102.903 37.7419C103.871 37.0968 104.516 37.4194 105.161 38.3871C110 46.129 112.258 54.8387 112.258 63.5484C112.258 90.3226 90.6452 111.935 63.871 111.935Z" />
        <path className="wave" d="M55.8065 95.1613H55.4839C40.9677 91.2903 30.9677 78.3871 30.9677 63.5484C30.9677 48.7097 40.9677 35.8065 55.4839 31.9355C56.4516 31.6129 57.0968 32.2581 57.4194 33.2258C57.7419 34.1935 57.0968 34.8387 56.129 35.1613C43.2258 38.7097 34.1936 50.3226 34.1936 63.5484C34.1936 76.7742 43.2258 88.7097 56.129 91.9355C57.0968 92.2581 57.4194 92.9032 57.4194 93.871C57.4194 94.8387 56.7742 95.1613 55.8065 95.1613ZM71.9355 95.1613C71.2903 95.1613 70.6452 94.5161 70.3226 93.871C70 92.9032 70.6452 92.2581 71.6129 91.9355C84.5161 88.3871 93.5484 76.7742 93.5484 63.5484C93.5484 50.3226 84.5161 38.3871 71.6129 35.1613C70.6452 34.8387 70.3226 34.1935 70.3226 33.2258C70.3226 32.2581 71.2903 31.9355 72.2581 31.9355C86.7742 35.8065 96.7742 48.7097 96.7742 63.5484C96.7742 78.3871 86.7742 91.2903 72.2581 95.1613H71.9355Z"/>
        <path className="wave" d="M63.871 127.419C28.7097 127.419 0 98.7097 0 63.5484C0 55.8064 1.29032 48.0645 4.19355 40.6452C4.51613 39.6774 5.48387 39.3548 6.12903 39.6774C7.09677 40 7.41935 40.9677 7.09677 41.6129C4.51613 48.7097 3.22581 55.8065 3.22581 63.2258C3.22581 96.7742 30.3226 123.871 63.871 123.871C83.5484 123.871 102.258 114.194 113.548 98.0645C114.194 97.4194 115.161 97.0968 115.806 97.7419C116.452 98.3871 116.774 99.3548 116.129 100C104.194 117.097 84.8387 127.419 63.871 127.419ZM122.258 86.7742H121.613C120.645 86.4516 120.323 85.4839 120.645 84.8387C123.226 78.0645 124.516 70.9677 124.516 63.871C124.516 30.3226 97.4194 3.22581 63.871 3.22581C44.1935 3.22581 25.8064 12.5806 14.5161 28.7097C13.871 29.3548 12.9032 29.6774 12.2581 29.0323C11.6129 28.3871 11.2903 27.4194 11.9355 26.7742C23.871 10 43.2258 0 63.871 0C99.0323 0 127.742 28.7097 127.742 63.871C127.742 71.2903 126.452 78.7097 123.871 86.129C123.548 86.4516 122.903 86.7742 122.258 86.7742Z" />

        <path id="XMLID_1_" className="st2" d="M63.806 72.7184C58.6767 72.7184 54.5185 68.5602 54.5185 63.4309C54.5185 58.3015 58.6767 54.1433 63.806 54.1433C68.9354 54.1433 73.0936 58.3015 73.0936 63.4309C73.0936 68.5602 68.9354 72.7184 63.806 72.7184Z" />
        <path id="XMLID_2_" className="st1" d="M73.1637 53.0919C73.1637 48.01 69.0106 43.8043 63.8761 43.8043C58.7417 43.8043 54.5886 48.01 54.5886 53.0919H73.1637Z"/>
        <path id="XMLID_18_" className="st2" d="M71.9721 42.3849C70.3949 39.511 67.3283 37.5484 63.8235 37.5484C60.3013 37.5484 57.2522 39.511 55.675 42.3849H71.9721Z" />
        <path id="XMLID_21_" className="st3" d="M43.7765 53.0744C43.7765 47.9399 47.8069 43.6992 53.064 43.6992V53.0919L43.7765 53.0744Z"/>
        <path id="XMLID_27_" className="st4" d="M53.4145 54.1433C48.3326 54.1433 44.1269 58.2964 44.1269 63.4309C44.1269 68.5653 48.3326 72.7184 53.4145 72.7184V54.1433Z"/>
        <path id="XMLID_23_" className="st1" d="M42.7075 55.3349C39.8336 56.912 37.871 59.9787 37.871 63.4834C37.871 67.0057 39.8336 70.0548 42.7075 71.6319V55.3349Z"/>
        <path id="XMLID_22_" className="st2" d="M53.397 83.5831C48.2625 83.5831 44.0218 79.5526 44.0218 74.2955H53.4145L53.397 83.5831Z"/>
        <path id="XMLID_34_" className="st4" d="M54.5886 73.7698C54.5886 78.8517 58.7417 83.0574 63.8761 83.0574C69.0106 83.0574 73.1637 78.8517 73.1637 73.7698H54.5886Z"/>
        <path id="XMLID_30_" className="st3" d="M55.7977 84.5118C57.3748 87.3857 60.4415 89.3484 63.9462 89.3484C67.4685 89.3484 70.5176 87.3857 72.0947 84.5118H55.7977Z"/>
        <path id="XMLID_29_" className="st1" d="M84.0809 73.8399C84.0809 78.9744 80.0505 83.2151 74.7934 83.2151V73.8049L84.0809 73.8399Z"/>
        <path id="XMLID_41_" className="st3" d="M74.2677 72.771C79.3495 72.771 83.5552 68.6179 83.5552 63.4834C83.5552 58.349 79.3495 54.1959 74.2677 54.1959V72.771Z" />
        <path id="XMLID_37_" className="st2" d="M85.0447 71.5618C87.9186 69.9847 89.8813 66.9181 89.8813 63.4133C89.8813 59.8911 87.9186 56.8419 85.0447 55.2648V71.5618Z"/>
        <path id="XMLID_36_" className="st4" d="M74.3728 43.2786C79.5072 43.2786 83.748 47.3091 83.748 52.5662H74.3378L74.3728 43.2786Z" />
      </svg>
    </div>
  );
};

