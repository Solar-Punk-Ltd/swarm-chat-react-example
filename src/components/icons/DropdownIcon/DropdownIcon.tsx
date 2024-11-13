import React from "react";

interface DropdownIconProps {
  color?: string;
  isDown?: boolean;
}

const DropdownIcon: React.FC<DropdownIconProps> = ({ color, isDown }) => {
  return (
    <div style={{ display: "flex" }}>
      {isDown ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_80_439)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 3.6001C8.10609 3.6001 8.20783 3.64224 8.28284 3.71726C8.35786 3.79227 8.4 3.89401 8.4 4.0001C8.4 4.10618 8.35786 4.20793 8.28284 4.28294C8.20783 4.35795 8.10609 4.4001 8 4.4001H1C0.893913 4.4001 0.792171 4.35795 0.717157 4.28294C0.642143 4.20793 0.6 4.10618 0.6 4.0001C0.6 3.89401 0.642143 3.79227 0.717157 3.71726C0.792171 3.64224 0.893913 3.6001 1 3.6001H8ZM8 5.6001C8.05253 5.6001 8.10454 5.61044 8.15307 5.63055C8.2016 5.65065 8.2457 5.68011 8.28284 5.71726C8.31999 5.7544 8.34945 5.79849 8.36955 5.84702C8.38965 5.89555 8.4 5.94757 8.4 6.0001C8.4 6.05263 8.38965 6.10464 8.36955 6.15317C8.34945 6.2017 8.31999 6.2458 8.28284 6.28294C8.2457 6.32008 8.2016 6.34955 8.15307 6.36965C8.10454 6.38975 8.05253 6.4001 8 6.4001H1C0.893913 6.4001 0.792171 6.35795 0.717157 6.28294C0.642143 6.20793 0.6 6.10618 0.6 6.0001C0.6 5.89401 0.642143 5.79227 0.717157 5.71726C0.792171 5.64224 0.893913 5.6001 1 5.6001H8ZM8.4 8.0001C8.4 7.7801 8.22 7.6001 8 7.6001H1C0.893913 7.6001 0.792171 7.64224 0.717157 7.71726C0.642143 7.79227 0.6 7.89401 0.6 8.0001C0.6 8.10618 0.642143 8.20793 0.717157 8.28294C0.792171 8.35795 0.893913 8.4001 1 8.4001H8C8.05253 8.4001 8.10454 8.38975 8.15307 8.36965C8.2016 8.34955 8.2457 8.32008 8.28284 8.28294C8.31999 8.2458 8.34945 8.2017 8.36955 8.15317C8.38965 8.10464 8.4 8.05263 8.4 8.0001ZM8 9.6001C8.10609 9.6001 8.20783 9.64224 8.28284 9.71726C8.35786 9.79227 8.4 9.89401 8.4 10.0001C8.4 10.1062 8.35786 10.2079 8.28284 10.2829C8.20783 10.358 8.10609 10.4001 8 10.4001H1C0.893913 10.4001 0.792171 10.358 0.717157 10.2829C0.642143 10.2079 0.6 10.1062 0.6 10.0001C0.6 9.89401 0.642143 9.79227 0.717157 9.71726C0.792171 9.64224 0.893913 9.6001 1 9.6001H8ZM8.4 12.0001C8.4 11.7801 8.22 11.6001 8 11.6001H1C0.893913 11.6001 0.792171 11.6422 0.717157 11.7173C0.642143 11.7923 0.6 11.894 0.6 12.0001C0.6 12.1062 0.642143 12.2079 0.717157 12.2829C0.792171 12.358 0.893913 12.4001 1 12.4001H8C8.10609 12.4001 8.20783 12.358 8.28284 12.2829C8.35786 12.2079 8.4 12.1062 8.4 12.0001ZM13 9.7501L10.5 6.5001H15.5L13 9.7501Z"
              fill={color ? color : "white"}
            />
          </g>
          <defs>
            <clipPath id="clip0_80_439">
              <rect
                width="15"
                height="15"
                fill={color ? color : "white"}
                transform="matrix(-1 0 0 1 15.5 0.5)"
              />
            </clipPath>
          </defs>
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_102_896)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13 6.5L15.5 9.75H10.5L13 6.5Z"
              fill={color ? color : "white"}
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.9999 3.6001C8.10599 3.6001 8.20773 3.64224 8.28274 3.71726C8.35776 3.79227 8.3999 3.89401 8.3999 4.0001C8.3999 4.10618 8.35776 4.20793 8.28274 4.28294C8.20773 4.35795 8.10599 4.4001 7.9999 4.4001H0.999902C0.893816 4.4001 0.792074 4.35795 0.71706 4.28294C0.642045 4.20793 0.599903 4.10618 0.599903 4.0001C0.599903 3.89401 0.642045 3.79227 0.71706 3.71726C0.792074 3.64224 0.893816 3.6001 0.999902 3.6001H7.9999ZM7.9999 5.6001C8.05243 5.6001 8.10445 5.61044 8.15298 5.63055C8.20151 5.65065 8.2456 5.68011 8.28274 5.71726C8.31989 5.7544 8.34935 5.79849 8.36945 5.84702C8.38956 5.89555 8.3999 5.94757 8.3999 6.0001C8.3999 6.05263 8.38956 6.10464 8.36945 6.15317C8.34935 6.2017 8.31989 6.2458 8.28274 6.28294C8.2456 6.32008 8.20151 6.34955 8.15298 6.36965C8.10445 6.38975 8.05243 6.4001 7.9999 6.4001H0.999902C0.893816 6.4001 0.792074 6.35795 0.71706 6.28294C0.642045 6.20793 0.599903 6.10618 0.599903 6.0001C0.599903 5.89401 0.642045 5.79227 0.71706 5.71726C0.792074 5.64224 0.893816 5.6001 0.999902 5.6001H7.9999ZM8.3999 8.0001C8.3999 7.7801 8.2199 7.6001 7.9999 7.6001H0.999902C0.893816 7.6001 0.792074 7.64224 0.71706 7.71726C0.642045 7.79227 0.599903 7.89401 0.599903 8.0001C0.599903 8.10618 0.642045 8.20793 0.71706 8.28294C0.792074 8.35795 0.893816 8.4001 0.999902 8.4001H7.9999C8.05243 8.4001 8.10445 8.38975 8.15298 8.36965C8.20151 8.34955 8.2456 8.32008 8.28274 8.28294C8.31989 8.2458 8.34935 8.2017 8.36945 8.15317C8.38956 8.10464 8.3999 8.05263 8.3999 8.0001ZM7.9999 9.6001C8.10599 9.6001 8.20773 9.64224 8.28274 9.71726C8.35776 9.79227 8.3999 9.89401 8.3999 10.0001C8.3999 10.1062 8.35776 10.2079 8.28274 10.2829C8.20773 10.358 8.10599 10.4001 7.9999 10.4001H0.999902C0.893816 10.4001 0.792074 10.358 0.71706 10.2829C0.642045 10.2079 0.599903 10.1062 0.599903 10.0001C0.599903 9.89401 0.642045 9.79227 0.71706 9.71726C0.792074 9.64224 0.893816 9.6001 0.999902 9.6001H7.9999ZM8.3999 12.0001C8.3999 11.7801 8.2199 11.6001 7.9999 11.6001H0.999902C0.893816 11.6001 0.792074 11.6422 0.71706 11.7173C0.642045 11.7923 0.599903 11.894 0.599903 12.0001C0.599903 12.1062 0.642045 12.2079 0.71706 12.2829C0.792074 12.358 0.893816 12.4001 0.999902 12.4001H7.9999C8.10599 12.4001 8.20773 12.358 8.28274 12.2829C8.35776 12.2079 8.3999 12.1062 8.3999 12.0001Z"
              fill={color ? color : "white"}
            />
          </g>
          <defs>
            <clipPath id="clip0_102_896">
              <rect
                width="15"
                height="15"
                fill={color ? color : "white"}
                transform="matrix(-1 0 0 1 15.5 0.5)"
              />
            </clipPath>
          </defs>
        </svg>
      )}
    </div>
  );
};

export default DropdownIcon;
