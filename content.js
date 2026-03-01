if (!document.getElementById('floatingTimerWidget')) {

  const widget = document.createElement('div');
  widget.id = 'floatingTimerWidget';
  widget.style.position = 'fixed';
  widget.style.bottom = '30px';
  widget.style.right = '30px';
  widget.style.width = '100px';
  widget.style.height = '100px';
  widget.style.background = '#27ae60';
  widget.style.color = 'white';
  widget.style.fontWeight = 'bold';
  widget.style.fontSize = '16px';
  widget.style.borderRadius = '12px';
  widget.style.zIndex = '999999';
  widget.style.display = 'flex';
  widget.style.justifyContent = 'center';
  widget.style.alignItems = 'center';
  widget.style.cursor = 'grab';
  widget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
  widget.style.userSelect = 'none';

  document.body.appendChild(widget);

  const timeLabel = document.createElement('div');
  timeLabel.textContent = '0s';
  widget.appendChild(timeLabel);

  const exitBtn = document.createElement('button');
  exitBtn.textContent = '×';
  exitBtn.style.position = 'absolute';
  exitBtn.style.top = '2px';
  exitBtn.style.right = '4px';
  exitBtn.style.background = 'red';
  exitBtn.style.color = 'white';
  exitBtn.style.border = 'none';
  exitBtn.style.borderRadius = '50%';
  exitBtn.style.width = '20px';
  exitBtn.style.height = '20px';
  exitBtn.style.cursor = 'pointer';
  widget.appendChild(exitBtn);

  exitBtn.onclick = () => widget.remove();

  let isDragging = false, offsetX, offsetY;

  widget.addEventListener('mousedown', e => {
    isDragging = true;
    offsetX = e.clientX - widget.getBoundingClientRect().left;
    offsetY = e.clientY - widget.getBoundingClientRect().top;
  });

  document.addEventListener('mouseup', () => isDragging = false);

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;

    x = Math.min(Math.max(0, x), window.innerWidth - widget.offsetWidth);
    y = Math.min(Math.max(0, y), window.innerHeight - widget.offsetHeight);

    widget.style.left = x + 'px';
    widget.style.top = y + 'px';
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
  });

  setInterval(() => {

    chrome.runtime.sendMessage({ action: 'getTime' }, res => {

      if (res && res.currentStartTime) {

        const seconds = Math.floor(
          (new Date() - new Date(res.currentStartTime)) / 1000
        );

        timeLabel.textContent =
          seconds < 60 ? `${seconds}s`
          : seconds < 3600 ? `${Math.floor(seconds / 60)}m`
          : `${Math.floor(seconds / 3600)}h`;

      } else {
        timeLabel.textContent = '0s';
      }

    });

  }, 1000);

}