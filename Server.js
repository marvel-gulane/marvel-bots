const http 			= require('http');
const fs 			= require('fs');
const path 			= require('path');
const os 			= require('os');
const { execSync } 			= require('child_process');
const { WebSocketServer } 	= require('ws');

// ─── Define your commands (like PHP CLI) ───────────────────────
const commands = {
  help: () => `Available commands:
  help       - Show this message
  audit	     - Audit system distro
  connect    - Connect cloud server services
  echo <msg> - Print a message
  date       - Current date/time
  whoami     - Current user
  hostname   - Machine hostname
  uptime     - System uptime
  mem        - Memory usage
  ping <n>   - Ping (repeats n times)
  clear      - Clear screen
  exit       - Close session`,

  echo: (args) => args.join(' ') || '',

  connect : () => execSync('ssh localhost:8080', {encoding:'utf-8'}),

  audit: () => {const lynis = execSync('lynis audit system', {encoding:'utf-8'}); return `${lynis}`; },

  date: () => new Date().toString(),

  whoami: () => os.userInfo().username,

  hostname: () => os.hostname(),

  uptime: () => {
    const secs = Math.floor(os.uptime());
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `up ${h}h ${m}m`;
  },

  mem: () => {
    const total = (os.totalmem() / 1e9).toFixed(1);
    const free = (os.freemem() / 1e9).toFixed(1);
    return `total: ${total} GB | free: ${free} GB`;
  },

  ping: async (args, send) => {
    const n = parseInt(args[0]) || 3;
    for (let i = 0; i < n; i++) {
      send(`64 bytes: time=${(Math.random() * 50 + 10).toFixed(1)} ms`);
      await new Promise(r => setTimeout(r, 1000));
    }
  },

  clear: () => '\x01', // special token for client to clear

  exit: () => null, // signals disconnect
};

// ─── HTTP + WebSocket server ───────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(path.join(__dirname, 'Index.html'), 'utf8'));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  // Send welcome banner
  ws.send(JSON.stringify({
    type: 'output',
    data: `MyCLI v1.0 — ${os.platform()} ${os.release()}
Type 'help' for commands, 'exit' to quit.\n`
  }));
  ws.send(JSON.stringify({ type: 'prompt' }));

  ws.on('message', async (raw) => {
    const input = raw.toString().trim();
    if (!input) return;

    const [cmd, ...args] = input.split(/\s+/);

    // Echo the typed command
    ws.send(JSON.stringify({ type: 'output', data: `cli> ${input}\n` }));

    if (cmd === 'exit') {
      ws.send(JSON.stringify({ type: 'output', data: 'Goodbye.\n' }));
      ws.close();
      return;
    }

    const handler = commands[cmd];
    if (!handler) {
      ws.send(JSON.stringify({ type: 'output', data: `Unknown command: ${cmd}\n` }));
    } else {
      try {
        const send = (data) => ws.send(JSON.stringify({ type: 'output', data: data + '\n' }));
        const result = await handler(args, send);
        if (result === '\x01') {
          ws.send(JSON.stringify({ type: 'clear' }));
        } else if (result !== null) {
          ws.send(JSON.stringify({ type: 'output', data: result + '\n' }));
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: 'output', data: `Error: ${e.message}\n` }));
      }
    }

    ws.send(JSON.stringify({ type: 'prompt' }));
  });
});

server.listen(3000, () => console.log('CLI at http://localhost:3000'));   
