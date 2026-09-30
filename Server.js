const http 			= require('http');
const fs 			= require('fs');
const path 			= require('path');
const os 			= require('os');
const { execSync } 		= require('child_process');
const { WebSocketServer } 	= require('ws');

// ─── Define your commands (like PHP CLI) ───────────────────────
const commands = {
  help: () => `\n\nAvailable commands:

  help       - Show this message
  math       - Math for everything
  pizzas     - Pizza for everyone
  food       - Food for everyone
  force      - Force activation
  process    - Show PID of running programs
  kill       - Kill running process
  monitor    - Monitoring hardware trojans
  connect    - Connect cloud server services
  echo <msg> - Print a message
  clamav     - Clamav scanner 
  clamscan   - Antivirus scanner native javascript
  news       - Current news today
  date       - Current date/time
  whoami     - Current user
  hostname   - Machine hostname
  git        - Git push origin 
  uptime     - System uptime
  mem        - Memory usage
  netstat    - Network connections 
  ping       - Ping domains / ip
  clear      - Clear screen
  exit       - Close session`,

  
  kill : async(args) => {
	const killproc = `kill ${args[0]}`;
	const stdout_killproc = execSync(killproc, {encoding:'utf-8'})
	return stdout_killproc;
  },

  process : async(args) => {
	const process = `systemctl status | grep ${args[0]}`;
	const stdout_process = execSync(process, {encoding:'utf-8'})
	return stdout_process;
  },



  git : async(args) => {
	const gitremotes = `git remote add url origin ${args[0]}`;
	const stdout_git = execSync(gitremotes, {encoding:'utf-8'});
	return stdout_git;
  },

  pizzas : () => {
	const pizzas = '~/Node/bin/node /home/coderlava/marvel-random/Pizzas.js';
	const stdout_pizzas = execSync(pizzas, {encoding:'utf-8'});
	return stdout_pizzas;
  },

  clamav : () => {
	const clamav = 'clamscan --verbose --recursive=yes ./';
	const stdout_clamav = execSync(clamav, {encoding:'utf-8'});
	return `${stdout_clamav}`;
  },

  clamscan : () => {
	const clamscans = '~/Node/bin/node /home/coderlava/marvel-security/Antivirus.js ./';
	const stdout_clamscans = execSync(clamscans, {encoding:'utf-8'});
	return consoles;
  },

  news : () => {
	const news = 'cat /home/coderlava/Newstoday*.*';
	const stdout_news = execSync(news, {encoding:'utf-8'});
	return stdout_news;
  },

  netstat : () => { 
	const nets = 'netstat -antp';
	const stdout_networks = execSync(nets, {encoding:'utf-8'});
        return stdout_networks;
  },

  math: () => {
	const formulas = "\n\n\t∫01​∫01​1−xy1​dxdy=6π2​\n\tiℏ∂t∂​∣Ψ⟩=H^∣Ψ⟩\n\tMultiverse(θ)⇒{Un​(xn​,yn​,zn​,tn​):1≤n≤N}\n\t∣Ψuniverse​⟩=i∑​αi​∣Ψworld i​⟩";
	return formulas;
  },

  monitor: () => {
	const monitors = "~/Node/bin/node /home/coderlava/Box/ServerMonitoringHardwareTrojan.js";
	const stdout_monitors = execSync(monitors, {encoding:'utf-8'});
	return "Monitor for hardware trojan attacks is now <active!>\n\n" + stdout_monitors;
  },

  force: () => {
	const forces = "~/Node/bin/node /home/coderlava/marvel-random/FightingForce.js";
	const stdout_forces = execSync(forces, {encoding:'utf-8'});
	return "Fighting force run successfully!\n\n" + stdout_forces;
  },

  food: () => {
	const foods = "~/Node/bin/node /home/coderlava/marvel-random/Food.js";
	const stdout_foods = execSync(foods, {encoding:'utf-8'});
	return stdout_foods;
  },

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

  ping: async (args) => {
    const pings = `ping -c 1 ${args[0]}`;
    const stdout_pings = execSync(pings, {encoding:'utf-8'});
    return stdout_pings;
  },

  echo: (args) => args.join(' ') || '',
  connect : () => { return execSync('ssh --help', {encoding:'utf-8'}); },
  date: () => new Date().toString(),
  whoami: () => os.userInfo().username,
  hostname: () => os.hostname(),
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
    data: `Coderlava Fedora CLI v1.0 — ${os.platform()} ${os.release()}
Type 'help' for marvelbot commands, 'exit' to quit.\n`
  }));
  ws.send(JSON.stringify({ type: 'prompt' }));

  ws.on('message', async (raw) => {
    const input = raw.toString().trim();
    if (!input) return;

    const [cmd, ...args] = input.split(/\s+/);

    // Echo the typed command
    ws.send(JSON.stringify({ type: 'output', data: `marvelbot> ${input}\n` }));

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

server.listen(8001, () => console.log('CLI at http://localhost:8001'));   
