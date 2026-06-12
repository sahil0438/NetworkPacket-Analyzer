# server.py

from flask import Flask, request, jsonify, send_file, after_this_request
from flask_sock import Sock
from flask_cors import CORS
# Scapy imports needed in server.py
from scapy.all import sniff, IP, TCP, UDP, ICMP, Ether, Dot11, ARP, Raw, rdpcap, wrpcap, IPv6, show_interfaces
from scapy.layers.inet6 import _ICMPv6 as ICMPv6
from scapy.layers.sctp import SCTP
from scapy.layers.dot11 import Dot11Elt

import json
import time
import threading
import uuid
import os
import tempfile
from werkzeug.utils import secure_filename
import logging

try:
    import live_pcap_manager
except ImportError:
    logging.warning("Could not import live_pcap_manager. Live PCAP saving functionality might be unavailable.")
    live_pcap_manager = None

logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s (%(name)s): %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)
sock = Sock(app)

# IMPORTANT: Manually set your desired interface here
# You can find available interfaces by running 'python' and then 'from scapy.all import show_interfaces; show_interfaces()'
# Or by using network tools like 'ipconfig' (Windows) or 'ifconfig' (Linux/macOS)
# Example values: "Ethernet", "Wi-Fi", "eth0", "en0", "wlan0"
INTERFACE_TO_SNIFF = "Wi-Fi"  # <--- SET YOUR INTERFACE HERE

UPLOAD_FOLDER = 'uploads'

ALLOWED_EXTENSIONS = {'pcap', 'cap', 'pcapng'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- Packet Parsing Logic (remains the same) ---
def parse_packet(packet):
    timestamp = time.time()
    protocol = "N/A"
    length = len(packet)
    info = ""
    source_ip = "N/A"
    dest_ip = "N/A"
    source_port = "N/A"
    dest_port = "N/A"

    IPV6_NEXT_HEADER_MAP = {
        0: "Hop-by-Hop Options", 1: "ICMPv4", 2: "IGMPv4", 6: "TCP", 17: "UDP",
        43: "Routing Header", 44: "Fragment Header", 50: "ESP", 51: "AH",
        58: "ICMPv6", 59: "No Next Header", 60: "Destination Options",
        132: "SCTP",
    }

    if packet.haslayer(IP):
        source_ip = packet[IP].src
        dest_ip = packet[IP].dst
        if packet.haslayer(TCP):
            protocol = "TCP"
            source_port = packet[TCP].sport
            dest_port = packet[TCP].dport
            info = f"{source_ip}:{source_port} -> {dest_ip}:{dest_port} TCP Flags: {packet[TCP].flags}"
        elif packet.haslayer(UDP):
            protocol = "UDP"
            source_port = packet[UDP].sport
            dest_port = packet[UDP].dport
            info = f"{source_ip}:{source_port} -> {dest_ip}:{dest_port} UDP"
        elif packet.haslayer(ICMP):
            protocol = "ICMPv4"
            info = f"{source_ip} -> {dest_ip} ICMP Type: {packet[ICMP].type}"
        else:
            protocol = packet[IP].proto
            info = f"{source_ip} -> {dest_ip} IP Protocol: {protocol}"
    elif packet.haslayer(IPv6):
        source_ip = packet[IPv6].src
        dest_ip = packet[IPv6].dst
        if packet.haslayer(TCP):
            protocol = "TCPv6"
            source_port = packet[TCP].sport
            dest_port = packet[TCP].dport
            info = f"{source_ip}:{source_port} -> {dest_ip}:{dest_port} TCPv6 Flags: {packet[TCP].flags}"
        elif packet.haslayer(UDP):
            protocol = "UDPv6"
            source_port = packet[UDP].sport
            dest_port = packet[UDP].dport
            info = f"{source_ip}:{source_port} -> {dest_ip}:{dest_port} UDPv6"
        elif packet.haslayer(ICMPv6):
            protocol = "ICMPv6"
            info = f"{source_ip} -> {dest_ip} ICMPv6 Type: {packet[ICMPv6].type}"
        elif packet.haslayer(SCTP):
            protocol = "SCTPv6"
            source_port = packet[SCTP].sport
            dest_port = packet[SCTP].dport
            info = f"{source_ip}:{source_port} -> {dest_ip}:{dest_port} SCTPv6"
        else:
            nh_value = packet[IPv6].nh
            protocol = IPV6_NEXT_HEADER_MAP.get(nh_value, f"IPv6-NH:{nh_value}")
            info = f"{source_ip} -> {dest_ip} IPv6 Protocol: {protocol}"
    elif packet.haslayer(ARP):
        protocol = "ARP"
        info = f"ARP: {packet[ARP].psrc} -> {packet[ARP].pdst}"
        source_ip = packet[ARP].psrc
        dest_ip = packet[ARP].pdst
    elif packet.haslayer(Ether):
        protocol = "Ethernet"
        info = f"{packet.summary()}"
    elif packet.haslayer(Dot11):
        protocol = "Dot11"
        info = packet.summary()
        if Dot11Elt in packet and packet[Dot11Elt].ID == 0:
             info += f" SSID: {packet[Dot11Elt].info.decode(errors='ignore')}"
    elif packet.haslayer(Raw):
        protocol = "Raw"
        info = "Raw Data"
    else:
        info = packet.summary()
        if "TCP" in info: protocol = "TCP"
        elif "UDP" in info: protocol = "UDP"
        elif "ICMP" in info: protocol = "ICMP"
        elif "IP" in info: protocol = "IP"
        elif "ARP" in info: protocol = "ARP"
        elif "IPv6" in info: protocol = "IPv6"
        elif "DNS" in info: protocol = "DNS"
        elif "SCTP" in info: protocol = "SCTP"
        else: protocol = packet.name

    packet_data = {
        "id": str(uuid.uuid4()), "timestamp": timestamp, "protocol": str(protocol),
        "length": length, "sourceIP": str(source_ip), "destIP": str(dest_ip),
        "sourcePort": str(source_port), "destPort": str(dest_port),
        "info": str(info), "data": packet.build().hex()
    }
    return packet_data

# --- Live Sniffing Logic ---
sniff_active = False
sniff_thread = None
connected_websockets = set()

# Function that runs in a separate thread for sniffing
def sniff_packets_thread(interface, stop_event, clients):
    global sniff_active
    logger.info(f"Starting live sniffing thread on interface: {interface}")

    sniff_active = True
    stop_event.clear()

    def packet_callback(packet):
        parsed_packet = parse_packet(packet)
        message = {"type": "packet", "data": parsed_packet}
        
        for ws in list(clients):
            try:
                ws.send(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending packet to client (WebSocket probably closed): {e}")
                clients.discard(ws)

        if live_pcap_manager and live_pcap_manager.get_live_save_status():
            live_pcap_manager.write_packet_to_live_pcap(packet)

    try:
        while not stop_event.is_set():
            logger.debug(f"Sniffing iteration started on interface: {interface}...")
            sniff(iface=interface, prn=packet_callback, store=0, timeout=1) 

            if stop_event.is_set():
                logger.debug("Stop event detected during sniffing loop. Exiting loop.")
                break

    except Exception as e:
        logger.critical(f"Scapy sniffing failed in thread: {e}", exc_info=True)
        for ws in list(clients):
            try:
                ws.send(json.dumps({"type": "error", "message": f"Server-side sniffing error: {e}"}))
            except Exception as inner_e:
                logger.error(f"Error sending error to client: {inner_e}")

    finally:
        logger.info(f"Stopped sniffing on interface: {interface}.")
        sniff_active = False
        stop_event.clear()
        if live_pcap_manager:
            live_pcap_manager.close_live_pcap_writer()

@app.route('/start', methods=['POST'])
def start_capture_route():
    global sniff_active, sniff_thread

    # The interface is now hardcoded, so we don't expect it in the request.
    # We still keep request.is_json check for consistency with frontend fetch.
    if not request.is_json:
        logger.warning("Received non-JSON request to /start. Returning 415.")
        return jsonify({"error": "Unsupported Media Type, expected application/json"}), 415

    # You can still retrieve these if your frontend sends them,
    # but the 'interface' parameter is ignored for sniffing.
    request_data = request.json
    enable_live_save = request_data.get('enableLiveSave', False)
    max_size_mb = request_data.get('maxFileSize', 5)
    filename_prefix = request_data.get('filenamePrefix', "live_capture")


    if not INTERFACE_TO_SNIFF:
        logger.error("INTERFACE_TO_SNIFF is not set in server.py.")
        return jsonify({"status": "Failed to start sniffing: Interface not configured on server"}), 500

    if not sniff_active:
        sniff_active = True
        
        if enable_live_save and not live_pcap_manager:
            logger.error("Live PCAP save requested but live_pcap_manager module not found.")
            sniff_active = False
            return jsonify({"status": "Failed to start sniffing: Live PCAP manager not available"}), 500

        if live_pcap_manager and enable_live_save: # Only initialize if enabled
            try:
                live_pcap_manager.initialize_live_pcap_writer(filename_prefix, max_size_mb)
                logger.info(f"Live PCAP saving ENABLED. Max size: {max_size_mb}MB, Prefix: {filename_prefix}")
            except Exception as e:
                sniff_active = False
                logger.error(f"Failed to initialize live PCAP saving: {e}", exc_info=True)
                return jsonify({"status": "Failed to start sniffing: PCAP save error", "error": str(e)}), 500

        stop_event = threading.Event()
        sniff_thread = threading.Thread(target=sniff_packets_thread,
                                         args=(INTERFACE_TO_SNIFF, stop_event, connected_websockets))
        sniff_thread.stop_event = stop_event
        sniff_thread.daemon = True
        sniff_thread.start()
        logger.info(f"Capture start requested on hardcoded interface: {INTERFACE_TO_SNIFF}.")
        return jsonify({"status": "Sniffing started"}), 200
    
    logger.warning("Capture already active, ignoring start request.")
    return jsonify({"status": "Sniffing already active"}), 400

@app.route('/stop', methods=['POST'])
def stop_capture_route():
    global sniff_active, sniff_thread
    if not request.is_json:
        logger.warning("Received non-JSON request to /stop. Returning 415.")
        return jsonify({"error": "Unsupported Media Type, expected application/json"}), 415

    if sniff_active and sniff_thread and sniff_thread.is_alive():
        logger.info("Capture stop requested.")
        sniff_active = False
        sniff_thread.stop_event.set()
        sniff_thread.join(timeout=10)
        if sniff_thread.is_alive():
            logger.warning("Sniffing thread did not terminate gracefully within timeout.")
        sniff_thread = None
        return jsonify({"status": "Sniffing stopped"}), 200
    logger.warning("Sniffing not active, ignoring stop request.")
    return jsonify({"status": "Sniffing not active"}), 400

# --- REMOVED: /interfaces endpoint ---
# @app.route('/interfaces', methods=['GET'])
# def get_interfaces():
#     # This endpoint is no longer needed if interface is hardcoded
#     pass

@sock.route('/ws')
def websocket_connection(ws):
    logger.debug("Entered websocket_connection function.")
    logger.info("WebSocket client connected")
    connected_websockets.add(ws)
    try:
        while True:
            message = ws.receive(timeout=60)
            if message is None:
                continue
    except Exception as e:
        logger.error(f"WebSocket error or client disconnected: {e}", exc_info=True)
    finally:
        connected_websockets.discard(ws)
        logger.info("WebSocket client disconnected")

@app.route('/upload_pcap', methods=['POST'])
def upload_pcap():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        unique_filename = str(uuid.uuid4()) + "_" + filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        try:
            file.save(filepath)
            logger.info(f"Received PCAP file: {filepath}")
            packets_from_pcap = rdpcap(filepath)
            logger.info(f"Processing {len(packets_from_pcap)} packets from PCAP...")

            for i, packet in enumerate(packets_from_pcap):
                if not connected_websockets:
                    logger.warning("No WebSocket clients connected, stopping PCAP send.")
                    break
                try:
                    parsed_packet = parse_packet(packet)
                    message = {"type": "packet", "data": parsed_packet}
                    for ws in list(connected_websockets):
                        ws.send(json.dumps(message))
                    if i % 100 == 0 and len(packets_from_pcap) > 1000:
                          time.sleep(0.01)
                except Exception as e:
                    logger.error(f"Error processing/sending packet {i} from PCAP: {e}")
            
            logger.info("Finished processing PCAP.")
            return jsonify({"status": "PCAP file processed and packets sent"}), 200

        except Exception as e:
            logger.error(f"Error processing PCAP file: {e}", exc_info=True)
            return jsonify({"error": f"Failed to process PCAP file: {e}"}), 500
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"Cleaned up temporary file: {filepath}")
        
    return jsonify({"error": "Invalid file type"}), 400

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/export_pcap', methods=['POST'])
def export_pcap_data():
    try:
        if not request.is_json:
            return jsonify({"error": "Unsupported Media Type, expected application/json"}), 415

        packets_json_data = request.json
        if not packets_json_data:
            return jsonify({"error": "No packet data provided"}), 400

        scapy_packets = []
        for p_json in packets_json_data:
            try:
                if 'data' in p_json and p_json['data']:
                    raw_bytes = bytes.fromhex(p_json['data'])
                    try:
                        scapy_packet = Ether(raw_bytes)
                    except Exception:
                        scapy_packet = Raw(raw_bytes)
                    scapy_packets.append(scapy_packet)
                else:
                    logger.debug(f"Skipping packet with no 'data' field for PCAP export: {p_json.get('id', 'N/A')}")
            except Exception as e:
                logger.error(f"Could not reconstruct Scapy packet from JSON for export (ID: {p_json.get('id', 'N/A')}): {e}", exc_info=True)
        
        if not scapy_packets:
            return jsonify({"error": "No valid packets could be reconstructed for PCAP export"}), 400

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pcap") as tmp_file:
            temp_filepath = tmp_file.name
            wrpcap(temp_filepath, scapy_packets)

        @after_this_request
        def remove_file(response):
            try:
                os.remove(temp_filepath)
                logger.info(f"Cleaned up temporary PCAP file: {temp_filepath}")
            except Exception as e:
                logger.error(f"Error removing temporary file {temp_filepath}: {e}", exc_info=True)
            return response

        return send_file(
            temp_filepath,
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name=f"exported_packets_{int(time.time())}.pcap"
        )

    except Exception as e:
        logger.error(f"Error during server-side PCAP export: {e}", exc_info=True)
        return jsonify({"error": f"Server-side PCAP export failed: {e}"}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not Found'}), 404

if __name__ == '__main__':
    if not INTERFACE_TO_SNIFF:
        logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        logger.error("!!!! WARNING: INTERFACE_TO_SNIFF is not set in server.py !!!!")
        logger.error("!!!! Please set it to your desired network interface. !!!!")
        logger.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    logger.info("Server starting on http://0.0.0.0:5000")
    logger.info("WebSocket available on ws://0.0.0.0:5000/ws")
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False, threaded=True)