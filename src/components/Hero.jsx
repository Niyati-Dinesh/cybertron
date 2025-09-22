import { Shield, Eye, Network, HardDrive, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h1 className="font-serif text-5xl lg:text-6xl font-normal text-white mb-6 leading-tight">
          Security Information &<br />
          Event Management
        </h1>

        <p className="font-sans text-lg text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
          Monitor system processes, network activity, and device connections
          with real-time threat detection and automated security responses.
        </p>

        <Link to="/user">
          {" "}
          <button className="font-sans bg-white text-black px-8 py-3 rounded font-medium hover:bg-gray-100 transition-colors mb-16">
            Start Monitoring
          </button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-left">
          <div>
            <div className="flex items-center mb-3">
              <Eye className="w-5 h-5 text-white mr-3" />
              <h3 className="font-sans text-white font-medium">
                Process Scanner
              </h3>
            </div>
            <p className="font-sans text-sm text-gray-400 leading-relaxed">
              Monitor running processes and flag suspicious activities
            </p>
          </div>

          <div>
            <div className="flex items-center mb-3">
              <Network className="w-5 h-5 text-white mr-3" />
              <h3 className="font-sans text-white font-medium">Port Scanner</h3>
            </div>
            <p className="font-sans text-sm text-gray-400 leading-relaxed">
              Scan open ports and assess network security risks
            </p>
          </div>

          <div>
            <div className="flex items-center mb-3">
              <Shield className="w-5 h-5 text-white mr-3" />
              <h3 className="font-sans text-white font-medium">
                Device Discovery
              </h3>
            </div>
            <p className="font-sans text-sm text-gray-400 leading-relaxed">
              Detect new devices and monitor network changes
            </p>
          </div>

          <div>
            <div className="flex items-center mb-3">
              <HardDrive className="w-5 h-5 text-white mr-3" />
              <h3 className="font-sans text-white font-medium">File Hygiene</h3>
            </div>
            <p className="font-sans text-sm text-gray-400 leading-relaxed">
              Check file permissions and system integrity
            </p>
          </div>

          <div>
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-5 h-5 text-white mr-3" />
              <h3 className="font-sans text-white font-medium">
                Real-time Alerts
              </h3>
            </div>
            <p className="font-sans text-sm text-gray-400 leading-relaxed">
              Instant notifications and automated responses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
