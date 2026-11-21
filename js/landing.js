// Sample rows for the hero. Deadlines are relative to today so the demo never looks stale.
(() => {
  const rows = [
    { name: 'Campus Build Weekend', platform: 'Devfolio', days: 1, status: 'Registered' },
    { name: 'Open Data Hack', platform: 'Unstop', days: 5, status: 'Team formed' },
    { name: 'Health Tech Sprint', platform: 'Devpost', days: 16, status: 'Interested' }
  ];
  const ul = document.getElementById('demo');
  if (!ul) return;
  for (const r of rows) {
    const cls = r.days <= 1 ? 'u-red' : r.days <= 7 ? 'u-gold' : 'u-calm';
    const li = document.createElement('li');
    li.innerHTML =
      `<div class="count ${cls}"><b>${r.days}</b><span>${r.days === 1 ? 'day' : 'days'}</span></div>` +
      `<div><strong>${r.name}</strong><small>${r.platform}</small></div>` +
      `<span class="pill">${r.status}</span>`;
    ul.appendChild(li);
  }
})();
