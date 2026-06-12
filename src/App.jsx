import React from 'react';
import ControlPanel from './components/ControlPanel';
import PacketList from './components/PacketList';
import PacketDetails from './components/PacketDetails';
import ProtocolDistributionChart from "./components/charts/ProtocolDistributionChart";
import TopTalkersChart from './components/charts/TopTalkersChart';
import { usePacketCapture } from './hooks/usePacketCapture';

const App = () => {
  const {
    isCapturing,
    packets,
    packetCount,
    filter,
    setFilter,
    selectedPacket,
    setSelectedPacket,
    startCapture,
    stopCapture,
    clearPackets,
    exportPackets,
    filteredPackets,
    wsRef,
    isImporting,
    importPcap,
    isExporting
    // Removed: availableInterfaces, selectedInterface, setSelectedInterface
  } = usePacketCapture();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4 text-blue-400">
            Network Packet Analyzer
          </h1>
          
          <ControlPanel
            isCapturing={isCapturing}
            packetCount={packetCount}
            packets={packets}
            filter={filter}
            setFilter={setFilter}
            startCapture={startCapture}
            stopCapture={stopCapture}
            clearPackets={clearPackets}
            exportPackets={exportPackets}
            filteredPackets={filteredPackets}
            wsRef={wsRef}
            isImporting={isImporting}
            importPcap={importPcap}
            isExporting={isExporting}
            // Removed: availableInterfaces, selectedInterface, setSelectedInterface
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <ProtocolDistributionChart packets={packets} />
          <TopTalkersChart packets={packets} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PacketList
              packets={filteredPackets}
              allPackets={packets}
              selectedPacket={selectedPacket}
              setSelectedPacket={setSelectedPacket}
              isCapturing={isCapturing}
            />
          </div>

          <div className="lg:col-span-1">
            <PacketDetails selectedPacket={selectedPacket} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;