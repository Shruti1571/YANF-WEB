import React from 'react';

export default function Loader({ isDone }) {
  return (
    <div id="loader" className={isDone ? 'done' : ''}>
      <div className="mono-mark">Y A N F</div>
      <div className="bar"><i></i></div>
    </div>
  );
}
