 export const PROTOCOLS = [//'TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ARP', 'ICMP', 'FTP'
 ];

export const SOURCE_IPS = [
  // '192.168.1.100', 
  // '10.0.0.1', 
  // '172.16.0.50', 
  // '203.0.113.1', 
  // '8.8.8.8',
  // '192.168.0.105',
  // '10.0.1.50',
  // '172.16.1.100'
];

export const DEST_IPS = [
//   '192.168.1.1', 
//   '10.0.0.254', 
//   '172.16.0.1', 
//   '203.0.113.254', 
//   '8.8.4.4',
//   '192.168.0.1',
//   '10.0.1.1',
//   '172.16.1.1'
];

export const getProtocolColor = (protocol) => {
  const colors = {
    'HTTP': 'text-green-300',
    'HTTPS': 'text-blue-300',
    'DNS': 'text-purple-300',
    'TCP': 'text-yellow-300',
    'UDP': 'text-orange-300',
    'ARP': 'text-pink-300',
    'ICMP': 'text-red-300',
    'FTP': 'text-cyan-300'
  };
  return colors[protocol] || 'text-gray-300';
};

export const PACKET_CAPTURE_CONFIG = {
  MAX_PACKETS: 1000,
  MIN_INTERVAL: 500,
  MAX_INTERVAL: 2500,
  MIN_PACKET_SIZE: 64,
  MAX_PACKET_SIZE: 1500,
  HEX_DISPLAY_LIMIT: 128
};