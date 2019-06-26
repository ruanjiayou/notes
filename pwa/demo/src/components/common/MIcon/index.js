import React from 'react';
import * as Icons from 'react-icons/fa';
import './index.css';

// const types = {
//   home: require('./home.svg'),
//   user: require('./user.svg'),
//   map: require('./map.svg'),
//   fire: require('./fire.svg'),
//   search: require('./search.svg'),
//   setting: require('./setting.svg'),
// };

// export default function ({ type, className = '', size = 'md', ...restProps }) {
//   return (<svg className={`am-icon am-icon-${type.substr(1)} am-icon-${size} ${className}`} {...restProps}>
//     <use xlinkHref={require('./home.svg')} />
//   </svg>)
// }

export default function ({ type, className = '', size = 'md', ...restProps }) {
  const Icon = Icons[type];
  return <div className={`am-icon am-icon-${type.substr(1)} am-icon-${size} ${className}`} {...restProps}>
    <Icon style={restProps.style} />
  </div>
}