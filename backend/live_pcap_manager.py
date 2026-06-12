# live_pcap_manager.py

import os
import time
import threading
import logging
from scapy.all import PcapWriter # Only PcapWriter is needed here

logger = logging.getLogger(__name__)

# --- Global State for Live PCAP Saving ---
live_save_active = False
live_save_filename_prefix = "live_capture"
live_save_max_size_mb = 5 # Default max size per file in MB
current_pcap_writer = None # Scapy PcapWriter object
current_pcap_file_index = 0
current_pcap_filepath = None # Full path to the currently active live PCAP file
live_save_lock = threading.Lock() # To protect access to shared live save variables

LIVE_CAPTURE_FOLDER = 'live_captures' # Folder for live saved PCAP files

# Ensure the live capture directory exists
if not os.path.exists(LIVE_CAPTURE_FOLDER):
    os.makedirs(LIVE_CAPTURE_FOLDER)
    logger.info(f"Created live capture directory: {LIVE_CAPTURE_FOLDER}")

# --- Live PCAP File Management Functions ---
def initialize_live_pcap_writer(prefix, max_size_mb):
    """
    Initializes a new PcapWriter, handling file rotation.
    Closes any existing writer before opening a new one.
    """
    global current_pcap_writer, current_pcap_file_index, current_pcap_filepath
    global live_save_filename_prefix, live_save_max_size_mb

    with live_save_lock:
        live_save_filename_prefix = prefix
        live_save_max_size_mb = max_size_mb

        if current_pcap_writer:
            current_pcap_writer.close()
            logger.debug(f"Closed previous live PCAP writer: {current_pcap_filepath}")

        current_pcap_file_index += 1
        timestamp = int(time.time())
        # Format with timestamp and sequential index
        filename = f"{live_save_filename_prefix}_{timestamp}_{current_pcap_file_index:04d}.pcap"
        current_pcap_filepath = os.path.join(LIVE_CAPTURE_FOLDER, filename)
        
        try:
            # PcapWriter(fname, append=True, sync=True) - sync flushes to disk immediately
            current_pcap_writer = PcapWriter(current_pcap_filepath, append=True, sync=True)
            logger.info(f"Opened new live PCAP file for writing: {current_pcap_filepath}")
        except Exception as e:
            logger.error(f"Failed to open live PCAP file {current_pcap_filepath}: {e}", exc_info=True)
            current_pcap_writer = None # Ensure it's None on failure
            raise # Re-raise to signal failure to the calling function

def write_packet_to_live_pcap(packet):
    """
    Writes a packet to the current live PCAP file and checks for rotation.
    """
    global current_pcap_writer, current_pcap_filepath, live_save_max_size_mb

    with live_save_lock: # Protect access to writer and file path/size
        if not current_pcap_writer:
            logger.warning("Attempted to write packet, but no live PCAP writer is active.")
            return

        try:
            current_pcap_writer.write(packet)
            
            # Check file size for rotation
            if current_pcap_filepath and os.path.exists(current_pcap_filepath):
                current_size_bytes = os.path.getsize(current_pcap_filepath)
                max_size_bytes = live_save_max_size_mb * 1024 * 1024 # Convert MB to bytes
                
                if current_size_bytes >= max_size_bytes:
                    logger.info(f"Live PCAP file {current_pcap_filepath} reached max size ({live_save_max_size_mb} MB). Rotating...")
                    initialize_live_pcap_writer(live_save_filename_prefix, live_save_max_size_mb) # Rotate to a new file
        except Exception as e:
            logger.error(f"Error writing packet to live PCAP file {current_pcap_filepath}: {e}", exc_info=True)
            # On write error, consider stopping live save to prevent further issues
            # For now, we'll log, but a more robust solution might include stopping capture
            # or signaling an error back to the frontend.

def close_live_pcap_writer():
    """
    Closes the current PcapWriter and resets global states.
    """
    global current_pcap_writer, current_pcap_file_index, current_pcap_filepath
    with live_save_lock:
        if current_pcap_writer:
            current_pcap_writer.close()
            logger.info(f"Closed live PCAP writer: {current_pcap_filepath}")
            current_pcap_writer = None
            current_pcap_file_index = 0 # Reset index for next capture session
            current_pcap_filepath = None

def set_live_save_active(active_status):
    """Sets the global live_save_active status."""
    global live_save_active
    live_save_active = active_status
    logger.debug(f"Live save active status set to: {live_save_active}")

def get_live_save_status():
    """Returns the current live_save_active status."""
    return live_save_active