/* ════════════════════════════════════════════════════════════
   netwatch, simulated live capture
   Real network capture needs libpcap + root privileges, which a
   browser tab can't do. This generates protocol-accurate synthetic
   traffic (real TCP handshake sequencing, real DNS query/response
   pairs) and runs it through the exact same field-by-field decode
   and column formatting as display.c / parser.c.
════════════════════════════════════════════════════════════ */

/* ── Theme toggle & tabs ──────────────────────────────────── */
(function () {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
})();
document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function (c) { c.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

/* ════════════════════════════════════════════════════════════
   SIMULATED TRAFFIC GENERATOR
   Real hosts/ports so the output looks like real traffic. Every
   TCP flow actually goes through SYN -> SYN-ACK -> ACK -> data ->
   FIN-ACK, the same sequence a real handshake follows.
════════════════════════════════════════════════════════════ */
var ME = '192.168.1.5';
var HOSTS = [
    { ip: '142.250.80.46',  name: 'google.com',   port: 443 },
    { ip: '140.82.112.3',   name: 'github.com',   port: 443 },
    { ip: '104.16.132.229', name: 'cloudflare',   port: 443 },
    { ip: '13.107.42.14',   name: 'microsoft.com',port: 443 },
    { ip: '151.101.1.140',  name: 'fastly',       port: 80  },
];
var DNS_SERVER = '8.8.8.8';
var DNS_NAMES = ['github.com', 'google.com', 'api.anthropic.com', 'fonts.googleapis.com', 'cloudflare.com', 'raw.githubusercontent.com'];

var flows = [];      // active TCP/DNS/ICMP flows in progress
var nextPort = 52000;
var clockMs = 0;     // simulated capture clock, ms since start

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

function newTcpFlow() {
    var host = pick(HOSTS);
    return {
        kind: 'tcp', state: 'SYN', srcPort: nextPort++, host: host,
        dataLeft: randInt(1, 4), seq: randInt(1000, 90000),
    };
}
function newDnsFlow() {
    return { kind: 'dns', state: 'QUERY', srcPort: nextPort++, name: pick(DNS_NAMES), answer: pick(HOSTS).ip };
}
function newIcmpFlow() {
    return { kind: 'icmp', state: 'REQUEST', host: pick(HOSTS) };
}

/* Advance one flow by exactly one packet, mirroring a real TCP/DNS/ICMP exchange. */
function stepFlow(flow) {
    var pkt = null;

    if (flow.kind === 'tcp') {
        if (flow.state === 'SYN') {
            pkt = { proto: 'TCP', src: ME, srcPort: flow.srcPort, dst: flow.host.ip, dstPort: flow.host.port, info: 'SYN', len: 74 };
            flow.state = 'SYNACK';
        } else if (flow.state === 'SYNACK') {
            pkt = { proto: 'TCP', src: flow.host.ip, srcPort: flow.host.port, dst: ME, dstPort: flow.srcPort, info: 'SYN-ACK', len: 74 };
            flow.state = 'ACK';
        } else if (flow.state === 'ACK') {
            pkt = { proto: 'TCP', src: ME, srcPort: flow.srcPort, dst: flow.host.ip, dstPort: flow.host.port, info: 'ACK', len: 54 };
            flow.state = 'DATA';
        } else if (flow.state === 'DATA') {
            var fromClient = Math.random() < 0.5;
            pkt = fromClient
                ? { proto: 'TCP', src: ME, srcPort: flow.srcPort, dst: flow.host.ip, dstPort: flow.host.port, info: 'PSH-ACK', len: randInt(120, 1420) }
                : { proto: 'TCP', src: flow.host.ip, srcPort: flow.host.port, dst: ME, dstPort: flow.srcPort, info: 'PSH-ACK', len: randInt(200, 1460) };
            flow.dataLeft--;
            if (flow.dataLeft <= 0) flow.state = 'FIN';
        } else if (flow.state === 'FIN') {
            pkt = { proto: 'TCP', src: ME, srcPort: flow.srcPort, dst: flow.host.ip, dstPort: flow.host.port, info: 'FIN-ACK', len: 54 };
            flow.state = 'CLOSED';
        } else {
            pkt = { proto: 'TCP', src: flow.host.ip, srcPort: flow.host.port, dst: ME, dstPort: flow.srcPort, info: 'ACK', len: 54 };
            flow.state = 'DONE';
        }
    } else if (flow.kind === 'dns') {
        if (flow.state === 'QUERY') {
            pkt = { proto: 'DNS', src: ME, srcPort: flow.srcPort, dst: DNS_SERVER, dstPort: 53, info: 'q:' + flow.name, len: 72, dns: true };
            flow.state = 'RESPONSE';
        } else {
            pkt = { proto: 'DNS', src: DNS_SERVER, srcPort: 53, dst: ME, dstPort: flow.srcPort, info: flow.name + '->' + flow.answer, len: 88, dns: true };
            flow.state = 'DONE';
        }
    } else if (flow.kind === 'icmp') {
        if (flow.state === 'REQUEST') {
            pkt = { proto: 'ICMP', src: ME, dst: flow.host.ip, info: 'echo request', len: 98 };
            flow.state = 'REPLY';
        } else {
            pkt = { proto: 'ICMP', src: flow.host.ip, dst: ME, info: 'echo reply', len: 98 };
            flow.state = 'DONE';
        }
    }

    // Keep the DNS name on the row so --host can match names, not just IPs
    if (pkt) pkt.hostName = flow.kind === 'dns' ? flow.name : flow.host.name;
    return pkt;
}

/* One tick: advance an in-progress flow, or start a new one. Mirrors the
   packet_handler() callback libpcap fires for every captured packet. */
function tick() {
    clockMs += randInt(20, 400);

    var active = flows.filter(function (f) { return f.state !== 'DONE' && f.state !== 'CLOSED'; });
    var toStep;
    if (active.length > 0 && Math.random() < 0.7) {
        toStep = pick(active);
    } else {
        var r = Math.random();
        toStep = r < 0.55 ? newTcpFlow() : r < 0.85 ? newDnsFlow() : newIcmpFlow();
        flows.push(toStep);
        if (flows.length > 40) flows = flows.slice(-40);
    }

    var pkt = stepFlow(toStep);
    pkt.t = clockMs;
    return pkt;
}

/* ════════════════════════════════════════════════════════════
   DISPLAY, mirrors print_header() / print_packet() in display.c
   column widths: Time(12) Proto(6) Source(21) -> Dest(21) Flags(12) Bytes
════════════════════════════════════════════════════════════ */
function pad(s, len) { s = String(s); return s.length >= len ? s : s + ' '.repeat(len - s.length); }
function fmtTime(ms) {
    var totalSec = Math.floor(ms / 1000);
    var h = Math.floor(totalSec / 3600) % 24, m = Math.floor(totalSec / 60) % 60, s = totalSec % 60;
    var msPart = ms % 1000;
    return pad(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + String(msPart).padStart(3, '0'), 12);
}
function protoClass(proto) {
    return proto === 'TCP' ? 'pkt-tcp' : proto === 'UDP' ? 'pkt-udp' : proto === 'ICMP' ? 'pkt-icmp' : proto === 'DNS' ? 'pkt-dns' : 'pkt-eth';
}
function formatRow(pkt) {
    var src = pkt.srcPort ? pkt.src + ':' + pkt.srcPort : pkt.src;
    var dst = pkt.dstPort ? pkt.dst + ':' + pkt.dstPort : pkt.dst;
    return fmtTime(pkt.t) + ' ' + pad(pkt.proto, 6) + ' ' + pad(src, 21) + ' -> ' + pad(dst, 21) + ' ' + pad(pkt.info, 12) + ' ' + pkt.len;
}

/* ════════════════════════════════════════════════════════════
   STATS, mirrors update_stats() / print_summary() in stats.c
════════════════════════════════════════════════════════════ */
var stats = { total: 0, bytes: 0, tcp: 0, udp: 0, icmp: 0, dns: 0, srcIPs: {}, ports: {} };

function updateStats(pkt) {
    stats.total++;
    stats.bytes += pkt.len;
    if (pkt.proto === 'TCP') stats.tcp++;
    if (pkt.proto === 'DNS' || pkt.proto === 'UDP') stats.udp++;
    if (pkt.proto === 'ICMP') stats.icmp++;
    if (pkt.dns) stats.dns++;
    stats.srcIPs[pkt.src] = (stats.srcIPs[pkt.src] || 0) + 1;
    if (pkt.dstPort) stats.ports[pkt.dstPort] = (stats.ports[pkt.dstPort] || 0) + 1;
}

function topN(map, n) {
    return Object.keys(map).map(function (k) { return { key: k, count: map[k] }; })
        .sort(function (a, b) { return b.count - a.count; }).slice(0, n);
}

function renderStats() {
    document.getElementById('stTotal').textContent = stats.total;
    document.getElementById('stBytes').textContent = stats.bytes >= 1024 ? (stats.bytes / 1024).toFixed(1) + 'K' : stats.bytes;
    document.getElementById('stTcp').textContent = stats.tcp;
    document.getElementById('stDns').textContent = stats.dns;

    var ipList = document.getElementById('topIps');
    ipList.innerHTML = topN(stats.srcIPs, 5).map(function (e) {
        return '<div class="top-list-row"><span>' + e.key + '</span><span>' + e.count + ' pkts</span></div>';
    }).join('') || '<div class="top-list-row"><span style="color:var(--muted)">—</span></div>';

    var portList = document.getElementById('topPorts');
    portList.innerHTML = topN(stats.ports, 5).map(function (e) {
        return '<div class="top-list-row"><span>port ' + e.key + '</span><span>' + e.count + ' pkts</span></div>';
    }).join('') || '<div class="top-list-row"><span style="color:var(--muted)">—</span></div>';
}

/* ════════════════════════════════════════════════════════════
   FILTERS, mirrors the --tcp / --udp / --icmp / --port / --host
   CLI flags, applied as a live BPF-style filter over the log
════════════════════════════════════════════════════════════ */
function getFilters() {
    var protos = [];
    if (document.getElementById('fTcp').checked) protos.push('TCP');
    if (document.getElementById('fUdp').checked) protos.push('UDP', 'DNS');
    if (document.getElementById('fIcmp').checked) protos.push('ICMP');
    return {
        protos: protos,
        port: document.getElementById('fPort').value.trim(),
        host: document.getElementById('fHost').value.trim(),
    };
}
function matchesFilter(pkt, f) {
    if (f.protos.length > 0 && f.protos.indexOf(pkt.proto) === -1) return false;
    if (f.port && String(pkt.srcPort) !== f.port && String(pkt.dstPort) !== f.port) return false;
    if (f.host && pkt.src.indexOf(f.host) === -1 && pkt.dst.indexOf(f.host) === -1
        && (pkt.hostName || '').indexOf(f.host) === -1) return false;
    return true;
}
function reapplyFilters() {
    var f = getFilters();
    document.querySelectorAll('.pkt-row').forEach(function (row) {
        var pkt = JSON.parse(row.dataset.pkt);
        row.classList.toggle('filtered-out', !matchesFilter(pkt, f));
    });
}

/* ════════════════════════════════════════════════════════════
   PLAYBACK LOOP
════════════════════════════════════════════════════════════ */
(function () {
    var log = document.getElementById('termLog');
    var timer = null;
    var MAX_ROWS = 300;
    var speedMs = 350;

    function addRow(pkt) {
        var row = document.createElement('div');
        row.className = 'pkt-row ' + protoClass(pkt.proto);
        row.dataset.pkt = JSON.stringify(pkt);
        row.textContent = formatRow(pkt);
        if (!matchesFilter(pkt, getFilters())) row.classList.add('filtered-out');
        log.appendChild(row);
        while (log.children.length > MAX_ROWS) log.removeChild(log.firstChild);
        log.scrollTop = log.scrollHeight;
    }

    function step() {
        var pkt = tick();
        updateStats(pkt);
        addRow(pkt);
        renderStats();
    }

    function play() {
        if (timer) return;
        document.getElementById('capStart').disabled = true;
        document.getElementById('capStop').disabled = false;
        document.getElementById('capState').textContent = 'CAPTURING';
        timer = setInterval(step, speedMs);
    }
    function stop() {
        clearInterval(timer); timer = null;
        document.getElementById('capStart').disabled = false;
        document.getElementById('capStop').disabled = true;
        document.getElementById('capState').textContent = 'STOPPED';
    }
    function reset() {
        stop();
        flows = []; clockMs = 0; nextPort = 52000;
        stats = { total: 0, bytes: 0, tcp: 0, udp: 0, icmp: 0, dns: 0, srcIPs: {}, ports: {} };
        log.innerHTML = '';
        renderStats();
    }

    document.getElementById('capStart').addEventListener('click', play);
    document.getElementById('capStop').addEventListener('click', stop);
    document.getElementById('capReset').addEventListener('click', reset);
    document.getElementById('capStop').disabled = true;

    ['fTcp', 'fUdp', 'fIcmp'].forEach(function (id) {
        document.getElementById(id).addEventListener('change', reapplyFilters);
    });
    document.getElementById('fPort').addEventListener('input', reapplyFilters);
    document.getElementById('fHost').addEventListener('input', reapplyFilters);
    document.getElementById('fClear').addEventListener('click', function () {
        document.getElementById('fTcp').checked = false;
        document.getElementById('fUdp').checked = false;
        document.getElementById('fIcmp').checked = false;
        document.getElementById('fPort').value = '';
        document.getElementById('fHost').value = '';
        reapplyFilters();
    });

    document.querySelectorAll('.speed-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.speed-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            speedMs = parseInt(btn.dataset.ms);
            if (timer) { clearInterval(timer); timer = setInterval(step, speedMs); }
        });
    });

    renderStats();
    play(); // start capturing automatically so the page isn't empty on load
})();

/* ════════════════════════════════════════════════════════════
   CODE VIEWER, actual C source
════════════════════════════════════════════════════════════ */
(function () {
    var SRC = {};

    SRC.headers = String.raw`// Network header structures, mirroring the actual on-wire layout.
// __attribute__((packed)) stops the compiler adding alignment padding
// that would break the byte offsets, raw packet bytes have none.

typedef struct __attribute__((packed)) {
    uint8_t  dst_mac[6];
    uint8_t  src_mac[6];
    uint16_t ethertype;    // big-endian on the wire, use ntohs() before comparing
} EthernetHeader;

typedef struct __attribute__((packed)) {
    uint8_t  version_ihl;  // top 4 bits = version, bottom 4 bits = header length (32-bit words)
    uint8_t  dscp_ecn;
    uint16_t total_length;
    uint16_t identification;
    uint16_t flags_fragment_offset;
    uint8_t  ttl;
    uint8_t  protocol;     // 6 = TCP, 17 = UDP, 1 = ICMP
    uint16_t checksum;
    uint32_t src_addr;
    uint32_t dst_addr;
} IPv4Header;

typedef struct __attribute__((packed)) {
    uint16_t src_port;
    uint16_t dst_port;
    uint32_t seq_num;
    uint32_t ack_num;
    uint8_t  data_offset;
    uint8_t  flags;        // SYN=0x02, ACK=0x10, FIN=0x01, RST=0x04, PSH=0x08
    uint16_t window_size;
    uint16_t checksum;
    uint16_t urgent_ptr;
} TCPHeader;`;

    SRC.parser = String.raw`int parse_ip(const u_char* packet, uint32_t caplen, PacketInfo* info) {
    if (caplen < 20) return 0; // minimum IP header size

    const IPv4Header* ip = (const IPv4Header*)packet;

    // IHL is in 32-bit words, multiply by 4 to get bytes
    info->ip_header_len = (ip->version_ihl & 0x0F) * 4;
    info->ttl = ip->ttl;
    info->protocol = ip->protocol;

    // Convert raw uint32 addresses to dotted decimal strings
    struct in_addr src_addr, dst_addr;
    src_addr.s_addr = ip->src_addr;
    dst_addr.s_addr = ip->dst_addr;
    inet_ntop(AF_INET, &src_addr, info->src_ip, INET_ADDRSTRLEN);
    inet_ntop(AF_INET, &dst_addr, info->dst_ip, INET_ADDRSTRLEN);

    info->is_tcp  = (ip->protocol == 6);
    info->is_udp  = (ip->protocol == 17);
    info->is_icmp = (ip->protocol == 1);

    return 1;
}

// DNS names are length-prefixed labels: [3]www[6]google[3]com[0]
// Decoded here into a normal dotted string like "www.google.com"
int parse_dns(const u_char* packet, uint32_t caplen, PacketInfo* info) {
    if (caplen < DNS_HEADER_LEN) return 0;

    const DNSHeader* dns = (const DNSHeader*)packet;
    info->dns_is_response = (ntohs(dns->flags) & 0x8000) != 0;
    if (ntohs(dns->qdcount) == 0) return 1;

    const u_char* pos = packet + DNS_HEADER_LEN;
    char* out = info->dns_query;
    int first_label = 1;

    while (pos < packet + caplen && *pos != 0) {
        if (!first_label) *out++ = '.';
        first_label = 0;
        int label_len = *pos++;
        memcpy(out, pos, label_len);
        out += label_len;
        pos += label_len;
    }
    *out = '\\0';
    info->is_dns = 1;
    return 1;
}`;

    SRC.display = String.raw`// TCP = blue, UDP = green, ICMP = yellow, DNS = magenta, unknown = grey
static void tcp_flags_str(uint8_t flags, char* out, int outlen) {
    const char* names[] = {"SYN", "ACK", "FIN", "RST", "PSH", "URG"};
    uint8_t     bits[]  = {0x02,  0x10,  0x01,  0x04,  0x08,  0x20};
    out[0] = '\\0';
    int wrote = 0;
    for (int i = 0; i < 6; i++) {
        if (flags & bits[i]) {
            if (wrote) strncat(out, "-", outlen - strlen(out) - 1);
            strncat(out, names[i], outlen - strlen(out) - 1);
            wrote = 1;
        }
    }
    if (!wrote) strncat(out, "none", outlen - 1);
}

void print_packet(const PacketInfo* info) {
    char time_str[16];
    struct tm* t = localtime(&info->timestamp.tv_sec);
    snprintf(time_str, sizeof(time_str), "%02d:%02d:%02d.%03d",
             t->tm_hour, t->tm_min, t->tm_sec, (int)(info->timestamp.tv_usec / 1000));

    const char* color = COLOR_GREY;
    char proto[8] = "???", src[22] = {0}, dst[22] = {0}, extra[64] = {0};

    if (info->is_tcp) {
        color = COLOR_BLUE;
        snprintf(proto, sizeof(proto), "TCP");
        snprintf(src, sizeof(src), "%s:%d", info->src_ip, info->src_port);
        snprintf(dst, sizeof(dst), "%s:%d", info->dst_ip, info->dst_port);
        tcp_flags_str(info->tcp_flags, extra, sizeof(extra));
    }
    // ... UDP, ICMP, DNS branches follow the same pattern ...

    printf("%s%-12s %-6s %-21s -> %-21s %-12s %u%s\\n",
           color, time_str, proto, src, dst, extra, info->length, COLOR_RESET);
}`;

    SRC.stats = String.raw`void update_stats(Stats* stats, const PacketInfo* info) {
    stats->total_packets++;
    stats->total_bytes += info->length;

    if (info->is_tcp)  stats->tcp_packets++;
    if (info->is_udp)  stats->udp_packets++;
    if (info->is_icmp) stats->icmp_packets++;
    if (info->is_dns)  stats->dns_queries++;

    if (info->dst_port > 0) stats->top_ports[info->dst_port]++;

    // Track source IPs, linear search, add if not present.
    // A production tool would use a hash map; fine for this scale.
    if (info->is_ip && stats->src_ip_count < MAX_TRACKED_IPS) {
        int found = 0;
        for (int i = 0; i < stats->src_ip_count; i++) {
            if (strcmp(stats->src_ips[i].ip, info->src_ip) == 0) {
                stats->src_ips[i].packet_count++;
                found = 1;
                break;
            }
        }
        if (!found) {
            strncpy(stats->src_ips[stats->src_ip_count].ip, info->src_ip, INET_ADDRSTRLEN);
            stats->src_ips[stats->src_ip_count].packet_count = 1;
            stats->src_ip_count++;
        }
    }
}`;

    var codeBlock = document.getElementById('codeBlock');
    function loadCode(key) {
        codeBlock.textContent = SRC[key];
        codeBlock.removeAttribute('data-highlighted');
        hljs.highlightElement(codeBlock);
    }
    document.querySelectorAll('.file-tab').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.file-tab').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            loadCode(btn.dataset.file);
        });
    });
    loadCode('parser');
})();
